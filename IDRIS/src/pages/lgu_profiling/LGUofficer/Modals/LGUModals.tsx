// MyLGUModals.tsx
import { BaseModalProps } from "../ModalProps";
import { useEffect, useState } from "react";
import { Modal } from "../../../../components/Page_Furniture/Modals";
import LocationPickerModal from "../../../../components/Page_Furniture/LocationPickerModal";
import { MapWithPin } from "../ModalProps";
import { API } from "../../../../API_Handler/Axio_API_Handler";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faImage, faMapMarkerAlt, faLock } from "@fortawesome/free-solid-svg-icons";

/* ========= Types ========= */
type LGUForm = {
  name: string;
  lat: number;
  lng: number;
  classification: string;
  population: number;
  contact_info: string;
  description?: string;
  lgu_picture?: string;
  resources?: string;     // CSV in UI
  players?: string;
  schools?: string;
  gyms?: string;
  local_suppliers?: string;
};

type MyLGU = {
  id?: number | string;
  name?: string;
  lat?: number;
  lng?: number;
  classification?: string;
  population?: number;
  contact_info?: string;
  description?: string;
  lgu_picture?: string;
  resources?: string[];
  players?: string[];
  schools?: string[];
  gyms?: string[];
  local_suppliers?: string[];
};

/* ========= Helpers ========= */
const toCSV = (arr?: string[]) => (Array.isArray(arr) ? arr.join(", ") : "");
const toArray = (csv?: string) => {
  if (!csv) return undefined;          // avoid writing [] when empty
  const arr = csv.split(",").map(s => s.trim()).filter(Boolean);
  return arr.length ? arr : undefined; // undefined if empty after trim
};

const formatPayload = (f: LGUForm) => ({
  // name is locked server-side; we still send as read-only mirror
  name: f.name,
  lat: f.lat,
  lng: f.lng,
  classification: f.classification,
  population: f.population,
  contact_info: f.contact_info,
  description: f.description || undefined,
  lgu_picture: f.lgu_picture || undefined,
  resources: toArray(f.resources),
  players: toArray(f.players),
  schools: toArray(f.schools),
  gyms: toArray(f.gyms),
  local_suppliers: toArray(f.local_suppliers),
});

/* =========================================================================
  VIEW
  - GET /lgu_profiling/manage_lgu/my_lgu
  - If 404 -> offer Create & Edit (auto-create + open editor)
===========================================================================*/
type ViewProps = BaseModalProps & {
  onOpenEdit?: () => void;
};

