import { BaseModalProps } from "../ModalProps";
import { useState, useEffect, useRef } from "react";
import LocationPickerModal from "../../../../components/Page_Furniture/LocationPickerModal";
import { Modal } from "../../../../components/Page_Furniture/Modals";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMapMarkerAlt,
  faEllipsisVertical,
  faTrash,
  faPen,
} from "@fortawesome/free-solid-svg-icons";
import { MapWithPin } from "../ModalProps";
// Prefer Axios baseURL if you're already using it
import { API } from "../../../../API_Handler/Axio_API_Handler";

const API_BASE = API.defaults.baseURL;

/** Accepts absolute http(s), blob:, data:, or relative server path; ALWAYS returns a string */
const toAbs = (p?: string): string => {
  if (!p) return "";
  if (/^(https?:|blob:|data:)/i.test(p)) return p;
  const base = (API_BASE ?? "").replace(/\/+$/, "");
  const rel = p.startsWith("/") ? p : `/${p}`;
  return `${base}${rel}`;
};

/* ===================== TYPES ===================== */
type addRafiModalProp = BaseModalProps & {
  handleAddRecord: (payload: any) => void; // expects FormData
};
type viewRafiModalProp = BaseModalProps & {
  selectedData: any;
  handleDeleteRecord: (id: string) => void;
  openEditModal: () => void;
};
type editRafiModalProp = BaseModalProps & {
  selectedData: any;
  handleEditRecord: (id: string, payload: any) => void; // expects FormData
};

/* small helpers */
const toNum = (v: unknown) => {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : null;
};

/* ===================== ADD MODAL ===================== */
const EMPTY_ADD = {
  rafi_name: "",
  lat: null as number | null,
  lng: null as number | null,
  rafi_desc: "",
};

