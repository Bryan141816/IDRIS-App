import {
  TableView,
  TableReponse,
} from "../../../components/TableView/table_view";
import "./DemandAndResponseList.scss";
import { Modal } from "../../../components/Page_Furniture/Modals";
import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  faEllipsisVertical,
  faTrash,
  faPen,
  faMapMarkerAlt,
} from "@fortawesome/free-solid-svg-icons";
import {
  getDemandList,
  addRecord,
  deleteRecord,
  updateRecord,
} from "../../../API_Handler/response_dashboard_demand_and_response_list.ts";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import LocationPickerModal from "../../../components/Page_Furniture/LocationPickerModal.tsx";

import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MessageBox } from "../../../components/Page_Furniture/MessageBox.tsx";

// Default marker icon fix for newer leaflet versions
const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
});

type Props = {
  lat: number;
  lng: number;
};

const MapWithPin: React.FC<Props> = ({ lat, lng }) => {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      <Marker position={[lat, lng]} icon={defaultIcon} />
    </MapContainer>
  );
};
type MessageBoxState = {
  isOpen: boolean;
  type: "message" | "confirm";
  message: string;
  onSubmit?: () => void;
  onClose: () => void;
};

const DemandAndResponseList = () => {
  const [response_data, setResposeData] = useState<TableReponse | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isViewModalSelected, setIsViewModalSelected] = useState<any>(null);
  const [isMoreOptionVisible, setMoreOptionVisible] = useState(false);
  const [isEditModeEnabled, setIsEditModeEnabled] = useState(false);
  const [needItemCounter, setNeedItemCounter] = useState(0);
  const [locationPickerIsOpen, setLocationPickerIsOpen] = useState(false);
  const refreshTable = useRef<() => void>(() => {});
  const handleRefreshTable = () => refreshTable.current?.();

  type NeedItem = {
    id: number;
    need: string;
    amount: string;
  };

  const [addDemand, setAddDemand] = useState<{
    title_lable: string;
    address: string;
    lat: number | null;
    lng: number | null;
    status: string;
    needs: NeedItem[];
    priority: string;
  }>({
    title_lable: "",
    address: "",
    lat: null,
    lng: null,
    status: "no response",
    needs: [],
    priority: "Low",
  });

  const [needInput, setNeedInput] = useState<{ need: string; amount: string }>({
    need: "",
    amount: "",
  });

  const openLocationPicker = () => setLocationPickerIsOpen(true);
  const closeLocationPicker = () => setLocationPickerIsOpen(false);

  const closeMessageBox = () => {
    setMessageBox((prev) => ({
      ...prev,
      isOpen: false,
    }));
  };
  const [messageBox, setMessageBox] = useState<MessageBoxState>({
    isOpen: false,
    type: "message",
    message: "",
    onSubmit: undefined,
    onClose: closeMessageBox,
  });

  const handleAddModalChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setAddDemand((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
  const handleNeedInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNeedInput((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleAddNeeds = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (needInput.need == "" || needInput.amount == "") {
      return;
    }
    e.preventDefault();
    const newDemand: NeedItem = {
      id: needItemCounter,
      need: needInput.need,
      amount: needInput.amount,
    };

    setAddDemand((prev) => ({
      ...prev,
      needs: [...prev.needs, newDemand],
    }));
    setNeedItemCounter(needItemCounter + 1);
    setNeedInput({ need: "", amount: "" });
  };
  const handleLocationPickerSubmit = (mapData: {
    lat: number;
    lng: number;
  }) => {
    setAddDemand((prev) => ({
      ...prev,
      lat: mapData.lat,
      lng: mapData.lng,
    }));
  };
  const openViewModal = () => setIsViewModalOpen(true);
  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setMoreOptionVisible(false);
  };

  const openAddModal = () => setAddModalOpen(true);
  const closeAddModal = () => {
    setAddModalOpen(false);
    resetAddDemand();
  };

  const openEditModal = () => {
    setIsEditModeEnabled(true);
  };
  const closeEditModal = () => {
    setIsEditModeEnabled(false);
    resetAddDemand();
  };

  const resetAddDemand = () => {
    setAddDemand({
      title_lable: "",
      address: "",
      lat: null,
      lng: null,
      status: "no response",
      needs: [],
      priority: "Low",
    });
    setNeedItemCounter(0);
  };

  const toggleMoreOptionVisible = () =>
    setMoreOptionVisible(!isMoreOptionVisible);

  async function fetchData() {
    try {
      const response = await getDemandList();
      setResposeData(response);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddDemandSubmit = async () => {
    try {
      const response = await addRecord(addDemand);
      closeAddModal();
      handleRefreshTable();
      resetAddDemand();
      setMessageBox((prev) => ({
        ...prev, // preserves onClose and anything else
        isOpen: true, // your new values
        type: "message",
        message: "Record Added successfully",
        onClose: closeMessageBox,
      }));
    } catch (error) {
      console.error("Faled to add record ", error);
    }
  };
  const handleUpdateDemandSubmit = async () => {
    try {
      const response = await updateRecord(
        isViewModalSelected.data[0].text,
        addDemand,
      );
      closeEditModal();
      setMessageBox((prev) => ({
        ...prev, // preserves onClose and anything else
        isOpen: true, // your new values
        type: "message",
        message: "Record Updated successfully",
        onClose: closeMessageBox,
      }));
      handleRefreshTable();
      resetAddDemand();
    } catch (error) {
      console.error("Faled to add record ", error);
    }
  };

  const handleDeleteReport = async (report_id: String) => {
    try {
      const response = await deleteRecord(report_id);
      closeViewModal();
      resetAddDemand();
      setMessageBox((prev) => ({
        ...prev, // preserves onClose and anything else
        isOpen: true, // your new values
        type: "message",
        message: "Record Deleted successfully",
        onClose: closeMessageBox,
      }));
      handleRefreshTable();
    } catch (error) {
      console.error("Failed to delete report: ", error);
    }
  };

  return (
    <div className="report-container">
      <MessageBox
        isOpen={messageBox.isOpen}
        onClose={messageBox.onClose}
        type={messageBox.type}
        message={messageBox.message}
        onSubmit={messageBox.onSubmit}
      ></MessageBox>
      {locationPickerIsOpen && (
        <LocationPickerModal
          isOpenProp={locationPickerIsOpen}
          onCloseProp={closeLocationPicker}
          onSubmit={handleLocationPickerSubmit}
          lat={addDemand.lat}
          lng={addDemand.lng}
        />
      )}
      <Modal isOpen={isEditModeEnabled} onClose={closeEditModal} zIndex={998}>
        <div className="modal-container">
          <div className="horizontal-container">
            <span className="details-title">Create Demand Report</span>
          </div>
          <div className="horizontal-container">
            <span className="item-details-identifier">Title:</span>
            <input
              type="text"
              name="title_lable"
              value={addDemand.title_lable}
              onChange={handleAddModalChange}
            />
          </div>
          <div className="horizontal-container">
            <span className="item-details-identifier">Address:</span>
            <input
              type="text"
              value={addDemand.address}
              onChange={handleAddModalChange}
              name="address"
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
                  addDemand.lat ? `${addDemand.lat} , ${addDemand.lng}` : ""
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
            <span className="item-details-identifier">Needs:</span>
            <div className="dynamic-info-container">
              <form id="needs-adder">
                <input
                  type="text"
                  placeholder="Enter a need"
                  id="input-need"
                  value={needInput.need}
                  name="need"
                  onChange={handleNeedInputChange}
                  required
                />
                <input
                  type="number"
                  placeholder="Enter Amount"
                  id="input-amount"
                  value={needInput.amount}
                  name="amount"
                  onChange={handleNeedInputChange}
                  required
                />
                <button onClick={handleAddNeeds}>Add</button>
              </form>
              <div id="needs-content-container">
                {addDemand.needs.map((need) => (
                  <div key={need.id} className="needs-content">
                    <span id="need-label-adder">{need.need}</span>
                    <span>| {need.amount} |</span>
                    <button
                      onClick={() => {
                        setAddDemand((prev) => ({
                          ...prev,
                          needs: prev.needs.filter((n) => n.id !== need.id),
                        }));
                      }}
                      style={{
                        marginLeft: "10px",
                        color: "white",
                        backgroundColor: "red",
                        border: "none",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="horizontal-container">
            <span className="item-details-identifier">Status:</span>
            <select
              value={addDemand.status}
              onChange={handleAddModalChange}
              name="status"
            >
              <option value="no response">No response</option>
              <option value="responded">Responded</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="horizontal-container">
            <span className="item-details-identifier">Priority:</span>
            <select
              value={addDemand.priority}
              onChange={handleAddModalChange}
              name="priority"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
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
                  message: "Are you sure you want to edit this record?",
                  onSubmit: handleUpdateDemandSubmit,
                }));
              }}
            >
              Update
            </button>
            <button
              style={{ backgroundColor: "#F84B4D" }}
              onClick={closeEditModal}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
      <Modal isOpen={isAddModalOpen} onClose={closeAddModal} zIndex={998}>
        <div className="modal-container">
          <div className="horizontal-container">
            <span className="details-title">Create Demand Report</span>
          </div>
          <div className="horizontal-container">
            <span className="item-details-identifier">Title:</span>
            <input
              type="text"
              name="title_lable"
              value={addDemand.title_lable}
              onChange={handleAddModalChange}
            />
          </div>
          <div className="horizontal-container">
            <span className="item-details-identifier">Address:</span>
            <input
              type="text"
              value={addDemand.address}
              onChange={handleAddModalChange}
              name="address"
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
                  addDemand.lat ? `${addDemand.lat} , ${addDemand.lng}` : ""
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
            <span className="item-details-identifier">Needs:</span>
            <div className="dynamic-info-container">
              <form id="needs-adder">
                <input
                  type="text"
                  placeholder="Enter a need"
                  id="input-need"
                  value={needInput.need}
                  name="need"
                  onChange={handleNeedInputChange}
                  required
                />
                <input
                  type="number"
                  placeholder="Enter Amount"
                  id="input-amount"
                  value={needInput.amount}
                  name="amount"
                  onChange={handleNeedInputChange}
                  required
                />
                <button onClick={handleAddNeeds}>Add</button>
              </form>
              <div id="needs-content-container">
                {addDemand.needs.map((need) => (
                  <div key={need.id} className="needs-content">
                    <span id="need-label-adder">{need.need}</span>
                    <span>| {need.amount} |</span>
                    <button
                      onClick={() => {
                        setAddDemand((prev) => ({
                          ...prev,
                          needs: prev.needs.filter((n) => n.id !== need.id),
                        }));
                      }}
                      style={{
                        marginLeft: "10px",
                        color: "white",
                        backgroundColor: "red",
                        border: "none",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="horizontal-container">
            <span className="item-details-identifier">Priority:</span>
            <select
              value={addDemand.priority}
              onChange={handleAddModalChange}
              name="priority"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
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
                  onSubmit: handleAddDemandSubmit,
                }));
              }}
            >
              Add
            </button>
            <button
              style={{ backgroundColor: "#F84B4D" }}
              onClick={closeAddModal}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
      {isViewModalSelected ? (
        <Modal isOpen={isViewModalOpen} onClose={closeViewModal} zIndex={998}>
          <div className="modal-container" style={{ paddingTop: "30px" }}>
            <div className="horizontal-container space-between-container">
              <span className="title-modal-text">View Demand</span>
              <div
                className="horizontal-container"
                style={{ width: "auto", gap: "5px" }}
              >
                <button className="mark-as-button">Mark as Responded</button>
                <div className="more-options-container">
                  <button onClick={toggleMoreOptionVisible}>
                    <FontAwesomeIcon
                      icon={faEllipsisVertical}
                      style={{ height: "20px" }}
                    />
                  </button>
                  {isMoreOptionVisible && (
                    <div className="more-options-viewer">
                      <button
                        onClick={() => {
                          closeViewModal();
                          setAddDemand({
                            title_lable: isViewModalSelected.data[3].text,
                            address: isViewModalSelected.data[4].text,
                            lat: parseFloat(isViewModalSelected.data[5].text),
                            lng: parseFloat(isViewModalSelected.data[6].text),
                            status: isViewModalSelected.data[7].text,
                            needs: isViewModalSelected.data[1].value,
                            priority: isViewModalSelected.data[9].text,
                          });

                          setNeedItemCounter(
                            isViewModalSelected.data[1].value[
                              isViewModalSelected.data[1].value.length - 1
                            ].id + 1,
                          );
                          openEditModal();
                        }}
                      >
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
                            message:
                              "Are you sure you want to delete this record?",
                            onSubmit: () =>
                              handleDeleteReport(
                                isViewModalSelected.data[0].text,
                              ),
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
              <span className="item-details-identifier">Title:</span>
              <span style={{ width: "100%", textAlign: "center" }}>
                {isViewModalSelected.data[3].text}
              </span>
            </div>
            <div className="horizontal-container">
              <span className="item-details-identifier">Address:</span>
              <span style={{ width: "100%", textAlign: "center" }}>
                {isViewModalSelected.data[4].text}
              </span>
            </div>
            <div className="horizontal-container">
              <span className="item-details-identifier">
                Location: (Latitude, Longitude)
              </span>
              <span style={{ width: "100%", textAlign: "center" }}>
                {isViewModalSelected.data[5].text},{" "}
                {isViewModalSelected.data[6].text}
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
                lat={parseFloat(isViewModalSelected.data[5].text)}
                lng={parseFloat(isViewModalSelected.data[6].text)}
              ></MapWithPin>
            </div>
            <div className="horizontal-container">
              <span className="item-details-identifier">Status:</span>
              <span style={{ width: "100%", textAlign: "center" }}>
                {isViewModalSelected.data[7].text}
              </span>
            </div>
            <div className="horizontal-container">
              <span className="item-details-identifier">Needs:</span>
              <div className="dynamic-info-container">
                <div id="needs-content-container">
                  {isViewModalSelected.data[1].value.map((need: NeedItem) => (
                    <div key={need.id} className="needs-content">
                      <span id="need-label-adder">{need.need}</span>
                      <span>| {need.amount} |</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="horizontal-container">
              <span className="item-details-identifier">Priority:</span>
              <span style={{ width: "100%", textAlign: "center" }}>
                {isViewModalSelected.data[9].text}
              </span>
            </div>
            <div className="action-button">
              <button
                style={{ backgroundColor: "#F84B4D" }}
                onClick={closeViewModal}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      ) : (
        <></>
      )}

      <div className="horizontal-container">
        <div className="navigator-container">
          <Link to="/response_dashboard/demand_and_response_map">
            Demand And Response Map
          </Link>
          <h3>/List View</h3>
        </div>
        <div className="table-actions">
          <input type="text" placeholder="Search report"></input>
          <button>Search</button>
          <button onClick={openAddModal}>+ Add Report</button>
        </div>
      </div>
      <div style={{ display: "flex", width: "100%" }}>
        {response_data ? (
          <TableView
            tableJSON={response_data}
            onClickCallback={(row: any) => {
              setIsViewModalSelected(row);
              openViewModal();
            }}
            setCallbackTableData={true}
            pageRequest="/response_dashboard/demand_and_response/list_view?page="
            updateTable={(fn) => (refreshTable.current = fn)}
          />
        ) : (
          <div>Loading data...</div>
        )}
      </div>
    </div>
  );
};
export default DemandAndResponseList;