export const MyLGUViewModal: React.FC<ViewProps> = ({
  isModalOpen,
  closeModal,
  setMessageBox,
  onOpenEdit,
}) => {
  const [loading, setLoading] = useState(false);
  const [record, setRecord] = useState<MyLGU | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!isModalOpen) return;
    (async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await API.get("/lgu_profiling/manage_lgu/my_lgu");
        setRecord(res.data || null);
        if (!res.data) setNotFound(true);
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 404) {
          setNotFound(true);
          setRecord(null);
        } else {
          setMessageBox((p) => ({
            ...p,
            isOpen: true,
            type: "message",
            message:
              err?.response?.data?.detail ||
              err?.message ||
              "Failed to load your LGU profile.",
          }));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [isModalOpen, setMessageBox]);

  if (!isModalOpen) return null;

  const lat = Number(record?.lat ?? 0);
  const lng = Number(record?.lng ?? 0);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0);

  return (
    <Modal isOpen={isModalOpen} onClose={closeModal} zIndex={998}>
      <div className="modal-container" style={{ paddingTop: 24 }}>
        <div className="horizontal-container">
          <span className="title-modal-text">My LGU</span>
        </div>

        {loading && <div style={{ padding: 8 }}>Loading…</div>}

        {!loading && notFound && (
          <>
            <div style={{ padding: 12, textAlign: "center", color: "#6b7280" }}>
              No LGU profile is seeded for your account yet.
            </div>
            <div className="action-button">
              <button
                style={{ backgroundColor: "#749AB6", color: "#fff" }}
                onClick={async () => {
                  try { await API.get("/lgu_profiling/manage_lgu/my_lgu_auto"); } catch {}
                  onOpenEdit?.();
                }}
                title="Create your LGU record then edit details"
              >
                Create & Edit
              </button>
              <button style={{ backgroundColor: "#F84B4D", color: "#fff" }} onClick={closeModal}>
                Close
              </button>
            </div>
          </>
        )}

        {!loading && record && !notFound && (
          <>
            <div className="horizontal-container">
              <span className="item-details-identifier">Name:</span>
              <span style={{ width: "100%", textAlign: "center" }}>
                {record.name || "-"}
              </span>
            </div>

            <div className="horizontal-container">
              <span className="item-details-identifier">Location:</span>
              <span style={{ width: "100%", textAlign: "center" }}>
                {hasCoords ? `${lat}, ${lng}` : "-"}
              </span>
            </div>

            <div style={{ width: "100%", height: "40vh", borderRadius: 10, overflow: "hidden" }}>
              {hasCoords ? (
                <MapWithPin lat={lat} lng={lng} />
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                    background: "#f5f5f5",
                    color: "#666",
                    borderRadius: 10,
                  }}
                >
                  No coordinates to display
                </div>
              )}
            </div>

            <div className="horizontal-container">
              <span className="item-details-identifier">Classification:</span>
              <span style={{ width: "100%", textAlign: "center" }}>
                {record.classification || "-"}
              </span>
            </div>
            <div className="horizontal-container">
              <span className="item-details-identifier">Population:</span>
              <span style={{ width: "100%", textAlign: "center" }}>
                {record.population ?? "-"}
              </span>
            </div>
            <div className="horizontal-container">
              <span className="item-details-identifier">Contact Info:</span>
              <span style={{ width: "100%", textAlign: "center" }}>
                {record.contact_info || "-"}
              </span>
            </div>
            <div className="horizontal-container">
              <span className="item-details-identifier">Description:</span>
              <span style={{ width: "100%", textAlign: "center" }}>
                {record.description || "-"}
              </span>
            </div>

            <div className="horizontal-container">
              <span className="item-details-identifier">Resources:</span>
              <span style={{ width: "100%", textAlign: "center" }}>
                {toCSV(record.resources) || "-"}
              </span>
            </div>
            <div className="horizontal-container">
              <span className="item-details-identifier">Players:</span>
              <span style={{ width: "100%", textAlign: "center" }}>
                {toCSV(record.players) || "-"}
              </span>
            </div>
            <div className="horizontal-container">
              <span className="item-details-identifier">Schools:</span>
              <span style={{ width: "100%", textAlign: "center" }}>
                {toCSV(record.schools) || "-"}
              </span>
            </div>
            <div className="horizontal-container">
              <span className="item-details-identifier">Gyms:</span>
              <span style={{ width: "100%", textAlign: "center" }}>
                {toCSV(record.gyms) || "-"}
              </span>
            </div>
            <div className="horizontal-container">
              <span className="item-details-identifier">Suppliers:</span>
              <span style={{ width: "100%", textAlign: "center" }}>
                {toCSV(record.local_suppliers) || "-"}
              </span>
            </div>

            {record.lgu_picture && (
              <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
                <img src={record.lgu_picture} alt="LGU" style={{ maxHeight: 160, borderRadius: 8 }} />
              </div>
            )}

            <div className="action-button">
              <button style={{ backgroundColor: "#749AB6", color: "#fff" }} onClick={onOpenEdit}>
                <FontAwesomeIcon icon={faPen} /> Edit
              </button>
              <button style={{ backgroundColor: "#F84B4D", color: "#fff" }} onClick={closeModal}>
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

/* =========================================================================
  EDIT (complete-only):
  - Always fetch locked name from /me/lgu_location
  - Prefill details from /manage_lgu/my_lgu if it exists
  - Save via PUT /manage_lgu/my_lgu
  - If missing, auto-create first via /manage_lgu/my_lgu_auto
===========================================================================*/
type EditProps = BaseModalProps & {
  onSaved?: () => void;
};

export const MyLGUEditModal: React.FC<EditProps> = ({
  isModalOpen,
  closeModal,
  setMessageBox,
  onSaved,
}) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [exists, setExists] = useState(false);

  const [form, setForm] = useState<LGUForm>({
    name: "",
    lat: 0,
    lng: 0,
    classification: "",
    population: 0,
    contact_info: "",
    description: "",
    lgu_picture: "",
    resources: "",
    players: "",
    schools: "",
    gyms: "",
    local_suppliers: "",
  });

  const [locationPickerIsOpen, setLocationPickerIsOpen] = useState(false);
  const openLocationPicker = () => setLocationPickerIsOpen(true);
  const closeLocationPicker = () => setLocationPickerIsOpen(false);

  // Prefill locked name first, then try to load existing LGU details
  useEffect(() => {
    if (!isModalOpen) return;
    (async () => {
      setLoading(true);
      setExists(false);
      try {
        // 1) Locked name from profile
        const locResp = await API.get("/lgu_profiling/me/lgu_location");
        const lockedName = locResp?.data?.lgu_location ?? "";
        setForm((prev) => ({ ...prev, name: lockedName }));

        // 2) Existing LGU details (if seeded)
        try {
          const res = await API.get("/lgu_profiling/manage_lgu/my_lgu");
          const d: MyLGU = res.data || {};
          const has = !!d && !!d.name;
          setExists(has);
          if (has) {
            setForm({
              name: lockedName, // enforce locked name
              lat: d.lat ?? 0,
              lng: d.lng ?? 0,
              classification: d.classification ?? "",
              population: d.population ?? 0,
              contact_info: d.contact_info ?? "",
              description: d.description ?? "",
              lgu_picture: d.lgu_picture ?? "",
              resources: toCSV(d.resources),
              players: toCSV(d.players),
              schools: toCSV(d.schools),
              gyms: toCSV(d.gyms),
              local_suppliers: toCSV(d.local_suppliers),
            });
          }
        } catch (inner: any) {
          if (inner?.response?.status === 404) {
            // not seeded; exists stays false, fields remain empty except locked name
          } else {
            throw inner;
          }
        }
      } catch (err: any) {
        setMessageBox((p) => ({
          ...p,
          isOpen: true,
          type: "message",
          message:
            err?.response?.data?.detail ||
            err?.message ||
            "Failed to load LGU info.",
        }));
      } finally {
        setLoading(false);
      }
    })();
  }, [isModalOpen, setMessageBox]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "population" ? Number(value) : value,
    }));
  };

  const handleLocationPickerSubmit = (mapData: { lat: number; lng: number }) => {
    setForm((prev) => ({ ...prev, lat: mapData.lat, lng: mapData.lng }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("file", file);
      const res = await API.post("/api/files/lgu_pictures", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res?.data?.url;
      if (!url) throw new Error("Upload failed: no URL returned");
      setForm((prev) => ({ ...prev, lgu_picture: url }));
      setMessageBox((prev) => ({
        ...prev,
        isOpen: true,
        type: "message",
        message: "Picture uploaded.",
      }));
    } catch (err: any) {
      setMessageBox((prev) => ({
        ...prev,
        isOpen: true,
        type: "message",
        message: err?.response?.data?.detail || err?.message || "Upload failed",
      }));
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    const payload = formatPayload(form);
    setMessageBox((prev) => ({
      ...prev,
      isOpen: true,
      type: "confirm",
      message: "Save changes to your LGU?",
      onSubmit: async () => {
        try {
          // 1) If record not seeded yet, create it now
          if (!exists) {
            await API.get("/lgu_profiling/manage_lgu/my_lgu_auto");
            setExists(true);
          }
          // 2) Try saving
          await API.put("/lgu_profiling/manage_lgu/my_lgu", payload);

          setMessageBox((p) => ({
            ...p,
            isOpen: true,
            type: "message",
            message: "Saved successfully.",
          }));
          onSaved?.();
          closeModal();
        } catch (err: any) {
          const status = err?.response?.status;

          // 3) If still 404 (race), auto-create then retry once
          if (status === 404) {
            try {
              await API.get("/lgu_profiling/manage_lgu/my_lgu_auto");
              await API.put("/lgu_profiling/manage_lgu/my_lgu", payload);
              setMessageBox((p) => ({
                ...p,
                isOpen: true,
                type: "message",
                message: "Saved successfully.",
              }));
              onSaved?.();
              closeModal();
              return;
            } catch (e2: any) {
              setMessageBox((p) => ({
                ...p,
                isOpen: true,
                type: "message",
                message:
                  e2?.response?.data?.detail ||
                  e2?.message ||
                  "Failed to save LGU after initializing.",
              }));
              return;
            }
          }

          setMessageBox((p) => ({
            ...p,
            isOpen: true,
            type: "message",
            message: err?.response?.data?.detail || err?.message || "Failed to save LGU.",
          }));
        }
      },
    }));
  };

  if (!isModalOpen) return null;

  return (
    <>
      {locationPickerIsOpen && (
        <LocationPickerModal
          isOpenProp={locationPickerIsOpen}
          onCloseProp={closeLocationPicker}
          onSubmit={handleLocationPickerSubmit}
          lat={form.lat}
          lng={form.lng}
        />
      )}
      <Modal isOpen={isModalOpen} onClose={closeModal} zIndex={998}>
        <div className="modal-container">
          <div className="horizontal-container">
            <span className="details-title">
              {exists ? "Edit My LGU" : "Complete My LGU"}
            </span>
          </div>

          {loading ? (
            <div style={{ padding: 8 }}>Loading…</div>
          ) : (
            <>
              {/* Name (LOCKED to profile) */}
              <div className="horizontal-container">
                <span className="item-details-identifier">LGU Name:</span>
                <div style={{ display: "flex", width: "100%", gap: 8, alignItems: "center" }}>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    readOnly
                    disabled
                    title="This LGU name is locked to your account"
                  />
                  <FontAwesomeIcon icon={faLock} title="Locked to your account" />
                </div>
              </div>

              {/* Coordinates */}
              <div className="horizontal-container">
                <span className="item-details-identifier">Location:</span>
                <div style={{ display: "flex", width: "100%", gap: 6 }}>
                  <input
                    type="text"
                    readOnly
                    placeholder="Select a location"
                    value={
                      Number.isFinite(form.lat) && Number.isFinite(form.lng) && (form.lat !== 0 || form.lng !== 0)
                        ? `${form.lat} , ${form.lng}`
                        : ""
                    }
                  />
                  <button
                    style={{
                      backgroundColor: "transparent",
                      border: "1px solid #ddd",
                      outline: "none",
                      color: "#3b82f6",
                      width: 35,
                      borderRadius: 5,
                    }}
                    onClick={openLocationPicker}
                    title="Pick coordinates"
                  >
                    <FontAwesomeIcon icon={faMapMarkerAlt} />
                  </button>
                </div>
              </div>

              {/* Classification */}
              <div className="horizontal-container">
                <span className="item-details-identifier">Classification:</span>
                <select
                  id="classification"
                  name="classification"
                  required
                  value={form.classification}
                  onChange={handleChange}
                >
                  <option value="" disabled>Select Classification</option>
                  <option value="City">City</option>
                  <option value="Municipality">Municipality</option>
                </select>
              </div>

              <div className="horizontal-container">
                <span className="item-details-identifier">Population:</span>
                <input type="number" name="population" value={form.population} onChange={handleChange} />
              </div>

              <div className="horizontal-container">
                <span className="item-details-identifier">Contact Info:</span>
                <input type="text" name="contact_info" value={form.contact_info} onChange={handleChange} />
              </div>

              <div className="horizontal-container">
                <span className="item-details-identifier">Description:</span>
                <input type="text" name="description" value={form.description} onChange={handleChange} />
              </div>

              {/* Picture */}
              <div className="horizontal-container">
                <span className="item-details-identifier">LGU Picture:</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center", width: "100%" }}>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                    <FontAwesomeIcon icon={faImage} />
                    <span>{uploading ? "Uploading..." : "Choose file"}</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
                  </label>
                  {form.lgu_picture && (
                    <img
                      src={form.lgu_picture}
                      alt="preview"
                      style={{ maxHeight: 50, borderRadius: 6, border: "1px solid #eee" }}
                    />
                  )}
                </div>
              </div>

              {/* CSV fields */}
              <div className="horizontal-container">
                <span className="item-details-identifier">Resources (comma separated):</span>
                <input type="text" name="resources" value={form.resources} onChange={handleChange} />
              </div>

              <div className="horizontal-container">
                <span className="item-details-identifier">Players (comma separated):</span>
                <input type="text" name="players" value={form.players} onChange={handleChange} />
              </div>

              <div className="horizontal-container">
                <span className="item-details-identifier">Schools (comma separated):</span>
                <input type="text" name="schools" value={form.schools} onChange={handleChange} />
              </div>

              <div className="horizontal-container">
                <span className="item-details-identifier">Gyms (comma separated):</span>
                <input type="text" name="gyms" value={form.gyms} onChange={handleChange} />
              </div>

              <div className="horizontal-container">
                <span className="item-details-identifier">Local Suppliers (comma separated):</span>
                <input type="text" name="local_suppliers" value={form.local_suppliers} onChange={handleChange} />
              </div>

              <div className="action-button">
                <button
                  style={{ backgroundColor: "#749AB6", color: "#fff" }}
                  onClick={save}
                  disabled={uploading}
                >
                  Save
                </button>
                <button style={{ backgroundColor: "#F84B4D", color: "#fff" }} onClick={closeModal}>
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
};
