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

type FuzzySeachElementProps = {
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  name: string;
  searchURL: string;
};

const FuzzySeachElement: React.FC<FuzzySeachElementProps> = ({
  value,
  onChange,
  name,
  searchURL,
}) => {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        flexDirection: "row",
        gap: "5px",
        position: "relative",
      }}
    >
      <input
        value={value}
        name={name}
        onChange={(e) => {
          onChange(e);
        }}
      />
      <div
        style={{
          display: "flex",
          border: "1px solid black",
          width: "100%",
          height: "200px",
          position: "absolute",
          top: "100%",
          borderRadius: "5px",
          backgroundColor: "white",
        }}
      ></div>
    </div>
  );
};

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
export const AddBarangayModal: React.FC<addLGUModalProps> = ({
  isModalOpen,
  closeModal,
  setMessageBox,
  handleAddRecord,
}) => {
  type evacuationProp = {
    name: string;
    lat: number;
    lng: number;
    LGU: string;
    population: number;
    contact_info: string;
    risk_level: string;
  };
  const [addEvacuationForm, setAddEvacuationForm] = useState<evacuationProp>({
    name: "",
    lat: 0,
    lng: 0,
    LGU: "",
    population: 0,
    contact_info: "",
    risk_level: "",
  });
  const [locationPickerIsOpen, setLocationPickerIsOpen] = useState(false);

  const openLocationPicker = () => setLocationPickerIsOpen(true);
  const closeLocationPicker = () => setLocationPickerIsOpen(false);
  const handleLocationPickerSubmit = (mapData: {
    lat: number;
    lng: number;
  }) => {
    setAddEvacuationForm((prev) => ({
      ...prev,
      lat: mapData.lat,
      lng: mapData.lng,
    }));
  };
  const handleAddModalChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setAddEvacuationForm((prevData) => ({
      ...prevData,
      [name]: value,
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
            <span className="details-title">Add Evacuation</span>
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
                {" "}
                <FontAwesomeIcon
                  icon={faMapMarkerAlt}
                  style={{ height: "20px" }}
                />
              </button>
            </div>
          </div>
          <div className="horizontal-container">
            <span className="item-details-identifier">LGU:</span>
            <FuzzySeachElement
              value={addEvacuationForm.LGU}
              name="LGU"
              onChange={handleAddModalChange}
              searchURL="/search_lgu"
            ></FuzzySeachElement>
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
              type="number"
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
              <option value="" selected disabled>
                Select LGU Level
              </option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="High">Long</option>
            </select>
          </div>
          <div className="action-button">
            <button
              style={{ backgroundColor: "#749AB6" }}
              onClick={() => {
                setMessageBox((prev) => ({
                  ...prev, // preserves onClose and anything else
                  isOpen: true, // your new values
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

export const ViewLGUModal: React.FC<viewEvecuationModalProp> = ({
  isModalOpen,
  closeModal,
  setMessageBox,
  selectedData,
  handleDeleteRecord,
  openEditModal,
}) => {
  const [isMoreOptionVisible, setIsMoreOptionVisible] = useState(false);
  const toggleMoreOptionVisible = () => {
    setIsMoreOptionVisible(!isMoreOptionVisible);
  };
  useEffect(() => {
    if (!isModalOpen) {
      setIsMoreOptionVisible(false);
    }
  }, [isModalOpen]);

  return (
    <Modal isOpen={isModalOpen} onClose={closeModal} zIndex={998}>
      <div className="modal-container" style={{ paddingTop: "30px" }}>
        <div className="horizontal-container space-between-container">
          <span className="title-modal-text">View Details</span>
          <div
            className="horizontal-container"
            style={{ width: "auto", gap: "5px" }}
          >
            <div className="more-options-container">
              <button onClick={toggleMoreOptionVisible}>
                <FontAwesomeIcon
                  icon={faEllipsisVertical}
                  style={{ height: "20px" }}
                />
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
                        ...prev, // preserves onClose and anything else
                        isOpen: true, // your new values
                        type: "confirm",
                        message: "Are you sure you want to delete this record?",
                        onSubmit: () => {
                          handleDeleteRecord(selectedData.data[0].text);
                        },
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
          <span style={{ width: "100%", textAlign: "center" }}>
            {selectedData.data[1].text}
          </span>
        </div>
        <div className="horizontal-container">
          <span className="item-details-identifier">
            Location: (Latitude, Longitude)
          </span>
          <span style={{ width: "100%", textAlign: "center" }}>
            {selectedData.data[2].text}, {selectedData.data[3].text}
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
          <MapWithPin
            lat={parseFloat(selectedData.data[2].text)}
            lng={parseFloat(selectedData.data[3].text)}
          ></MapWithPin>
        </div>
        <div className="horizontal-container">
          <span className="item-details-identifier">Classification:</span>
          <span style={{ width: "100%", textAlign: "center" }}>
            {selectedData.data[4].text}
          </span>
        </div>
        <div className="horizontal-container">
          <span className="item-details-identifier">Population:</span>
          <span style={{ width: "100%", textAlign: "center" }}>
            {selectedData.data[5].text}
          </span>
        </div>
        <div className="horizontal-container">
          <span className="item-details-identifier">Contact Info:</span>
          <span style={{ width: "100%", textAlign: "center" }}>
            {selectedData.data[6].text}
          </span>
        </div>
        <div className="horizontal-container">
          <span className="item-details-identifier">Risk Level:</span>
          <span style={{ width: "100%", textAlign: "center" }}>
            {selectedData.data[7].text}
          </span>
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
export const EditLGUModal: React.FC<editEvacuationModalProp> = ({
  isModalOpen,
  closeModal,
  setMessageBox,
  handleEditRecord,
  selectedData,
}) => {
  type evacuationProp = {
    name: string;
    lat: number;
    lng: number;
    classification: string;
    population: number;
    contact_info: string;
    risk_level: string;
  };
  const [addEvacuationForm, setAddEvacuationForm] = useState<evacuationProp>({
    name: selectedData.data[1].text,
    lat: parseFloat(selectedData.data[2].text),
    lng: parseFloat(selectedData.data[3].text),
    classification: selectedData.data[4].text,
    population: parseInt(selectedData.data[5].text),
    contact_info: selectedData.data[6].text,
    risk_level: selectedData.data[7].text,
  });
  const [locationPickerIsOpen, setLocationPickerIsOpen] = useState(false);

  const openLocationPicker = () => setLocationPickerIsOpen(true);
  const closeLocationPicker = () => setLocationPickerIsOpen(false);
  const handleLocationPickerSubmit = (mapData: {
    lat: number;
    lng: number;
  }) => {
    setAddEvacuationForm((prev) => ({
      ...prev,
      lat: mapData.lat,
      lng: mapData.lng,
    }));
  };
  const handleAddModalChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setAddEvacuationForm((prevData) => ({
      ...prevData,
      [name]: value,
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
            <span className="details-title">Update Evacuation</span>
          </div>
          <div className="horizontal-container">
            <span className="details-title">Add Evacuation</span>
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
                {" "}
                <FontAwesomeIcon
                  icon={faMapMarkerAlt}
                  style={{ height: "20px" }}
                />
              </button>
            </div>
          </div>
          <div className="horizontal-container">
            <span className="item-details-identifier">Classification</span>
            <select
              id="classification"
              name="classification"
              required
              value={addEvacuationForm.classification}
              onChange={handleAddModalChange}
            >
              <option value="" selected disabled>
                Select LGU Level
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
              type="number"
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
              <option value="" selected disabled>
                Select LGU Level
              </option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="High">Long</option>
            </select>
          </div>
          <div className="action-button">
            <button
              style={{ backgroundColor: "#749AB6" }}
              onClick={() => {
                setMessageBox((prev) => ({
                  ...prev, // preserves onClose and anything else
                  isOpen: true, // your new values
                  type: "confirm",
                  message: "Are you sure you want to update this record?",
                  onSubmit: () => {
                    handleEditRecord(
                      selectedData.data[0].text,
                      addEvacuationForm,
                    );
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