export const AddRafiModal: React.FC<addRafiModalProp> = ({
  isModalOpen,
  closeModal,
  setMessageBox,
  handleAddRecord,
}) => {
  const [form, setForm] = useState(EMPTY_ADD);
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [locationPickerIsOpen, setLocationPickerIsOpen] = useState(false);
  const openLocationPicker = () => setLocationPickerIsOpen(true);
  const closeLocationPicker = () => setLocationPickerIsOpen(false);

  // Reset every time the modal opens
  useEffect(() => {
    if (isModalOpen) {
      setForm(EMPTY_ADD);
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }, [isModalOpen]);

  const handleLocationPickerSubmit = (mapData: {
    lat: number;
    lng: number;
  }) => {
    setForm((prev) => ({ ...prev, lat: mapData.lat, lng: mapData.lng }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, files } = e.target as HTMLInputElement;
    if (name === "rafi_pic") {
      setFile(files?.[0] ?? null);
      return;
    }
    if (name === "lat" || name === "lng") {
      const n = value === "" ? null : Number(value);
      setForm((prev) => ({
        ...prev,
        [name]: Number.isFinite(n as number) ? (n as number) : null,
      }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const cancel = () => {
    setForm(EMPTY_ADD);
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
    closeModal();
  };

  const submit = () => {
    setMessageBox((prev) => ({
      ...prev,
      isOpen: true,
      type: "confirm",
      message: "Are you sure you want to add this record?",
      onSubmit: () => {
        const fd = new FormData();
        fd.append("rafi_name", form.rafi_name);
        if (form.lat != null) fd.append("lat", String(form.lat));
        if (form.lng != null) fd.append("lng", String(form.lng));
        fd.append("rafi_desc", form.rafi_desc);
        if (file) fd.append("rafi_pic", file);
        handleAddRecord(fd);
      },
    }));
  };

  const locText =
    form.lat != null && form.lng != null ? `${form.lat} , ${form.lng}` : "";

  return (
    <>
      {locationPickerIsOpen && (
        <LocationPickerModal
          isOpenProp={locationPickerIsOpen}
          onCloseProp={closeLocationPicker}
          onSubmit={handleLocationPickerSubmit}
          lat={form.lat ?? 0}
          lng={form.lng ?? 0}
        />
      )}
      <Modal isOpen={isModalOpen} onClose={cancel} zIndex={998}>
        <div className="modal-container">
          <div className="horizontal-container">
            <span className="details-title">Add RAFI Infrastructure</span>
          </div>

          <div className="horizontal-container">
            <span className="item-details-identifier">Name:</span>
            <input
              type="text"
              name="rafi_name"
              value={form.rafi_name}
              onChange={handleChange}
            />
          </div>

          <div className="horizontal-container">
            <span className="item-details-identifier">Location:</span>
            <div style={{ display: "flex", width: "100%", gap: "5px" }}>
              <input
                type="text"
                readOnly
                placeholder="Select a location"
                value={locText}
              />
              <button
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid #ddd",
                  color: "#3b82f6",
                  width: 35,
                  borderRadius: 5,
                }}
                onClick={openLocationPicker}
              >
                <FontAwesomeIcon icon={faMapMarkerAlt} style={{ height: 20 }} />
              </button>
            </div>
          </div>

          <div className="horizontal-container">
            <span className="item-details-identifier">Description:</span>
            <textarea
              name="rafi_desc"
              value={form.rafi_desc}
              onChange={handleChange}
              rows={5}
              cols={40}
              style={{ resize: "none" }}
            />
          </div>

          <div className="horizontal-container">
            <span className="item-details-identifier">Picture:</span>
            <input
              ref={fileRef}
              type="file"
              name="rafi_pic"
              accept="image/*"
              onChange={handleChange}
            />
          </div>

          <div className="action-button">
            <button
              style={{ backgroundColor: "#749AB6", color: "#ffff" }}
              onClick={submit}
            >
              Add
            </button>
            <button
              style={{ backgroundColor: "#F84B4D", color: "#ffff" }}
              onClick={cancel}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
/* ===================== VIEW MODAL (RAFI - refresh image immediately) ===================== */
export const ViewRafiModalModal: React.FC<viewRafiModalProp> = ({
  isModalOpen,
  closeModal,
  setMessageBox,
  selectedData,
  handleDeleteRecord,
  openEditModal,
}) => {
  const [isMoreOptionVisible, setIsMoreOptionVisible] = useState(false);
  useEffect(() => {
    if (!isModalOpen) setIsMoreOptionVisible(false);
  }, [isModalOpen]);

  // ---------- Derive fields from selected row ----------
  const idText = String(selectedData?.data?.[0]?.text ?? "");
  const nameText = String(selectedData?.data?.[1]?.text ?? "");
  const latText = String(selectedData?.data?.[2]?.text ?? "");
  const lngText = String(selectedData?.data?.[3]?.text ?? "");
  const descText = String(selectedData?.data?.[4]?.text ?? "");
  const initialPicture = selectedData?.data?.[5]?.text as string | undefined;

  const latNum = toNum(latText);
  const lngNum = toNum(lngText);
  const hasValidCoords = latNum !== null && lngNum !== null;

  // ---------- Stable refs ----------
  const idRef = useRef(idText);
  useEffect(() => {
    idRef.current = idText;
  }, [idText]);

  const picRef = useRef<string>("");

  // ---------- Image state ----------
  const [picPath, setPicPath] = useState<string>("");
  const [version, setVersion] = useState(0);
  const [imgError, setImgError] = useState(false);

  // Init / reset when modal opens or row picture changes
  useEffect(() => {
    const hasPic =
      typeof initialPicture === "string" &&
      initialPicture.trim() &&
      initialPicture !== "-";

    const newPath = hasPic ? initialPicture : "";
    setPicPath(newPath);
    picRef.current = newPath;
    setVersion((v) => v + 1);
    setImgError(false);
  }, [initialPicture, isModalOpen]);

  // Build src with cache-buster
  const imgSrc = picPath
    ? `${toAbs(picPath)}${toAbs(picPath).includes("?") ? "&" : "?"}v=${version}`
    : "";

  // 🔔 Listen for successful edits and refresh image
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ id: string; rafi_pic?: string }>;
      if (!ce?.detail) return;
      if (String(ce.detail.id) !== idRef.current) return;

      const newPath = ce.detail.rafi_pic || picRef.current;

      setPicPath(newPath);
      picRef.current = newPath;
      setVersion((v) => v + 1);
      setImgError(false);
    };

    document.addEventListener("rafi:updated", handler as EventListener);
    return () =>
      document.removeEventListener("rafi:updated", handler as EventListener);
  }, []);

  return (
    <Modal isOpen={isModalOpen} onClose={closeModal} zIndex={998}>
      <div className="modal-container" style={{ paddingTop: "30px" }}>
        <div className="horizontal-container space-between-container">
          <span className="title-modal-text">RAFI Details</span>
          <div
            className="horizontal-container"
            style={{ width: "auto", gap: "5px" }}
          >
            <div className="more-options-container">
              <button
                onClick={() => setIsMoreOptionVisible(!isMoreOptionVisible)}
              >
                <FontAwesomeIcon
                  icon={faEllipsisVertical}
                  style={{ height: "20px" }}
                />
              </button>
              {isMoreOptionVisible && (
                <div className="more-options-viewer">
                  <button onClick={openEditModal}>
                    <FontAwesomeIcon icon={faPen} /> Edit Record
                  </button>
                  <button
                    style={{ color: "red" }}
                    onClick={() =>
                      setMessageBox((prev) => ({
                        ...prev,
                        isOpen: true,
                        type: "confirm",
                        message: "Are you sure you want to delete this record?",
                        onSubmit: () =>
                          handleDeleteRecord(selectedData.data[0].text),
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
          <span className="item-details-identifier">Name:</span>
          <span style={{ width: "100%", textAlign: "center" }}>{nameText}</span>
        </div>

        <div className="horizontal-container">
          <span className="item-details-identifier">Location:</span>
          <span style={{ width: "100%", textAlign: "center" }}>
            {hasValidCoords ? `${latNum}, ${lngNum}` : "-"}
          </span>
        </div>

        <div
          style={{
            width: "100%",
            height: "35vh",
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          {hasValidCoords ? (
            <MapWithPin lat={latNum as number} lng={lngNum as number} />
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                background: "#f5f5f5",
                color: "#666",
              }}
            >
              No valid coordinates to display
            </div>
          )}
        </div>

        <div className="horizontal-container">
          <span className="item-details-identifier">Description:</span>
          <span style={{ width: "100%", textAlign: "center" }}>
            {descText || "-"}
          </span>
        </div>

        {/* ---------- Image with safe error handling + cache-busting ---------- */}
        {picPath && (
          <div className="horizontal-container" key={`${picPath}-${version}`}>
            <span className="item-details-identifier">RAFI picture:</span>
            <br />
            {!imgError ? (
              <img
                key={imgSrc}
                src={imgSrc}
                alt="RAFI"
                loading="lazy"
                style={{
                  maxWidth: "100%",
                  maxHeight: 250,
                  borderRadius: 8,
                  objectFit: "cover",
                  display: "block",
                  margin: "0 auto",
                }}
                onError={() => setImgError(true)}
                crossOrigin="anonymous"
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: 200,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#f5f5f5",
                  color: "#666",
                  borderRadius: 8,
                }}
              >
                Failed to load image.
              </div>
            )}
          </div>
        )}

        <div className="action-button">
          <button style={{ backgroundColor: "#F84B4D" }} onClick={closeModal}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

/* ===================== EDIT MODAL (revised) ===================== */
export const EditRafiModal: React.FC<editRafiModalProp> = ({
  isModalOpen,
  closeModal,
  setMessageBox,
  handleEditRecord,
  selectedData,
}) => {
  const [form, setForm] = useState({
    rafi_name: String(selectedData.data[1].text ?? ""),
    lat: toNum(selectedData.data[2].text) ?? 0,
    lng: toNum(selectedData.data[3].text) ?? 0,
    rafi_desc: String(selectedData.data[4].text ?? ""),
  });
  const [file, setFile] = useState<File | null>(null);
  const [locationPickerIsOpen, setLocationPickerIsOpen] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, files } = e.target as HTMLInputElement;
    if (name === "rafi_pic") {
      setFile(files?.[0] ?? null);
      return;
    }
    if (name === "lat" || name === "lng") {
      const n = value === "" ? 0 : Number(value);
      setForm((prev) => ({ ...prev, [name]: Number.isFinite(n) ? n : 0 }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submit = () => {
    setMessageBox((prev) => ({
      ...prev,
      isOpen: true,
      type: "confirm",
      message: "Are you sure you want to update this record?",
      onSubmit: async () => {
        const fd = new FormData();
        fd.append("rafi_name", form.rafi_name);
        fd.append("lat", String(form.lat));
        fd.append("lng", String(form.lng));
        fd.append("rafi_desc", form.rafi_desc);
        if (file) fd.append("rafi_pic", file);

        const id = String(selectedData.data[0].text);

        try {
          // Support both async and sync handlers
          const maybePromise = (
            handleEditRecord as unknown as (
              id: string,
              payload: FormData,
            ) => Promise<any> | void
          )(id, fd);

          let result: any | undefined = undefined;
          if (
            maybePromise &&
            typeof (maybePromise as any).then === "function"
          ) {
            result = await (maybePromise as Promise<any>);
          }

          // Try to extract rafi_pic from common shapes
          const newPic =
            result?.rafi_pic ??
            result?.data?.rafi_pic ??
            result?.record?.rafi_pic ??
            undefined;

          // Notify any open View modal to refresh its image immediately
          document.dispatchEvent(
            new CustomEvent("rafi:updated", {
              detail: { id, rafi_pic: newPic }, // include new path if backend returns it
            }),
          );

          // Optionally close the modal after success
          closeModal?.();
          setFile(null);
        } catch (err) {
          // Even on error, still signal a refresh attempt (uses old path + version bump)
          document.dispatchEvent(
            new CustomEvent("rafi:updated", { detail: { id } }),
          );
          console.error("Update failed:", err);
        }
      },
    }));
  };

  return (
    <>
      {locationPickerIsOpen && (
        <LocationPickerModal
          isOpenProp={locationPickerIsOpen}
          onCloseProp={() => setLocationPickerIsOpen(false)}
          onSubmit={(mapData) =>
            setForm((p) => ({ ...p, lat: mapData.lat, lng: mapData.lng }))
          }
          lat={form.lat}
          lng={form.lng}
        />
      )}
      <Modal isOpen={isModalOpen} onClose={closeModal} zIndex={998}>
        <div className="modal-container">
          <div className="horizontal-container">
            <span className="details-title">Update RAFI Infrastructure</span>
          </div>

          <div className="horizontal-container">
            <span className="item-details-identifier">Name:</span>
            <input
              type="text"
              name="rafi_name"
              value={form.rafi_name}
              onChange={handleChange}
            />
          </div>

          <div className="horizontal-container">
            <span className="item-details-identifier">Location:</span>
            <div style={{ display: "flex", width: "100%", gap: "5px" }}>
              <input type="text" readOnly value={`${form.lat}, ${form.lng}`} />
              <button
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid #ddd",
                  color: "#3b82f6",
                  width: 35,
                  borderRadius: 5,
                }}
                onClick={() => setLocationPickerIsOpen(true)}
              >
                <FontAwesomeIcon icon={faMapMarkerAlt} />
              </button>
            </div>
          </div>

          <div className="horizontal-container">
            <span className="item-details-identifier">Description:</span>
            <textarea
              name="rafi_desc"
              value={form.rafi_desc}
              onChange={handleChange}
              rows={5}
              cols={40}
              style={{ resize: "none" }}
            />
          </div>

          <div className="horizontal-container">
            <span className="item-details-identifier">Picture:</span>
            <input
              type="file"
              name="rafi_pic"
              accept="image/*"
              onChange={handleChange}
            />
          </div>

          <div className="action-button">
            <button
              style={{ backgroundColor: "#749AB6", color: "#ffff" }}
              onClick={submit}
            >
              Update
            </button>
            <button
              style={{ backgroundColor: "#F84B4D", color: "#ffff" }}
              onClick={closeModal}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
