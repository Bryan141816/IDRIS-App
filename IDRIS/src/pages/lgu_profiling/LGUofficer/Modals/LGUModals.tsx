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

// 🔧 Only allow "city" or "municipality" guesses (ignore barangay/province-like)
function classifyFromPhoton(osmValue?: string): "city" | "municipality" | "" {
  const v = (osmValue || "").toLowerCase();
  if (v === "city") return "city";
  if (v === "town" || v === "municipality") return "municipality";
  // ignore any barangay-like (suburb, village, hamlet, district, etc.) and province-levels
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
      // bias to Cebu; lang en; limit 8
      const url = new URL("https://photon.komoot.io/api/");
      url.searchParams.set("q", term);
      url.searchParams.set("limit", "8");
      url.searchParams.set("lang", "en");
      url.searchParams.set("lat", String(CEBU_LAT));
      url.searchParams.set("lon", String(CEBU_LON));
      // example: photon.komoot.io/api/?q=sabang sibonga&lat=10.291054&lon=123.879071
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
    setForm((prev) => ({ ...prev, lat: mapData.lat, lng: mapData.lng }));
  };

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

          {/* Classification — only City & Municipality */}
          <div className="horizontal-container">
            <span className="item-details-identifier">Classification:</span>
            <select id="classification" name="classification" required value={form.classification} onChange={handleChange}>
              <option value="" disabled>Select Classification</option>
              <option value="city">City</option>
              <option value="municipality">Municipality</option>
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
              style={{ backgroundColor: "#749AB6", color: "#ffff"  }}
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
            <button style={{ backgroundColor: "#F84B4D", color: "#ffff"  }} onClick={closeModal}>
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
  const id = String(selectedData?.data?.[0]?.text ?? "");

  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // ▼ 3-dots menu state + outside-click close
  const [isMoreOptionVisible, setIsMoreOptionVisible] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!moreRef.current) return;
      if (!moreRef.current.contains(e.target as Node)) setIsMoreOptionVisible(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  useEffect(() => {
    if (!isModalOpen) setIsMoreOptionVisible(false);
  }, [isModalOpen]);

  useEffect(() => {
    if (!isModalOpen || !id) return;
    (async () => {
      try {
        setLoading(true);
        // in ViewLGUModal useEffect
        const res = await API.get(`/lgu_profiling/manage_lgu/lgu/${id}`);

        setDetail(res.data);
      } catch (e: any) {
        setDetail(null);
        setMessageBox((prev) => ({
          ...prev,
          isOpen: true,
          type: "message",
          message: e?.response?.data?.detail || "Failed to load LGU details",
        }));
      } finally {
        setLoading(false);
      }
    })();
  }, [isModalOpen, id, setMessageBox]);

  if (!isModalOpen) return null;

  const lat = Number(detail?.lat ?? 0);
  const lng = Number(detail?.lng ?? 0);

  return (
    <Modal isOpen={isModalOpen} onClose={closeModal} zIndex={998}>
      <div className="modal-container" style={{ paddingTop: "30px" }}>
        <div className="horizontal-container space-between-container">
          <span className="title-modal-text">View LGU Details</span>

          {/* ▼ Three-dots menu */}
          <div className="more-options-container" ref={moreRef} style={{ position: "relative" }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMoreOptionVisible((v) => !v);
              }}
              aria-haspopup="menu"
              aria-expanded={isMoreOptionVisible}
              title="More actions"
            >
              <FontAwesomeIcon icon={faEllipsisVertical} style={{ height: 20 }} />
            </button>

            {isMoreOptionVisible && (
              <div
                className="more-options-viewer"
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  boxShadow: "0 8px 16px rgba(0,0,0,0.08)",
                  padding: 6,
                  zIndex: 9999,
                  minWidth: 160,
                }}
                role="menu"
              >
                <button
                  type="button"
                  onClick={() => {
                    openEditModal();
                    setIsMoreOptionVisible(false);
                  }}
                  role="menuitem"
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 10px" }}
                >
                  <FontAwesomeIcon icon={faPen} /> Edit Record
                </button>

                <button
                  type="button"
                  role="menuitem"
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 10px", color: "red" }}
                  onClick={() => {
                    setMessageBox((prev) => ({
                      ...prev,
                      isOpen: true,
                      type: "confirm",
                      message: "Are you sure you want to delete this record?",
                      onSubmit: () => handleDeleteRecord(id),
                    }));
                    setIsMoreOptionVisible(false);
                  }}
                >
                  <FontAwesomeIcon icon={faTrash} /> Delete Record
                </button>
              </div>
            )}
          </div>
          {/* ▲ End three-dots menu */}
        </div>

        {loading && <div style={{ padding: 8 }}>Loading…</div>}
        {!loading && detail && (
          <>
            <div className="horizontal-container">
              <span className="item-details-identifier">Name:</span>
              <span style={{ width: "100%", textAlign: "center" }}>{detail.name}</span>
            </div>

            <div className="horizontal-container">
              <span className="item-details-identifier">Location:</span>
              <span style={{ width: "100%", textAlign: "center" }}>
                {lat}
                {lat ? ", " : ""}
                {lng}
              </span>
            </div>

            <div style={{ width: "100%", height: "40vh", borderRadius: "10px", overflow: "hidden" }}>
              <MapWithPin lat={lat} lng={lng} />
            </div>

            <div className="horizontal-container"><span className="item-details-identifier">Classification:</span><span style={{ width: "100%", textAlign: "center" }}>{detail.classification || "-"}</span></div>
            <div className="horizontal-container"><span className="item-details-identifier">Population:</span><span style={{ width: "100%", textAlign: "center" }}>{detail.population ?? "-"}</span></div>
            <div className="horizontal-container"><span className="item-details-identifier">Contact Info:</span><span style={{ width: "100%", textAlign: "center" }}>{detail.contact_info || "-"}</span></div>
            <div className="horizontal-container"><span className="item-details-identifier">Risk Level:</span><span style={{ width: "100%", textAlign: "center" }}>{detail.risk_level || "-"}</span></div>
            <div className="horizontal-container"><span className="item-details-identifier">Description:</span><span style={{ width: "100%", textAlign: "center" }}>{detail.description || "-"}</span></div>

            <div className="horizontal-container"><span className="item-details-identifier">Resources:</span><span style={{ width: "100%", textAlign: "center" }}>{(detail.resources || []).join(", ") || "-"}</span></div>
            <div className="horizontal-container"><span className="item-details-identifier">Players:</span><span style={{ width: "100%", textAlign: "center" }}>{(detail.players || []).join(", ") || "-"}</span></div>
            <div className="horizontal-container"><span className="item-details-identifier">Schools:</span><span style={{ width: "100%", textAlign: "center" }}>{(detail.schools || []).join(", ") || "-"}</span></div>
            <div className="horizontal-container"><span className="item-details-identifier">Gyms:</span><span style={{ width: "100%", textAlign: "center" }}>{(detail.gyms || []).join(", ") || "-"}</span></div>
            <div className="horizontal-container"><span className="item-details-identifier">Suppliers:</span><span style={{ width: "100%", textAlign: "center" }}>{(detail.local_suppliers || []).join(", ") || "-"}</span></div>

            {detail.lgu_picture && (
              <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
                <img src={detail.lgu_picture} alt="LGU" style={{ maxHeight: 160, borderRadius: 8 }} />
              </div>
            )}

            <div className="action-button">
              <button style={{ backgroundColor: "#F84B4D" }} onClick={closeModal}>Close</button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};


/* ======================= EDIT LGU (revised) ======================= */
export const EditLGUModal: React.FC<editLGUModalProp> = ({
  isModalOpen,
  closeModal,
  setMessageBox,
  handleEditRecord,
  selectedData,
}) => {
  // safe cell reader
  const cell = (i: number) => selectedData?.data?.[i]?.text ?? "";

  // initial empty form — will be populated by backend on open
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

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [locationPickerIsOpen, setLocationPickerIsOpen] = useState(false);
  const openLocationPicker = () => setLocationPickerIsOpen(true);
  const closeLocationPicker = () => setLocationPickerIsOpen(false);

  // populate form when modal opens / selectedData changes
  useEffect(() => {
    if (!isModalOpen || !selectedData) return;

    const idRaw = selectedData?.data?.[0]?.text;
    const id = idRaw ? Number(idRaw) : NaN;

    // fallback function (use table cells)
    const populateFromCells = () =>
      setForm({
        name: String(cell(1) || ""),
        lat: Number.parseFloat(String(cell(2))) || 0,
        lng: Number.parseFloat(String(cell(3))) || 0,
        classification: String(cell(4) || ""),
        population: Number.parseInt(String(cell(5))) || 0,
        contact_info: String(cell(6) || ""),
        risk_level: String(cell(7) || ""),
        description: String(cell(8) || ""),
        lgu_picture: "",
        resources: String(cell(9) || ""),
        players: String(cell(10) || ""),
        schools: String(cell(11) || ""),
        gyms: String(cell(12) || ""),
        local_suppliers: String(cell(13) || ""),
      });

    if (!id || Number.isNaN(id)) {
      populateFromCells();
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await API.get(`/lgu_profiling/manage_lgu/lgu/${id}`);
        if (cancelled) return;
        const data = res?.data || {};

        setForm({
          name: data.name ?? (cell(1) || ""),
          lat: data.lat != null ? Number(data.lat) : Number.parseFloat(String(cell(2))) || 0,
          lng: data.lng != null ? Number(data.lng) : Number.parseFloat(String(cell(3))) || 0,
          classification: data.classification ?? (cell(4) || ""),
          population: data.population != null ? Number(data.population) : Number.parseInt(String(cell(5))) || 0,
          contact_info: data.contact_info ?? (cell(6) || ""),
          risk_level: data.risk_level ?? (cell(7) || ""),
          description: data.description ?? (cell(8) || ""),
          lgu_picture: data.lgu_picture ?? "",
          resources: Array.isArray(data.resources) ? data.resources.join(", ") : (data.resources ?? (cell(9) || "")),
          players: Array.isArray(data.players) ? data.players.join(", ") : (data.players ?? (cell(10) || "")),
          schools: Array.isArray(data.schools) ? data.schools.join(", ") : (data.schools ?? (cell(11) || "")),
          gyms: Array.isArray(data.gyms) ? data.gyms.join(", ") : (data.gyms ?? (cell(12) || "")),
          local_suppliers: Array.isArray(data.local_suppliers) ? data.local_suppliers.join(", ") : (data.local_suppliers ?? (cell(13) || "")),
        });
      } catch (err: any) {
        // show friendly message and fallback to cells
        setMessageBox((prev) => ({
          ...prev,
          isOpen: true,
          type: "message",
          message: err?.response?.data?.detail || err?.message || "Failed to load LGU details. Falling back to table values.",
        }));
        populateFromCells();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen, selectedData]);

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

          {/* Classification — only City & Municipality */}
          <div className="horizontal-container">
            <span className="item-details-identifier">Classification:</span>
            <select id="classification" name="classification" required value={form.classification} onChange={handleChange}>
              <option value="" disabled>Select Classification</option>
              <option value="city">City</option>
              <option value="municipality">Municipality</option>
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
