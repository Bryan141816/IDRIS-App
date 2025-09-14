import { BaseModalProps } from "../ModalProps";
import { useState, useEffect } from "react";
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
            <input type="text" name="name" value={form.name} onChange={handleChange} />
          </div>

          <div className="horizontal-container">
            <span className="item-details-identifier">Location:</span>
            <div style={{ display: "flex", width: "100%", flexDirection: "row", gap: "5px" }}>
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

  // NOTE: If you want to display the picture here, ensure the LGU table includes a "Picture" column
  // and set its index below. For now, no picture column is in your table schema.
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

        {/* These rely on your backend table including these columns (it does in your updated get_lgu) */}
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
    lgu_picture: "", // not in table; user can re-upload/replace here
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

          {/* repeat fields like in Add modal */}
          <div className="horizontal-container">
            <span className="item-details-identifier">Name:</span>
            <input type="text" name="name" value={form.name} onChange={handleChange} />
          </div>

          <div className="horizontal-container">
            <span className="item-details-identifier">Location:</span>
            <div style={{ display: "flex", width: "100%", flexDirection: "row", gap: "5px" }}>
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
