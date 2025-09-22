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
  faImage,
} from "@fortawesome/free-solid-svg-icons";
import { MapWithPin } from "../ModalProps";
import { API } from "../../../../API_Handler/Axio_API_Handler";

/* ---------------------- TYPES ---------------------- */
type addLGUModalProps = BaseModalProps & {
  handleAddRecord: (payload: any) => void;
};
type viewLGUModalProp = BaseModalProps & {
  selectedData: any;
  handleDeleteRecord: (id: string) => void;
  openEditModal: () => void;
};
type editLGUModalProp = BaseModalProps & {
  selectedData: any;
  handleEditRecord: (id: string, payload: any) => void;
};

type LGUForm = {
  name: string;
  lat: number;
  lng: number;
  classification: string;
  population: number;
  contact_info: string;
  risk_level: string;
  description?: string;
  lgu_picture?: string; // will hold uploaded URL like /media/lgu_pictures/xxxx.png
  resources?: string;   // comma-separated in UI
  players?: string;
  schools?: string;
  gyms?: string;
  local_suppliers?: string;
};

type PhotonFeature = {
  geometry?: { type: "Point"; coordinates: [number, number] }; // [lon, lat]
  properties?: {
    name?: string;
    country?: string;
    state?: string;
    county?: string;
    city?: string;
    locality?: string;
    district?: string;
    suburb?: string;
    postcode?: string;
    osm_value?: string; // city, town, village, suburb, hamlet, etc.
  };
};

type PhotonResp = { features?: PhotonFeature[] };

/* helper: convert comma-separated lists to arrays */
const formatPayload = (form: LGUForm) => ({
  name: form.name,
  lat: form.lat,
  lng: form.lng,
  classification: form.classification,
  population: form.population,
  contact_info: form.contact_info,
  risk_level: form.risk_level,
  description: form.description || undefined,
  lgu_picture: form.lgu_picture || undefined,
  resources: form.resources ? form.resources.split(",").map((s) => s.trim()).filter(Boolean) : [],
  players: form.players ? form.players.split(",").map((s) => s.trim()).filter(Boolean) : [],
  schools: form.schools ? form.schools.split(",").map((s) => s.trim()).filter(Boolean) : [],
  gyms: form.gyms ? form.gyms.split(",").map((s) => s.trim()).filter(Boolean) : [],
  local_suppliers: form.local_suppliers ? form.local_suppliers.split(",").map((s) => s.trim()).filter(Boolean) : [],
});

/* ======================= AUTOCOMPLETE (Photon) ======================= */
/**
 * Lightweight typeahead for LGU names using photon.komoot.io
 * - Debounced fetch
 * - Filters to Philippines + Cebu
 * - Bias to Cebu with lat/lon
 * - Enter selects first item
 */
const CEBU_LAT = 10.3157;
const CEBU_LON = 123.8854;

function classifyFromPhoton(osmValue?: string): "province" | "city" | "municipality" | "barangay" | "" {
  const v = (osmValue || "").toLowerCase();
  if (v === "city") return "city";
  if (v === "town" || v === "municipality") return "municipality";
  // Many barangays appear as suburb, quarter, village, neighbourhood, hamlet, district
  if (["suburb", "village", "hamlet", "neighbourhood", "neighborhood", "quarter", "district", "residential"].includes(v)) {
    return "barangay";
  }
  return "";
}

function formatDisplayName(p: NonNullable<PhotonFeature["properties"]>) {
  const bits = [
    p.name,
    p.city || p.county || p.district || p.locality || p.suburb,
    p.state,
    p.country,
  ].filter(Boolean);
  // De-duplicate consecutive text
  return bits.filter((b, i, a) => (i === 0 ? true : b !== a[i - 1])).join(", ");
}

