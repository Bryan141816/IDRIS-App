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
import { API } from "../../../../API_Handler/Axio_API_Handler";

async function fetchLinkedBarangaysForEvac(evacId: string | number) {
  try {
    const res = await API.get(
      `/lgu_profiling/manage_lgu/evacuation/${evacId}/linked_barangays`,
    );
    return res.data as { count: number; names: string[] };
  } catch (e) {
    console.error("Failed to check linked barangays", e);
    return { count: 0, names: [] };
  }
}

type addEvacuationModalProp = BaseModalProps & {
  handleAddEvacuation: (payload: any) => void;
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

export const AddEvacuationModal: React.FC<addEvacuationModalProp> = ({
  isModalOpen,
  closeModal,
  setMessageBox,
  handleAddEvacuation,
}) => {
  type EvacuationForm = {
    name: string;
    lat: number;
    lng: number;
    capacity: number;
    occupied: number; // ✅ added
  };

  const [addEvacuationForm, setAddEvacuationForm] = useState<EvacuationForm>({
    name: "",
    lat: 0,
    lng: 0,
    capacity: 0,
    occupied: 0, // ✅ default to 0
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
    const { name, value, type } = e.target as HTMLInputElement;
    setAddEvacuationForm((prevData) => ({
      ...prevData,
      [name]: type === "number" ? Number(value) : value,
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
                <FontAwesomeIcon
                  icon={faMapMarkerAlt}
                  style={{ height: "20px" }}
                />
              </button>
            </div>
          </div>

          <div className="horizontal-container">
            <span className="item-details-identifier">Capacity:</span>
            <input
              type="number"
              name="capacity"
              value={addEvacuationForm.capacity}
              onChange={handleAddModalChange}
              min={0}
            />
          </div>

          {/* ✅ New occupied input */}
          <div className="horizontal-container">
            <span className="item-details-identifier">Occupied:</span>
            <input
              type="number"
              name="occupied"
              value={addEvacuationForm.occupied}
              onChange={handleAddModalChange}
              min={0}
              max={addEvacuationForm.capacity || undefined}
            />
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
                  onSubmit: () => {
                    handleAddEvacuation(addEvacuationForm);
                  },
                }));
              }}
            >
              Add
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

export const ViewEvecuationModal: React.FC<viewEvecuationModalProp> = ({
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
    if (!isModalOpen) setIsMoreOptionVisible(false);
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
                    <FontAwesomeIcon icon={faPen} /> Edit Record
                  </button>
                  <button
                    style={{ color: "red" }}
                    onClick={async () => {
                      const evacId = selectedData.data[0].text; // hidden id
                      const evacName = selectedData.data[1].text; // name

                      const { count, names } =
                        await fetchLinkedBarangaysForEvac(evacId);

                      if (count > 0) {
                        // show up to 5 to keep it readable
                        const shown = names.slice(0, 5).join(", ");
                        const more = count > 5 ? ` and ${count - 5} more…` : "";

                        setMessageBox((prev) => ({
                          ...prev,
                          isOpen: true,
                          type: "confirm",
                          message:
                            `Heads up: “${evacName}” is linked to ${count} barangay record(s): ` +
                            `${shown}${more}.\n\n` +
                            `Are you sure you want to delete this record?`,
                          onSubmit: () => {
                            // proceed with your normal delete (backend will still block if linked)
                            handleDeleteRecord(evacId);
                          },
                        }));
                      } else {
                        // normal confirm (your original flow)
                        setMessageBox((prev) => ({
                          ...prev,
                          isOpen: true,
                          type: "confirm",
                          message:
                            "Are you sure you want to delete this record?",
                          onSubmit: () => {
                            handleDeleteRecord(evacId);
                          },
                        }));
                      }
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
          />
        </div>

        <div className="horizontal-container">
          <span className="item-details-identifier">Capacity:</span>
          <span style={{ width: "100%", textAlign: "center" }}>
            {selectedData.data[4].text}
          </span>
        </div>

        {/* ✅ Show occupied (index 5) */}
        <div className="horizontal-container">
          <span className="item-details-identifier">Occupied:</span>
          <span style={{ width: "100%", textAlign: "center" }}>
            {selectedData.data[5].text}
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

export const EditEvacuationModal: React.FC<editEvacuationModalProp> = ({
  isModalOpen,
  closeModal,
  setMessageBox,
  handleEditRecord,
  selectedData,
}) => {
  type EvacuationForm = {
    name: string;
    lat: number;
    lng: number;
    capacity: number;
    occupied: number; // ✅ added
  };

  const [addEvacuationForm, setAddEvacuationForm] = useState<EvacuationForm>({
    name: selectedData.data[1].text,
    lat: parseFloat(selectedData.data[2].text),
    lng: parseFloat(selectedData.data[3].text),
    capacity: parseInt(selectedData.data[4].text),
    occupied: parseInt(selectedData.data[5].text || "0"), // ✅ pull from table
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
    const { name, value, type } = e.target as HTMLInputElement;
    setAddEvacuationForm((prevData) => ({
      ...prevData,
      [name]: type === "number" ? Number(value) : value,
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
                <FontAwesomeIcon
                  icon={faMapMarkerAlt}
                  style={{ height: "20px" }}
                />
              </button>
            </div>
          </div>

          <div className="horizontal-container">
            <span className="item-details-identifier">Capacity:</span>
            <input
              type="number"
              name="capacity"
              value={addEvacuationForm.capacity}
              onChange={handleAddModalChange}
              min={0}
            />
          </div>

          {/* ✅ New occupied input */}
          <div className="horizontal-container">
            <span className="item-details-identifier">Occupied:</span>
            <input
              type="number"
              name="occupied"
              value={addEvacuationForm.occupied}
              onChange={handleAddModalChange}
              min={0}
              max={addEvacuationForm.capacity || undefined}
            />
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
                    handleEditRecord(
                      selectedData.data[0].text,
                      addEvacuationForm,
                    );
                  },
                }));
              }}
            >
              Update
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
