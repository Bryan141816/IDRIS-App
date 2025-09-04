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
} from "@fortawesome/free-solid-svg-icons";
import { MapWithPin } from "../ModalProps";

type addLGUModalProps = BaseModalProps & {
  handleAddRecord: (payload: any) => void;
};
type viewEvecuationModalProp = BaseModalProps & {
  selectedData: any;
  handleDeleteRecord: (id: string) => void;
  openEditModal: () => void;
};
type editEvacuationModalProp = BaseModalProps & {
  selectedData: any;
  handleEditRecord: (id: string, payload: any) => void;
};

/* ======================= ADD LGU ======================= */
export const AddLGUModal: React.FC<addLGUModalProps> = ({
  isModalOpen,
  closeModal,
  setMessageBox,
  handleAddRecord,
}) => {
  type LGUForm = {
    name: string;
    lat: number;
    lng: number;
    classification: string;
    population: number;
    contact_info: string;
    risk_level: string;
  };
  const [addEvacuationForm, setAddEvacuationForm] = useState<LGUForm>({
    name: "",
    lat: 0,
    lng: 0,
    classification: "",
    population: 0,
    contact_info: "",
    risk_level: "",
  });
  const [locationPickerIsOpen, setLocationPickerIsOpen] = useState(false);

  const openLocationPicker = () => setLocationPickerIsOpen(true);
  const closeLocationPicker = () => setLocationPickerIsOpen(false);
  const handleLocationPickerSubmit = (mapData: { lat: number; lng: number }) => {
    setAddEvacuationForm((prev) => ({
      ...prev,
      lat: mapData.lat,
      lng: mapData.lng,
    }));
  };
  const handleAddModalChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setAddEvacuationForm((prevData) => ({
      ...prevData,
      [name]: name === "population" ? Number(value) : value,
    }));
  };

  return (
    <>
      {locationPickerIsOpen && (
        <LocationPickerModal
          isOpenProp={locationPickerIsOpen}
          onCloseProp={closeLocationPicker}
          onSubmit={handleLocationPickerSubmit}
          lat={addEvacuationForm.lat}
          lng={addEvacuationForm.lng}
        />
      )}
      <Modal isOpen={isModalOpen} onClose={closeModal} zIndex={998}>
        <div className="modal-container">
          <div className="horizontal-container">
            <span className="details-title">Add LGU</span>
          </div>

          <div className="horizontal-container">
            <span className="item-details-identifier">Name:</span>
            <input
              type="text"
              name="name"
              value={addEvacuationForm.name}
              onChange={handleAddModalChange}
            />
          </div>

          <div className="horizontal-container">
            <span className="item-details-identifier">Location:</span>
            <div
              style={{
                display: "flex",
                width: "100%",
                flexDirection: "row",
                gap: "5px",
              }}
            >
              <input
                type="text"
                readOnly
                placeholder="Select a location"
                value={
                  addEvacuationForm.lat
                    ? `${addEvacuationForm.lat} , ${addEvacuationForm.lng}`
                    : ""
                }
              />
              <button
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid #ddd",
                  outline: "none",
                  color: "#3b82f6",
                  width: "35px",
                  borderRadius: "5px",
                }}
                onClick={openLocationPicker}
              >
                <FontAwesomeIcon icon={faMapMarkerAlt} style={{ height: "20px" }} />
              </button>
            </div>
          </div>

          <div className="horizontal-container">
            <span className="item-details-identifier">Classification:</span>
            <select
              id="classification"
              name="classification"
              required
              value={addEvacuationForm.classification}
              onChange={handleAddModalChange}
            >
              <option value="" disabled>
                Select Classification
              </option>
              <option value="province">Province</option>
              <option value="city">City</option>
              <option value="municipality">Municipality</option>
              <option value="barangay">Barangay</option>
            </select>
          </div>

          <div className="horizontal-container">
            <span className="item-details-identifier">Population:</span>
            <input
              type="number"
              name="population"
              value={addEvacuationForm.population}
              onChange={handleAddModalChange}
            />
          </div>

          <div className="horizontal-container">
            <span className="item-details-identifier">Contact Info:</span>
            <input
              type="text"
              name="contact_info"
              value={addEvacuationForm.contact_info}
              onChange={handleAddModalChange}
            />
          </div>

          <div className="horizontal-container">
            <span className="item-details-identifier">Risk Level:</span>
            <select
              id="risk_level"
              name="risk_level"
              required
              value={addEvacuationForm.risk_level}
              onChange={handleAddModalChange}
            >
              <option value="" disabled>
                Select Risk Level
              </option>
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
                  message: "Are you sure you want to add this record?",
                  onSubmit: () => {
                    handleAddRecord(addEvacuationForm);
                  },
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
export const ViewLGUModal: React.FC<viewEvecuationModalProp> = ({
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

  // SAFE accessor: prevents "Cannot read properties of undefined (reading 'text')"
  const cell = (i: number) => selectedData?.data?.[i]?.text ?? "";
  const lat = Number.parseFloat(String(cell(2))) || 0;
  const lng = Number.parseFloat(String(cell(3))) || 0;

  if (!isModalOpen) return null; // extra guard

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
                    <FontAwesomeIcon icon={faPen} />
                    Edit Record
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

        <div className="horizontal-container">
          <span className="details-title">Details</span>
        </div>

        <div className="horizontal-container">
          <span className="item-details-identifier">Name:</span>
          <span style={{ width: "100%", textAlign: "center" }}>{cell(1)}</span>
        </div>

        <div className="horizontal-container">
          <span className="item-details-identifier">Location: (Latitude, Longitude)</span>
          <span style={{ width: "100%", textAlign: "center" }}>
            {lat || ""}{lat ? ", " : ""}{lng || ""}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            width: "100%",
            height: "50vh",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
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

        <div className="action-button">
          <button style={{ backgroundColor: "#F84B4D" }} onClick={closeModal}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

/* ======================= EDIT LGU ======================= */
export const EditLGUModal: React.FC<editEvacuationModalProp> = ({
  isModalOpen,
  closeModal,
  setMessageBox,
  handleEditRecord,
  selectedData,
}) => {
  // SAFE accessor
  const cell = (i: number) => selectedData?.data?.[i]?.text ?? "";

  type LGUForm = {
    name: string;
    lat: number;
    lng: number;
    classification: string;
    population: number;
    contact_info: string;
    risk_level: string;
  };

  const [addEvacuationForm, setAddEvacuationForm] = useState<LGUForm>({
    name: String(cell(1)),
    lat: Number.parseFloat(String(cell(2))) || 0,
    lng: Number.parseFloat(String(cell(3))) || 0,
    classification: String(cell(4)),
    population: Number.parseInt(String(cell(5))) || 0,
    contact_info: String(cell(6)),
    risk_level: String(cell(7)),
  });

  const [locationPickerIsOpen, setLocationPickerIsOpen] = useState(false);

  const openLocationPicker = () => setLocationPickerIsOpen(true);
  const closeLocationPicker = () => setLocationPickerIsOpen(false);
  const handleLocationPickerSubmit = (mapData: { lat: number; lng: number }) => {
    setAddEvacuationForm((prev) => ({
      ...prev,
      lat: mapData.lat,
      lng: mapData.lng,
    }));
  };

  const handleAddModalChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setAddEvacuationForm((prevData) => ({
      ...prevData,
      [name]: name === "population" ? Number(value) : value,
    }));
  };

  if (!isModalOpen) return null; // extra guard

  return (
    <>
      {locationPickerIsOpen && (
        <LocationPickerModal
          isOpenProp={locationPickerIsOpen}
          onCloseProp={closeLocationPicker}
          onSubmit={handleLocationPickerSubmit}
          lat={addEvacuationForm.lat}
          lng={addEvacuationForm.lng}
        />
      )}
      <Modal isOpen={isModalOpen} onClose={closeModal} zIndex={998}>
        <div className="modal-container">
          <div className="horizontal-container">
            <span className="details-title">Update LGU</span>
          </div>

          <div className="horizontal-container">
            <span className="item-details-identifier">Name:</span>
            <input
              type="text"
              name="name"
              value={addEvacuationForm.name}
              onChange={handleAddModalChange}
            />
          </div>

          <div className="horizontal-container">
            <span className="item-details-identifier">Location:</span>
            <div
              style={{
                display: "flex",
                width: "100%",
                flexDirection: "row",
                gap: "5px",
              }}
            >
              <input
                type="text"
                readOnly
                placeholder="Select a location"
                value={
                  addEvacuationForm.lat
                    ? `${addEvacuationForm.lat} , ${addEvacuationForm.lng}`
                    : ""
                }
              />
              <button
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid #ddd",
                  outline: "none",
                  color: "#3b82f6",
                  width: "35px",
                  borderRadius: "5px",
                }}
                onClick={openLocationPicker}
              >
                <FontAwesomeIcon icon={faMapMarkerAlt} style={{ height: "20px" }} />
              </button>
            </div>
          </div>

          <div className="horizontal-container">
            <span className="item-details-identifier">Classification:</span>
            <select
              id="classification"
              name="classification"
              required
              value={addEvacuationForm.classification}
              onChange={handleAddModalChange}
            >
              <option value="" disabled>
                Select Classification
              </option>
              <option value="province">Province</option>
              <option value="city">City</option>
              <option value="municipality">Municipality</option>
              <option value="barangay">Barangay</option>
            </select>
          </div>

          <div className="horizontal-container">
            <span className="item-details-identifier">Population:</span>
            <input
              type="number"
              name="population"
              value={addEvacuationForm.population}
              onChange={handleAddModalChange}
            />
          </div>

          <div className="horizontal-container">
            <span className="item-details-identifier">Contact Info:</span>
            <input
              type="text"
              name="contact_info"
              value={addEvacuationForm.contact_info}
              onChange={handleAddModalChange}
            />
          </div>

          <div className="horizontal-container">
            <span className="item-details-identifier">Risk Level:</span>
            <select
              id="risk_level"
              name="risk_level"
              required
              value={addEvacuationForm.risk_level}
              onChange={handleAddModalChange}
            >
              <option value="" disabled>
                Select Risk Level
              </option>
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
                  onSubmit: () => {
                    const id = String(cell(0)); // safe id
                    handleEditRecord(id, addEvacuationForm);
                  },
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
