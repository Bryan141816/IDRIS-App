// HazardModals.tsx
import { BaseModalProps } from "../ModalProps";
import { useEffect, useRef, useState } from "react";
import { Modal } from "../../../../components/Page_Furniture/Modals";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEllipsisVertical,
  faTrash,
  faPen,
  faUpRightFromSquare,
  faImage,
} from "@fortawesome/free-solid-svg-icons";

/* =========================================================
   Types
========================================================= */
type AddProps = BaseModalProps & {
  handleAddRecord: (payload: any) => Promise<any>;
};

type ViewProps = BaseModalProps & {
  selectedData: any;
  handleDeleteRecord: (id: string) => void;
  openEditModal: () => void;
};

type EditProps = BaseModalProps & {
  selectedData: any;
  handleEditRecord: (id: string, payload: any) => void | Promise<void>;
};

/* =========================================================
   Constants
========================================================= */
const API_BASE = "http://localhost:8000";
const UPLOAD_URL = `${API_BASE}/api/files/hazards`;
const LGU_SEARCH_URL = `${API_BASE}/lgu_profiling/manage_lgu/get_lgu`;

/* =========================================================
   Helpers
========================================================= */
async function uploadHazardImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch(UPLOAD_URL, { method: "POST", body: fd });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Upload failed (${res.status}): ${txt || res.statusText}`);
  }
  const data = await res.json().catch(() => ({}));
  if (!data?.url) throw new Error("Upload succeeded but no URL returned by server.");
  return data.url as string;
}

/** Pull LGU names from the table-shaped response of /get_lgu?q=... */
async function searchLGUNames(query: string): Promise<string[]> {
  const url = new URL(LGU_SEARCH_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("page", "1");

  const res = await fetch(url.toString());
  if (!res.ok) return [];
  const json = await res.json();
  // rows look like: [Hidden(id), Text(name), Text(lat), Text(lng), Text(class), Button(View)]
  const pages = json?.table_datas ?? [];
  const names: string[] = [];
  for (const pg of pages) {
    for (const r of pg.row ?? []) {
      const data = r?.data ?? [];
      const nameCell = data[1];
      if (nameCell?.text) names.push(nameCell.text);
    }
  }
  return Array.from(new Set(names));
}

/** Debounce */
function useDebounced<T>(value: T, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

/** Heuristic: parse the row into fields without relying on fixed indexes */
function parseHazardRow(selectedData: any) {
  const cells = (selectedData?.data ?? []) as Array<{ type?: string; text?: string }>;

  const id = cells[0]?.text ?? "";
  const lastUpdated = cells[1]?.text ?? "-";

  // ignore non-textual cells
  const rest = cells.slice(2).filter((c) => c?.type !== "Button" && c?.type !== "Hidden");

  const isUrl = (s?: string) => !!s && /^https?:\/\//i.test(s.trim());

  // image url: first URL-like text
  const imgCell = rest.find((c) => isUrl(c?.text));
  const image_url = imgCell?.text ?? "";

  // non-url text cells after the first two columns are hazard_area & hazard_type (order-agnostic)
  const textCells = rest.filter((c) => !isUrl(c?.text) && (c?.text ?? "").trim() !== "");
  const hazard_area = textCells[0]?.text ?? "—";
  const hazard_type = textCells[1]?.text ?? "—";

  return { id, lastUpdated, hazard_area, hazard_type, image_url };
}

/* =========================================================
   ADD Hazard
   - LGU autocomplete fills hazard_area (LGU name)
========================================================= */
export const AddHazardModal: React.FC<AddProps> = ({
  isModalOpen,
  closeModal,
  setMessageBox,
  handleAddRecord,
}) => {
  const [form, setForm] = useState({
    lgu_name: "", // user picks LGU -> sent as hazard_area
    hazard_type: "",
    image_url: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // LGU autocomplete state
  const [lguQuery, setLguQuery] = useState("");
  const debouncedLguQuery = useDebounced(lguQuery, 250);
  const [lguOptions, setLguOptions] = useState<string[]>([]);
  const [lguLoading, setLguLoading] = useState(false);
  const [showLguList, setShowLguList] = useState(false);
  const lguBoxRef = useRef<HTMLDivElement>(null);

  // close list on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!lguBoxRef.current) return;
      if (!lguBoxRef.current.contains(e.target as Node)) setShowLguList(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // fetch LGUs when query changes
  useEffect(() => {
    let cancelled = false;
    async function run() {
      const q = debouncedLguQuery.trim();
      if (!q || q.length < 2) {
        if (!cancelled) setLguOptions([]);
        return;
      }
      setLguLoading(true);
      try {
        const opts = await searchLGUNames(q);
        if (!cancelled) setLguOptions(opts);
      } catch {
        if (!cancelled) setLguOptions([]);
      } finally {
        if (!cancelled) setLguLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [debouncedLguQuery]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target as HTMLInputElement;
    if (name === "image_file" && files && files[0]) {
      const f = files[0];
      if (f.size > 5 * 1024 * 1024) {
        setMessageBox((p: any) => ({
          ...p,
          isOpen: true,
          type: "alert",
          message: "Image too large. Please upload a file up to 5MB.",
        }));
        return;
      }
      setFile(f);
      const url = URL.createObjectURL(f);
      setPreview((old) => {
        if (old) URL.revokeObjectURL(old);
        return url;
      });
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  };

  if (!isModalOpen) return null;

  const actuallySubmit = async () => {
    try {
      setIsSubmitting(true);

      // Ensure LGU chosen
      const lguName = (form.lgu_name || "").trim();
      if (!lguName) {
        setMessageBox((p: any) => ({
          ...p,
          isOpen: true,
          type: "alert",
          message: "Please select an LGU.",
        }));
        setIsSubmitting(false);
        return;
      }

      let finalImageUrl = form.image_url?.trim() || "";
      if (file) {
        try {
          finalImageUrl = await uploadHazardImage(file);
        } catch (err: any) {
          const proceed = confirm(
            `Image upload failed.\n\n${err?.message || err}\n\nDo you want to save the record without the image?`
          );
          if (!proceed) {
            setIsSubmitting(false);
            return;
          }
          finalImageUrl = "";
        }
      }

      await handleAddRecord({
        hazard_area: lguName, // backend resolves to lgu_id
        hazard_type: form.hazard_type,
        image_url: finalImageUrl || null,
      });

      setMessageBox((p: any) => ({
        ...p,
        isOpen: true,
        type: "alert",
        message: "Hazard added successfully.",
      }));

      setForm({ lgu_name: "", hazard_type: "", image_url: "" });
      setFile(null);
      if (preview) {
        URL.revokeObjectURL(preview);
        setPreview("");
      }
      setLguQuery("");
      setLguOptions([]);
      closeModal();
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to add hazard";
      setMessageBox((p: any) => ({
        ...p,
        isOpen: true,
        type: "alert",
        message: msg,
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = () => {
    setMessageBox((prev: any) => ({
      ...prev,
      isOpen: true,
      type: "confirm",
      message: "Are you sure you want to add this hazard?",
      onSubmit: actuallySubmit,
    }));
  };

  return (
    <Modal isOpen={isModalOpen} onClose={isSubmitting ? () => {} : closeModal} zIndex={998}>
      <div className="modal-container" aria-busy={isSubmitting}>
        <div className="horizontal-container">
          <span className="details-title">Add Hazard</span>
        </div>

        {/* LGU (controls hazard_area) */}
        <div className="horizontal-container" ref={lguBoxRef}>
          <span className="item-details-identifier">LGU (Hazard Area):</span>
          <div style={{ position: "relative", width: "100%" }}>
            <input
              type="text"
              name="lgu_name"
              placeholder="Search LGU..."
              value={form.lgu_name}
              onChange={(e) => {
                setForm((p) => ({ ...p, lgu_name: e.target.value }));
                setLguQuery(e.target.value);
                setShowLguList(true);
              }}
              onFocus={() => setShowLguList(true)}
              disabled={isSubmitting}
              style={{ width: "100%" }}
            />
            {showLguList && (lguLoading || lguOptions.length > 0) && (
              <div
                style={{
                  position: "absolute",
                  zIndex: 10,
                  top: "100%",
                  left: 0,
                  right: 0,
                  background: "#fff",
                  border: "1px solid #ddd",
                  borderTop: "none",
                  maxHeight: 200,
                  overflowY: "auto",
                }}
              >
                {lguLoading ? (
                  <div style={{ padding: "8px 12px", color: "#888" }}>Searching…</div>
                ) : (
                  lguOptions.map((opt) => (
                    <div
                      key={opt}
                      onClick={() => {
                        setForm((p) => ({ ...p, lgu_name: opt }));
                        setLguQuery(opt);
                        setShowLguList(false);
                      }}
                      style={{ padding: "8px 12px", cursor: "pointer" }}
                    >
                      {opt}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="horizontal-container">
          <span className="item-details-identifier">Description:</span>
          <input
            type="text"
            name="hazard_type"
            value={form.hazard_type}
            onChange={onChange}
            disabled={isSubmitting}
          />
        </div>

        <div className="horizontal-container">
          <span className="item-details-identifier">Image (optional):</span>
          <input
            type="file"
            name="image_file"
            accept="image/*"
            onChange={onChange}
            style={{ width: "100%" }}
            disabled={isSubmitting}
          />
        </div>

        <div
          style={{
            display: "flex",
            width: "100%",
            height: "40vh",
            borderRadius: "10px",
            overflow: "hidden",
            marginTop: "10px",
            alignItems: "center",
            justifyContent: "center",
            background: "#f5f5f5",
          }}
        >
          {preview ? (
            <img
              src={preview}
              alt="preview"
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
          ) : (
            <div style={{ color: "#888" }}>
              <FontAwesomeIcon icon={faImage} /> No image selected
            </div>
          )}
        </div>

        <div className="action-button">
          <button
            style={{ backgroundColor: "#749AB6", opacity: isSubmitting ? 0.6 : 1, color: "#ffff" }}
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Add"}
          </button>
          <button
            style={{ backgroundColor: "#F84B4D", color: "#ffff" }}
            onClick={closeModal}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};

/* =========================================================
   VIEW Hazard
   Row mapping is discovered dynamically (no fixed indexes)
========================================================= */
export const ViewHazardModal: React.FC<ViewProps> = ({
  isModalOpen,
  closeModal,
  setMessageBox,
  selectedData,
  handleDeleteRecord,
  openEditModal,
}) => {
  const [isMore, setIsMore] = useState(false);

  useEffect(() => {
    if (!isModalOpen) setIsMore(false);
  }, [isModalOpen]);

  const { id, lastUpdated, hazard_area, hazard_type, image_url } = parseHazardRow(selectedData);

  if (!isModalOpen) return null;

  return (
    <Modal isOpen={isModalOpen} onClose={closeModal} zIndex={998}>
      <div className="modal-container" style={{ paddingTop: "30px" }}>
        <div className="horizontal-container space-between-container">
          <span className="title-modal-text">View Hazard</span>
          <div className="horizontal-container" style={{ width: "auto", gap: "5px" }}>
            <div className="more-options-container">
              <button onClick={() => setIsMore((v) => !v)}>
                <FontAwesomeIcon icon={faEllipsisVertical} style={{ height: "20px" }} />
              </button>
              {isMore && (
                <div className="more-options-viewer">
                  <button onClick={openEditModal}>
                    <FontAwesomeIcon icon={faPen} /> Edit Record
                  </button>
                  <button
                    style={{ color: "red" }}
                    onClick={() =>
                      setMessageBox((prev: any) => ({
                        ...prev,
                        isOpen: true,
                        type: "confirm",
                        message: "Are you sure you want to delete this record?",
                        onSubmit: () => handleDeleteRecord(id),
                      }))
                    }
                  >
                    <FontAwesomeIcon icon={faTrash} /> Delete Record
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="horizontal-container">
          <span className="details-title">Details</span>
        </div>

        <div className="horizontal-container">
          <span className="item-details-identifier">Last Updated:</span>
          <span style={{ width: "100%", textAlign: "center" }}>{lastUpdated}</span>
        </div>

        <div className="horizontal-container">
          <span className="item-details-identifier">Hazard Area:</span>
          <span style={{ width: "100%", textAlign: "center" }}>{hazard_area}</span>
        </div>

        <div className="horizontal-container">
          <span className="item-details-identifier">Description:</span>
          <span style={{ width: "100%", textAlign: "center" }}>{hazard_type}</span>
        </div>

        <div className="horizontal-container">
          <span className="item-details-identifier">Image:</span>
          <div style={{ width: "100%", textAlign: "center" }}>
            {image_url ? (
              <a href={image_url} target="_blank" rel="noreferrer" title="Open image">
                <FontAwesomeIcon icon={faUpRightFromSquare} /> Open
              </a>
            ) : (
              <span>-</span>
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            width: "100%",
            height: "40vh",
            borderRadius: "10px",
            overflow: "hidden",
            marginTop: "10px",
            alignItems: "center",
            justifyContent: "center",
            background: "#f5f5f5",
          }}
        >
          {image_url ? (
            <img
              src={image_url}
              alt="hazard"
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
              onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
            />
          ) : (
            <div style={{ color: "#888" }}>
              <FontAwesomeIcon icon={faImage} /> No image
            </div>
          )}
        </div>

        <div className="action-button">
          <button style={{ backgroundColor: "#F84B4D" }} onClick={closeModal}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

/* =========================================================
   EDIT Hazard (dynamic parsing too)
========================================================= */
export const EditHazardModal: React.FC<EditProps> = ({
  isModalOpen,
  closeModal,
  setMessageBox,
  handleEditRecord,
  selectedData,
}) => {
  const parsed = parseHazardRow(selectedData);
  const id = parsed.id;

  const [form, setForm] = useState({
    lgu_name: parsed.hazard_area, // controls hazard_area (LGU name)
    hazard_type: parsed.hazard_type === "—" ? "" : parsed.hazard_type,
    image_url: parsed.image_url || "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>(parsed.image_url || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // LGU autocomplete
  const [lguQuery, setLguQuery] = useState(form.lgu_name || "");
  const debouncedLguQuery = useDebounced(lguQuery, 250);
  const [lguOptions, setLguOptions] = useState<string[]>([]);
  const [lguLoading, setLguLoading] = useState(false);
  const [showLguList, setShowLguList] = useState(false);
  const lguBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!lguBoxRef.current) return;
      if (!lguBoxRef.current.contains(e.target as Node)) setShowLguList(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // fetch LGUs when query changes
  useEffect(() => {
    let cancelled = false;
    async function run() {
      const q = debouncedLguQuery.trim();
      if (!q || q.length < 2) {
        if (!cancelled) setLguOptions([]);
        return;
      }
      setLguLoading(true);
      try {
        const opts = await searchLGUNames(q);
        if (!cancelled) setLguOptions(opts);
      } catch {
        if (!cancelled) setLguOptions([]);
      } finally {
        if (!cancelled) setLguLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [debouncedLguQuery]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target as HTMLInputElement;
    if (name === "image_file" && files && files[0]) {
      const f = files[0];
      if (f.size > 5 * 1024 * 1024) {
        setMessageBox((p: any) => ({
          ...p,
          isOpen: true,
          type: "alert",
          message: "Image too large. Please upload a file up to 5MB.",
        }));
        return;
      }
      setFile(f);
      const url = URL.createObjectURL(f);
      setPreview((old) => {
        if (old && old.startsWith("blob:")) URL.revokeObjectURL(old);
        return url;
      });
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  };

  if (!isModalOpen) return null;

  const actuallySubmit = async () => {
    try {
      setIsSubmitting(true);

      const lguName = (form.lgu_name || "").trim();
      if (!lguName) {
        setMessageBox((p: any) => ({
          ...p,
          isOpen: true,
          type: "alert",
          message: "Please select an LGU.",
        }));
        setIsSubmitting(false);
        return;
      }

      let finalImageUrl = form.image_url?.trim() || "";
      if (file) {
        try {
          finalImageUrl = await uploadHazardImage(file);
        } catch (err: any) {
          const proceed = confirm(
            `Image upload failed.\n\n${err?.message || err}\n\nDo you want to save the changes without updating the image?`
          );
          if (!proceed) {
            setIsSubmitting(false);
            return;
          }
          finalImageUrl = form.image_url || "";
        }
      }

      await handleEditRecord(id, {
        hazard_area: lguName,           // backend resolves to lgu_id
        hazard_type: form.hazard_type,
        image_url: finalImageUrl || null,
      });

      setMessageBox((p: any) => ({
        ...p,
        isOpen: true,
        type: "alert",
        message: "Hazard updated successfully.",
      }));

      closeModal();
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to update hazard";
      setMessageBox((p: any) => ({
        ...p,
        isOpen: true,
        type: "alert",
        message: msg,
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = () => {
    setMessageBox((prev: any) => ({
      ...prev,
      isOpen: true,
      type: "confirm",
      message: "Are you sure you want to update this hazard?",
      onSubmit: actuallySubmit,
    }));
  };

  return (
    <Modal isOpen={isModalOpen} onClose={isSubmitting ? () => {} : closeModal} zIndex={998}>
      <div className="modal-container" aria-busy={isSubmitting}>
        <div className="horizontal-container">
          <span className="details-title">Update Hazard</span>
        </div>

        {/* LGU picker */}
        <div className="horizontal-container" ref={lguBoxRef}>
          <span className="item-details-identifier">LGU (Hazard Area):</span>
          <div style={{ position: "relative", width: "100%" }}>
            <input
              type="text"
              name="lgu_name"
              placeholder="Search LGU..."
              value={form.lgu_name}
              onChange={(e) => {
                setForm((p) => ({ ...p, lgu_name: e.target.value }));
                setLguQuery(e.target.value);
                setShowLguList(true);
              }}
              onFocus={() => setShowLguList(true)}
              disabled={isSubmitting}
              style={{ width: "100%" }}
            />
            {showLguList && (lguLoading || lguOptions.length > 0) && (
              <div
                style={{
                  position: "absolute",
                  zIndex: 10,
                  top: "100%",
                  left: 0,
                  right: 0,
                  background: "#fff",
                  border: "1px solid #ddd",
                  borderTop: "none",
                  maxHeight: 200,
                  overflowY: "auto",
                }}
              >
                {lguLoading ? (
                  <div style={{ padding: "8px 12px", color: "#888" }}>Searching…</div>
                ) : (
                  lguOptions.map((opt) => (
                    <div
                      key={opt}
                      onClick={() => {
                        setForm((p) => ({ ...p, lgu_name: opt }));
                        setLguQuery(opt);
                        setShowLguList(false);
                      }}
                      style={{ padding: "8px 12px", cursor: "pointer" }}
                    >
                      {opt}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="horizontal-container">
          <span className="item-details-identifier">Description:</span>
          <input
            type="text"
            name="hazard_type"
            value={form.hazard_type}
            onChange={onChange}
            disabled={isSubmitting}
          />
        </div>

        <div className="horizontal-container">
          <span className="item-details-identifier">Image (optional):</span>
          <input
            type="file"
            name="image_file"
            accept="image/*"
            onChange={onChange}
            style={{ width: "100%" }}
            disabled={isSubmitting}
          />
        </div>

        <div
          style={{
            display: "flex",
            width: "100%",
            height: "40vh",
            borderRadius: "10px",
            overflow: "hidden",
            marginTop: "10px",
            alignItems: "center",
            justifyContent: "center",
            background: "#f5f5f5",
          }}
        >
          {preview ? (
            <img
              src={preview}
              alt="preview"
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
          ) : (
            <div style={{ color: "#888" }}>
              <FontAwesomeIcon icon={faImage} /> No image
            </div>
          )}
        </div>

        <div className="action-button">
          <button
            style={{ backgroundColor: "#749AB6", opacity: isSubmitting ? 0.6 : 1 }}
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
          <button
            style={{ backgroundColor: "#F84B4D" }}
            onClick={closeModal}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};
