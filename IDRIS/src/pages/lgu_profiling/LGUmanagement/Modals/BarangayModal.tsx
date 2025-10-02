import { BaseModalProps } from "../ModalProps";
import { useState, useEffect, useRef } from "react";
import LocationPickerModal from "../../../../components/Page_Furniture/LocationPickerModal";
import { Modal } from "../../../../components/Page_Furniture/Modals";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMapMarkerAlt, faEllipsisVertical, faTrash, faPen } from "@fortawesome/free-solid-svg-icons";
import { MapWithPin } from "../ModalProps";
import { API } from "../../../../API_Handler/Axio_API_Handler";

/* -------------------- Fuzzy Search -------------------- */
type FuzzySeachElementProps = {
  value: string | null;
  setLGUID: (idOrName: string, name: string) => void;
  name: string;
  searchURL: string;
};

const FuzzySeachElement: React.FC<FuzzySeachElementProps> = ({
  value,
  name,
  searchURL,
  setLGUID,
}) => {
  type LGURecord = { id: number | string; name: string; lat?: number; lng?: number; contact_info?: string };

  const [results, setResults] = useState<LGURecord[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsSearching(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === "Tab" || event.key === "Escape") setIsSearching(false); };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  async function searchLGU(q: string, sim_threshold: number = 0.2) {
    try {
      const res = await API.get(`${searchURL}?q=${encodeURIComponent(q)}&sim_threshold=${sim_threshold}`);
      const data = res.data;
      return Array.isArray(data) ? data : (data ? [data] : []);
    } catch (e) {
      console.error("Search failed:", e);
      return [];
    }
  }

  useEffect(() => {
    if (!value || value.trim() === "") {
      setIsSearching(false);
      setResults([]);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setLGUID(q, name);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const trimmed = q.trim();
      if (!trimmed) {
        setResults([]);
        setIsSearching(false);
        return;
      }
      const res = await searchLGU(trimmed);
      setResults(res);
      setIsSearching(true);
    }, 500);
  };

  return (
    <div ref={wrapperRef} style={{ display: "flex", width: "100%", gap: "5px", position: "relative" }}>
      <input value={value ?? ""} onChange={handleChange} onFocus={() => { if ((value ?? "").length > 0 && results.length > 0) setIsSearching(true); }} placeholder="Type to search…" />
      {isSearching && (
        <div
          style={{
            display: "flex",
            border: "1px solid #ddd",
            width: "100%",
            maxHeight: "200px",
            position: "absolute",
            top: "100%",
            left: 0,
            borderRadius: "5px",
            backgroundColor: "white",
            overflowY: "auto",
            zIndex: 10000,
          }}
        >
          {results.length > 0 ? (
            <div style={{ width: "100%" }}>
              {results.map((val, i) => (
                <button
                  key={`${val.id ?? val.name}-${i}`}
                  style={{ padding: "5px", width: "100%", textAlign: "start", background: "white", border: "none", borderBottom: "1px solid #eee", cursor: "pointer" }}
                  onClick={() => {
                    setLGUID(String(val.name), name);
                    setIsSearching(false);
                  }}
                >
                  {val.name}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ padding: "8px" }}>No results found…</div>
          )}
        </div>
      )}
    </div>
  );
};

/* -------------------- Types -------------------- */
type addLGUModalProps = BaseModalProps & { handleAddRecord: (payload: any) => void };
type viewEvecuationModalProp = BaseModalProps & { selectedData: any; handleDeleteRecord: (id: string) => void; openEditModal: () => void };
type editEvacuationModalProp = BaseModalProps & { selectedData: any; handleEditRecord: (id: string, payload: any) => void };

/* -------------------- Add Barangay -------------------- */
export const AddBarangayModal: React.FC<addLGUModalProps> = ({
  isModalOpen,
  closeModal,
  setMessageBox,
  handleAddRecord,
}) => {
  type BarangayForm = {
    name: string;
    lat: number;
    lng: number;
    LGU: string;
    evacuation: string;
    population: number;
    contact_info: string;
    risk_level: string;
  };

  const [form, setForm] = useState<BarangayForm>({
    name: "",
    lat: 0,
    lng: 0,
    LGU: "",
    evacuation: "",
    population: 0,
    contact_info: "",
    risk_level: "",
  });

  // barangay picture
  const [barangayPic, setBarangayPic] = useState<File | null>(null);
  const [barangayPicPreview, setBarangayPicPreview] = useState<string | null>(null);
  const onPicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setBarangayPic(file);
    setBarangayPicPreview(file ? URL.createObjectURL(file) : null);
  };

  const [locationPickerIsOpen, setLocationPickerIsOpen] = useState(false);
  const openLocationPicker = () => setLocationPickerIsOpen(true);
  const closeLocationPicker = () => setLocationPickerIsOpen(false);
  const handleLocationPickerSubmit = (mapData: { lat: number; lng: number }) => {
    setForm((prev) => ({ ...prev, lat: mapData.lat, lng: mapData.lng }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const nextVal = type === "number" && value !== "" ? Number(value) : value;
    setForm((prev) => ({ ...prev, [name]: nextVal }));
  };

  const handleSearchChange = (idOrName: string, fieldName: string) => {
    setForm((prev) => ({ ...prev, [fieldName]: idOrName.toString() }));
  };

  // Upload barangay pic first, then send JSON payload
  const uploadBarangayPic = async (file: File): Promise<string | null> => {
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await API.post("/api/files/barangay_pictures", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.url;
    } catch (err) {
      console.error("Image upload failed:", err);
      return null;
    }
  };

  const submitAdd = async () => {
    let picUrl: string | null = null;
    if (barangayPic) {
      picUrl = await uploadBarangayPic(barangayPic);
      if (!picUrl) {
        setMessageBox((prev) => ({
          ...prev,
          isOpen: true,
          type: "message",
          message: "Image upload failed. Please try again.",
        }));
        return;
      }
    }

    const payload = {
      name: form.name,
      lat: form.lat,
      lng: form.lng,
      LGU: form.LGU,
      evacuation: form.evacuation || null,
      population: form.population,
      contact_info: form.contact_info,
      risk_level: form.risk_level,
      baranggay_pic: picUrl,
      baranggay_desc: null,
      resources: null,
    };

    handleAddRecord(payload);
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
            <span className="details-title">Add Barangay</span>
          </div>

          <div className="horizontal-container">
            <span className="item-details-identifier">Name:</span>
            <input type="text" name="name" value={form.name} onChange={handleChange} />
          </div>

          {/* Picture */}
          <div className="horizontal-container">
            <span className="item-details-identifier">Barangay Picture:</span>
            <div style={{ width: "100%" }}>
              <input type="file" accept="image/*" onChange={onPicChange} />
              {barangayPicPreview && (
                <img src={barangayPicPreview} alt="Preview" style={{ marginTop: 8, maxWidth: "100%", maxHeight: 160, borderRadius: 6 }} />
              )}
            </div>
          </div>

          <div className="horizontal-container">
            <span className="item-details-identifier">Location:</span>
            <div style={{ display: "flex", width: "100%", gap: "5px" }}>
              <input type="text" readOnly placeholder="Select a location" value={form.lat ? `${form.lat} , ${form.lng}` : ""} />
              <button
                style={{ backgroundColor: "transparent", border: "1px solid #ddd", outline: "none", color: "#3b82f6", width: "35px", borderRadius: "5px" }}
                onClick={openLocationPicker}
              >
                <FontAwesomeIcon icon={faMapMarkerAlt} style={{ height: "20px" }} />
              </button>
            </div>
          </div>

          <div className="horizontal-container">
            <span className="item-details-identifier">LGU:</span>
            <FuzzySeachElement value={form.LGU} name="LGU" setLGUID={handleSearchChange} searchURL="/lgu_profiling/manage_lgu/search_lgu" />
          </div>

          <div className="horizontal-container">
            <span className="item-details-identifier">Evacuation Center:</span>
            <FuzzySeachElement value={form.evacuation} name="evacuation" setLGUID={handleSearchChange} searchURL="/lgu_profiling/manage_lgu/search_evacuation" />
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

          <div className="action-button">
            <button
              style={{ backgroundColor: "#749AB6", color: "#ffff" }}
              onClick={() => {
                setMessageBox((prev) => ({
                  ...prev,
                  isOpen: true,
                  type: "confirm",
                  message: "Are you sure you want to add this record?",
                  onSubmit: submitAdd,
                }));
              }}
            >
              Add
            </button>
            <button style={{ backgroundColor: "#F84B4D", color: "#ffff" }} onClick={closeModal}>
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

/* -------------------- View Barangay -------------------- */
export const ViewBarangayModal: React.FC<viewEvecuationModalProp> = ({
  isModalOpen,
  closeModal,
  setMessageBox,
  selectedData,
  handleDeleteRecord,
  openEditModal,
}) => {
  const [isMoreOptionVisible, setIsMoreOptionVisible] = useState(false);
  const toggleMoreOptionVisible = () => setIsMoreOptionVisible(!isMoreOptionVisible);
  useEffect(() => { if (!isModalOpen) setIsMoreOptionVisible(false); }, [isModalOpen]);

  // ---- prefer full record from backend; fallback to table row cells ----
  const details = (selectedData as any)?.fullRecord || {};

  const id =
    details.id ??
    selectedData?.data?.[0]?.text;

  const name =
    details.name ??
    selectedData?.data?.[1]?.text ??
    "-";

  // Table currently shows LGU at index 2 and Evac Center at index 3
  const lguDisplay =
    details.lgu_name ??
    details.lgu?.name ??
    selectedData?.data?.[2]?.text ??
    "—";

  const evacDisplay =
    details.evacuation_center_name ??
    details.evacucation_center?.name ??
    selectedData?.data?.[3]?.text ??
    "—";

  const contactInfo =
    details.contact_info ??
    selectedData?.data?.[4]?.text ??
    "-";

  const population =
    details.population ??
    selectedData?.data?.[5]?.text ??
    0;

  const riskLevel =
    details.risk_level ??
    // (old table had risk at index 8; keep as last-resort fallback)
    selectedData?.data?.[8]?.text ??
    "-";

  const lat = Number(details.lat);
  const lng = Number(details.lng);
  const hasValidCoords = Number.isFinite(lat) && Number.isFinite(lng);

  const barangayPic: string | undefined =
    details.baranggay_pic || undefined;

  return (
    <Modal isOpen={isModalOpen} onClose={closeModal} zIndex={998}>
      <div className="modal-container" style={{ paddingTop: "30px" }}>
        <div className="horizontal-container space-between-container">
          <span className="title-modal-text">View Details</span>
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
                        onSubmit: () => handleDeleteRecord(String(id)),
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

        <div className="horizontal-container"><span className="details-title">Details</span></div>

        <div className="horizontal-container">
          <span className="item-details-identifier">Name:</span>
          <span style={{ width: "100%", textAlign: "center" }}>{name}</span>
        </div>

        {/* Picture (optional) */}
        {barangayPic && (
          <div className="horizontal-container">
            <span className="item-details-identifier">Picture:</span>
            <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
              <img
                src={barangayPic}
                alt="Barangay"
                style={{ marginTop: 8, maxWidth: "100%", maxHeight: 220, borderRadius: 6 }}
              />
            </div>
          </div>
        )}

        <div className="horizontal-container">
          <span className="item-details-identifier">LGU:</span>
          <span style={{ width: "100%", textAlign: "center" }}>{lguDisplay}</span>
        </div>

        <div className="horizontal-container">
          <span className="item-details-identifier">Evacuation Center:</span>
          <span style={{ width: "100%", textAlign: "center" }}>{evacDisplay}</span>
        </div>

        <div className="horizontal-container">
          <span className="item-details-identifier">Population:</span>
          <span style={{ width: "100%", textAlign: "center" }}>
            {typeof population === "number" ? population.toLocaleString() : population}
          </span>
        </div>

        <div className="horizontal-container">
          <span className="item-details-identifier">Contact Info:</span>
          <span style={{ width: "100%", textAlign: "center" }}>{contactInfo}</span>
        </div>

        <div className="horizontal-container">
          <span className="item-details-identifier">Risk Level:</span>
          <span style={{ width: "100%", textAlign: "center" }}>{riskLevel}</span>
        </div>

        {/* Location / Map */}
        <div className="horizontal-container">
          <span className="item-details-identifier">Location (Lat, Lng):</span>
          <span style={{ width: "100%", textAlign: "center" }}>
            {hasValidCoords ? `${lat}, ${lng}` : "—"}
          </span>
        </div>

        {hasValidCoords && (
          <div style={{ display: "flex", width: "100%", height: "50vh", borderRadius: "10px", overflow: "hidden" }}>
            <MapWithPin lat={lat} lng={lng} />
          </div>
        )}

        <div className="action-button">
          <button style={{ backgroundColor: "#F84B4D" }} onClick={closeModal}>Close</button>
        </div>
      </div>
    </Modal>
  );
};

/* -------------------- Edit Barangay -------------------- */
export const EditBarangayModal: React.FC<editEvacuationModalProp> = ({
  isModalOpen,
  closeModal,
  setMessageBox,
  handleEditRecord,
  selectedData,
}) => {
  type BarangayForm = {
    name: string;
    lat: number;
    lng: number;
    LGU: string | null;
    evacuation: string | null;
    population: number;
    contact_info: string;
    risk_level: string;
  };

  const [form, setForm] = useState<BarangayForm>({
    name: selectedData.data[1].text,
    lat: parseFloat(selectedData.data[2].text),
    lng: parseFloat(selectedData.data[3].text),
    LGU: selectedData.data[4].text,
    evacuation: selectedData.data[5].text,
    population: parseInt(selectedData.data[6].text),
    contact_info: selectedData.data[7].text,
    risk_level: selectedData.data[8].text,
  });

  const [locationPickerIsOpen, setLocationPickerIsOpen] = useState(false);
  const openLocationPicker = () => setLocationPickerIsOpen(true);
  const closeLocationPicker = () => setLocationPickerIsOpen(false);

  const handleLocationPickerSubmit = (mapData: { lat: number; lng: number }) => {
    setForm((prev) => ({ ...prev, lat: mapData.lat, lng: mapData.lng }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const nextVal = type === "number" && value !== "" ? Number(value) : (value as any);
    setForm((prev) => ({ ...prev, [name]: nextVal }));
  };

  const handleSearchChange = (idOrName: string, fieldName: string) => {
    setForm((prev) => ({ ...prev, [fieldName]: idOrName.toString() }));
  };

  const confirmDetachEvacuation = () => {
    const current = (form.evacuation || "").trim();
    if (current === "") {
      setMessageBox((prev) => ({ ...prev, isOpen: true, type: "message", message: "No evacuation center is currently set." }));
      return;
    }
    setMessageBox((prev) => ({
      ...prev,
      isOpen: true,
      type: "confirm",
      message: `Are you sure you want to detach the evacuation center ${current ? `“${current}” ` : ""}from “${form.name}”?`,
      onSubmit: () => setForm((p) => ({ ...p, evacuation: "" })),
    }));
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
            <span className="details-title">Edit Barangay</span>
          </div>

          <div className="horizontal-container">
            <span className="item-details-identifier">Name:</span>
            <input type="text" name="name" value={form.name} onChange={handleChange} />
          </div>

          <div className="horizontal-container">
            <span className="item-details-identifier">Location:</span>
            <div style={{ display: "flex", width: "100%", gap: "5px" }}>
              <input type="text" readOnly placeholder="Select a location" value={form.lat ? `${form.lat} , ${form.lng}` : ""} />
              <button
                style={{ backgroundColor: "transparent", border: "1px solid #ddd", outline: "none", color: "#3b82f6", width: "35px", borderRadius: "5px" }}
                onClick={openLocationPicker}
              >
                <FontAwesomeIcon icon={faMapMarkerAlt} style={{ height: "20px" }} />
              </button>
            </div>
          </div>

          <div className="horizontal-container">
            <span className="item-details-identifier">LGU:</span>
            <FuzzySeachElement value={form.LGU ?? ""} name="LGU" setLGUID={handleSearchChange} searchURL="/lgu_profiling/manage_lgu/search_lgu" />
          </div>

          <div className="horizontal-container" style={{ alignItems: "center" }}>
            <span className="item-details-identifier">Evacuation Center:</span>
            <div style={{ display: "flex", width: "100%", gap: "8px" }}>
              <div style={{ flex: 1 }}>
                <FuzzySeachElement value={form.evacuation ?? ""} name="evacuation" setLGUID={handleSearchChange} searchURL="/lgu_profiling/manage_lgu/search_evacuation" />
              </div>
              <button
                type="button"
                title="Detach evacuation center"
                style={{ padding: "6px 10px", backgroundColor: "#f87171", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", whiteSpace: "nowrap", height: "32px", alignSelf: "center" }}
                onClick={confirmDetachEvacuation}
              >
                Detach
              </button>
            </div>
          </div>

          <div className="horizontal-container">
            <span className="item-details-identifier">Population:</span>
            <input type="number" name="population" value={form.population} onChange={handleChange} min={0} />
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

          <div className="action-button">
            <button
              style={{ backgroundColor: "#749AB6" }}
              onClick={() => {
                setMessageBox((prev) => ({
                  ...prev,
                  isOpen: true,
                  type: "confirm",
                  message: "Are you sure you want to update this record?",
                  onSubmit: () => handleEditRecord(selectedData.data[0].text, form),
                }));
              }}
            >
              Confirm
            </button>
            <button style={{ backgroundColor: "#F84B4D" }} onClick={closeModal}>Cancel</button>
          </div>
        </div>
      </Modal>
    </>
  );
};