const AutocompleteLGU: React.FC<{
  value: string;
  onPick: (payload: { name: string; lat: number; lng: number; classificationGuess: string }) => void;
  onChange: (name: string) => void;
}> = ({ value, onPick, onChange }) => {
  const [q, setQ] = useState(value);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<PhotonFeature[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => setQ(value), [value]);

  useEffect(() => {
    // close on click-out
    const onDoc = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const doSearch = async (term: string) => {
    if (!term || term.trim().length < 2) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      // bias to Cebu; lang en; limit 8; include query "Cebu Philippines"
      const url = new URL("https://photon.komoot.io/api/");
      url.searchParams.set("q", term);
      url.searchParams.set("limit", "8");
      url.searchParams.set("lang", "en");
      url.searchParams.set("lat", String(CEBU_LAT));
      url.searchParams.set("lon", String(CEBU_LON));
      // const example: photon.komoot.io/api/?q=sabang sibonga&lat=10.291054&lon=123.879071
      const resp = await fetch(url.toString());
      const data: PhotonResp = await resp.json();

      const filtered = (data.features || []).filter((f) => {
        const p = f.properties || {};
        const isPH = (p.country || "").toLowerCase().includes("philippines");
        const isCebu =
          (p.state || "").toLowerCase().includes("cebu") ||
          (p.county || "").toLowerCase().includes("cebu") ||
          (p.city || "").toLowerCase().includes("cebu");
        return isPH && isCebu;
      });

      setItems(filtered);
      setActiveIndex(0);
      setOpen(true);
    } catch {
      setItems([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const onInputChange = (v: string) => {
    setQ(v);
    onChange(v);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => doSearch(v), 250);
  };

  const commitPick = (f: PhotonFeature) => {
    const p = f.properties || {};
    const coords = f.geometry?.coordinates || [0, 0];
    const lng = coords[0] || 0;
    const lat = coords[1] || 0;
    const classificationGuess = classifyFromPhoton(p.osm_value) || "";
    const name = p.name || formatDisplayName(p) || "";
    onPick({ name, lat, lng, classificationGuess });
    setQ(name);
    setOpen(false);
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (!open || items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + items.length) % items.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      commitPick(items[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={boxRef} style={{ position: "relative", width: "100%" }}>
      <input
        type="text"
        placeholder="Type LGU name (e.g., Sabang, Sibonga)…"
        value={q}
        onChange={(e) => onInputChange(e.target.value)}
        onFocus={() => { if (items.length) setOpen(true); }}
        onKeyDown={onKeyDown}
      />
      {open && (
        <div
          style={{
            position: "absolute",
            zIndex: 9999,
            top: "100%",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            boxShadow: "0 8px 16px rgba(0,0,0,0.08)",
            maxHeight: 240,
            overflowY: "auto",
          }}
        >
          {loading && <div style={{ padding: 8, fontSize: 12 }}>Searching…</div>}
          {!loading && items.length === 0 && (
            <div style={{ padding: 8, fontSize: 12, color: "#6b7280" }}>No results in Cebu, Philippines</div>
          )}
          {!loading &&
            items.map((f, idx) => {
              const p = f.properties || {};
              const label = formatDisplayName(p);
              const isActive = idx === activeIndex;
              return (
                <button
                  key={idx}
                  onClick={() => commitPick(f)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 10px",
                    background: isActive ? "#f3f4f6" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                  onMouseEnter={() => setActiveIndex(idx)}
                >
                  <div style={{ fontWeight: 600 }}>{p.name || label}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    {label}
                    {p.osm_value ? ` • ${p.osm_value}` : ""}
                  </div>
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
};

/* ======================= ADD LGU ======================= */
export const AddLGUModal: React.FC<addLGUModalProps> = ({
  isModalOpen,
  closeModal,
  setMessageBox,
  handleAddRecord,
}) => {
  const [form, setForm] = useState<LGUForm>({
    name: "",
    lat: 0,
    lng: 0,
    classification: "",
    population: 0,
    contact_info: "",
    risk_level: "",
    description: "",
    lgu_picture: "",
    resources: "",
    players: "",
    schools: "",
    gyms: "",
    local_suppliers: "",
  });
  const [uploading, setUploading] = useState(false);

  const [locationPickerIsOpen, setLocationPickerIsOpen] = useState(false);  
  const openLocationPicker = () => setLocationPickerIsOpen(true);
const closeLocationPicker = () => setLocationPickerIsOpen(false);

const handleLocationPickerSubmit = (mapData: { lat: number; lng: number }) => {
  // Update the form with new coordinates
  setForm((prev) => ({ ...prev, lat: mapData.lat, lng: mapData.lng }));
  // Ensure the map component re-renders by setting the new coordinates
  setMapCoordinates({ lat: mapData.lat, lng: mapData.lng }); // Update map coordinates
};

const [mapCoordinates, setMapCoordinates] = useState<{ lat: number; lng: number }>({
  lat: form.lat,
  lng: form.lng,
});

<MapWithPin lat={mapCoordinates.lat} lng={mapCoordinates.lng} />;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prevData) => ({
      ...prevData,
      [name]: name === "population" ? Number(value) : value,
    }));
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
            <span className="details-title">Add LGU</span>
          </div>

          {/* BASIC FIELDS */}
          <div className="horizontal-container">
            <span className="item-details-identifier">Name:</span>
            <div style={{ width: "100%" }}>
              <AutocompleteLGU
                value={form.name}
                onChange={(name) => setForm((prev) => ({ ...prev, name }))}
                onPick={({ name, lat, lng, classificationGuess }) => {
                  setForm((prev) => ({
                    ...prev,
                    name,
                    lat,
                    lng,
                    classification: prev.classification || classificationGuess || "",
                  }));
                  // Optional: auto-open picker centered at result
                  // setLocationPickerIsOpen(true);
                }}
              />
            </div>
          </div>

          <div className="horizontal-container">
            <span className="item-details-identifier">Location:</span>
            <div style={{ display: "flex", width: "100%", flexDirection: "row", gap: "5px" }}>
              <input type="text" readOnly placeholder="Select a location" value={form.lat ? `${form.lat} , ${form.lng}` : ""} />
              <button
                style={{ backgroundColor: "transparent", border: "1px solid #ddd", outline: "none", color: "#3b82f6", width: "35px", borderRadius: "5px" }}
                onClick={openLocationPicker}
                title="Center & fine-tune on map"
              >
                <FontAwesomeIcon icon={faMapMarkerAlt} style={{ height: "20px" }} />
              </button>
            </div>
          </div>

          {form.lat !== 0 && form.lng !== 0 && (
            <div style={{ width: "100%", height: "30vh", borderRadius: 10, overflow: "hidden", marginBottom: 8 }}>
              <MapWithPin lat={form.lat} lng={form.lng} />
            </div>
          )}

          <div className="horizontal-container">
            <span className="item-details-identifier">Classification:</span>
            <select id="classification" name="classification" required value={form.classification} onChange={handleChange}>
              <option value="" disabled>Select Classification</option>
              <option value="province">Province</option>
              <option value="city">City</option>
              <option value="municipality">Municipality</option>
              <option value="barangay">Barangay</option>
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
            <span className="item-details-identifier">Risk Level:</span>
            <select id="risk_level" name="risk_level" required value={form.risk_level} onChange={handleChange}>
              <option value="" disabled>Select Risk Level</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* EXTRA FIELDS */}
          <div className="horizontal-container">
            <span className="item-details-identifier">Description:</span>
            <input type="text" name="description" value={form.description} onChange={handleChange} />
          </div>

          {/* Picture upload */}
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
              style={{ backgroundColor: "#749AB6" }}
              disabled={uploading}
              onClick={() => {
                setMessageBox((prev) => ({
                  ...prev,
                  isOpen: true,
                  type: "confirm",
                  message: "Are you sure you want to add this record?",
                  onSubmit: () => handleAddRecord(formatPayload(form)),
                }));
              }}
            >
              Add
            </button>
            <button style={{ backgroundColor: "#F84B4D" }} onClick={closeModal}>
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

/* ======================= VIEW LGU ======================= */
export const ViewLGUModal: React.FC<viewLGUModalProp> = ({
  isModalOpen,
  closeModal,
  setMessageBox,
  selectedData,
  handleDeleteRecord,
  openEditModal,
}) => {
  const [isMoreOptionVisible, setIsMoreOptionVisible] = useState(false);
  const toggleMoreOptionVisible = () => setIsMoreOptionVisible((v) => !v);
  useEffect(() => {
    if (!isModalOpen) setIsMoreOptionVisible(false);
  }, [isModalOpen]);

  const cell = (i: number) => selectedData?.data?.[i]?.text ?? "";
  const lat = Number.parseFloat(String(cell(2))) || 0;
  const lng = Number.parseFloat(String(cell(3))) || 0;

  if (!isModalOpen) return null;

  return (
    <Modal isOpen={isModalOpen} onClose={closeModal} zIndex={998}>
      <div className="modal-container" style={{ paddingTop: "30px" }}>
        <div className="horizontal-container space-between-container">
          <span className="title-modal-text">View LGU Details</span>
          <div className="horizontal-container" style={{ width: "auto", gap: "5px" }}>
            <div className="more-options-container">
              <button onClick={toggleMoreOptionVisible}>
                <FontAwesomeIcon icon={faEllipsisVertical} style={{ height: "20px" }} />
              </button>
              {isMoreOptionVisible && (
                <div className="more-options-viewer">
                  <button onClick={openEditModal}>
                    <FontAwesomeIcon icon={faPen} /> Edit Record
                  </button>
                  <button
                    style={{ color: "red" }}
                    onClick={() => {
                      setMessageBox((prev) => ({
                        ...prev,
                        isOpen: true,
                        type: "confirm",
                        message: "Are you sure you want to delete this record?",
                        onSubmit: () => handleDeleteRecord(String(cell(0))),
                      }));
                    }}
                  >
                    <FontAwesomeIcon icon={faTrash} /> Delete Record
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FIELDS */}
        <div className="horizontal-container">
          <span className="item-details-identifier">Name:</span>
          <span style={{ width: "100%", textAlign: "center" }}>{cell(1)}</span>
        </div>

        <div className="horizontal-container">
          <span className="item-details-identifier">Location:</span>
          <span style={{ width: "100%", textAlign: "center" }}>
            {lat || ""}{lat ? ", " : ""}{lng || ""}
          </span>
        </div>

        <div style={{ width: "100%", height: "40vh", borderRadius: "10px", overflow: "hidden" }}>
          <MapWithPin lat={lat} lng={lng} />
        </div>

        <div className="horizontal-container">
          <span className="item-details-identifier">Classification:</span>
          <span style={{ width: "100%", textAlign: "center" }}>{cell(4)}</span>
        </div>

        <div className="horizontal-container">
          <span className="item-details-identifier">Population:</span>
          <span style={{ width: "100%", textAlign: "center" }}>{cell(5)}</span>
        </div>

        <div className="horizontal-container">
          <span className="item-details-identifier">Contact Info:</span>
          <span style={{ width: "100%", textAlign: "center" }}>{cell(6)}</span>
        </div>

        <div className="horizontal-container">
          <span className="item-details-identifier">Risk Level:</span>
          <span style={{ width: "100%", textAlign: "center" }}>{cell(7)}</span>
        </div>

        <div className="horizontal-container"><span className="item-details-identifier">Description:</span><span style={{ width: "100%", textAlign: "center" }}>{cell(8)}</span></div>
        <div className="horizontal-container"><span className="item-details-identifier">Resources:</span><span style={{ width: "100%", textAlign: "center" }}>{cell(9)}</span></div>
        <div className="horizontal-container"><span className="item-details-identifier">Players:</span><span style={{ width: "100%", textAlign: "center" }}>{cell(10)}</span></div>
        <div className="horizontal-container"><span className="item-details-identifier">Schools:</span><span style={{ width: "100%", textAlign: "center" }}>{cell(11)}</span></div>
        <div className="horizontal-container"><span className="item-details-identifier">Gyms:</span><span style={{ width: "100%", textAlign: "center" }}>{cell(12)}</span></div>
        <div className="horizontal-container"><span className="item-details-identifier">Suppliers:</span><span style={{ width: "100%", textAlign: "center" }}>{cell(13)}</span></div>

        <div className="action-button">
          <button style={{ backgroundColor: "#F84B4D" }} onClick={closeModal}>Close</button>
        </div>
      </div>
    </Modal>
  );
};

/* ======================= EDIT LGU ======================= */
export const EditLGUModal: React.FC<editLGUModalProp> = ({
  isModalOpen,
  closeModal,
  setMessageBox,
  handleEditRecord,
  selectedData,
}) => {
  const cell = (i: number) => selectedData?.data?.[i]?.text ?? "";
  const [form, setForm] = useState<LGUForm>({
    name: String(cell(1)),
    lat: Number.parseFloat(String(cell(2))) || 0,
    lng: Number.parseFloat(String(cell(3))) || 0,
    classification: String(cell(4)),
    population: Number.parseInt(String(cell(5))) || 0,
    contact_info: String(cell(6)),
    risk_level: String(cell(7)),
    description: String(cell(8) || ""),
    lgu_picture: "",
    resources: String(cell(9) || ""),
    players: String(cell(10) || ""),
    schools: String(cell(11) || ""),
    gyms: String(cell(12) || ""),
    local_suppliers: String(cell(13) || ""),
  });
  const [uploading, setUploading] = useState(false);

  const [locationPickerIsOpen, setLocationPickerIsOpen] = useState(false);
  const openLocationPicker = () => setLocationPickerIsOpen(true);
  const closeLocationPicker = () => setLocationPickerIsOpen(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prevData) => ({
      ...prevData,
      [name]: name === "population" ? Number(value) : value,
    }));
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

  if (!isModalOpen) return null;

  return (
    <>
      {locationPickerIsOpen && (
        <LocationPickerModal
          isOpenProp={locationPickerIsOpen}
          onCloseProp={closeLocationPicker}
          onSubmit={(mapData) => setForm((prev) => ({ ...prev, lat: mapData.lat, lng: mapData.lng }))}
          lat={form.lat}
          lng={form.lng}
        />
      )}
      <Modal isOpen={isModalOpen} onClose={closeModal} zIndex={998}>
        <div className="modal-container">
          <div className="horizontal-container">
            <span className="details-title">Update LGU</span>
          </div>

          <div className="horizontal-container">
            <span className="item-details-identifier">Name:</span>
            <div style={{ width: "100%" }}>
              <AutocompleteLGU
                value={form.name}
                onChange={(name) => setForm((prev) => ({ ...prev, name }))}
                onPick={({ name, lat, lng, classificationGuess }) => {
                  setForm((prev) => ({
                    ...prev,
                    name,
                    lat,
                    lng,
                    classification: prev.classification || classificationGuess || "",
                  }));
                  // setLocationPickerIsOpen(true); // optional
                }}
              />
            </div>
          </div>

          <div className="horizontal-container">
            <span className="item-details-identifier">Location:</span>
            <div style={{ display: "flex", width: "100%", flexDirection: "row", gap: "5px" }}>
              <input type="text" readOnly placeholder="Select a location" value={form.lat ? `${form.lat} , ${form.lng}` : ""} />
              <button
                style={{ backgroundColor: "transparent", border: "1px solid #ddd", outline: "none", color: "#3b82f6", width: "35px", borderRadius: "5px" }}
                onClick={openLocationPicker}
                title="Center & fine-tune on map"
              >
                <FontAwesomeIcon icon={faMapMarkerAlt} style={{ height: "20px" }} />
              </button>
            </div>
          </div>

          {form.lat !== 0 && form.lng !== 0 && (
            <div style={{ width: "100%", height: "30vh", borderRadius: 10, overflow: "hidden", marginBottom: 8 }}>
              <MapWithPin lat={form.lat} lng={form.lng} />
            </div>
          )}

          <div className="horizontal-container">
            <span className="item-details-identifier">Classification:</span>
            <select id="classification" name="classification" required value={form.classification} onChange={handleChange}>
              <option value="" disabled>Select Classification</option>
              <option value="province">Province</option>
              <option value="city">City</option>
              <option value="municipality">Municipality</option>
              <option value="barangay">Barangay</option>
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
            <span className="item-details-identifier">Risk Level:</span>
            <select id="risk_level" name="risk_level" required value={form.risk_level} onChange={handleChange}>
              <option value="" disabled>Select Risk Level</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="horizontal-container">
            <span className="item-details-identifier">Description:</span>
            <input type="text" name="description" value={form.description} onChange={handleChange} />
          </div>

          {/* Picture upload/replace */}
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
              style={{ backgroundColor: "#749AB6" }}
              disabled={uploading}
              onClick={() => {
                const id = String(selectedData?.data?.[0]?.text ?? "");
                setMessageBox((prev) => ({
                  ...prev,
                  isOpen: true,
                  type: "confirm",
                  message: "Are you sure you want to update this record?",
                  onSubmit: () => handleEditRecord(id, formatPayload(form)),
                }));
              }}
            >
              Confirm
            </button>
            <button style={{ backgroundColor: "#F84B4D" }} onClick={closeModal}>
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
