import React, { useEffect, useState, useRef } from "react";
import { Modal } from "../../../components/Page_Furniture/Modals";
import "../css/LGUmanagement.css";
import { Link } from "react-router-dom";
import "../../response_dashboard/DefaultListViewStyle.scss";
import { TableView } from "../../../components/TableView/table_view";
import { API } from "../../../API_Handler/Axio_API_Handler";
import { TableReponse } from "../../../components/TableView/table_view";
import LocationPickerModal from "../../../components/Page_Furniture/LocationPickerModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";
import { MessageBox } from "../../../components/Page_Furniture/MessageBox";
//Mapview
type Props = {
  lat: number;
  lng: number;
};
import { faMapMarker } from "@fortawesome/free-solid-svg-icons";
//API Handler
export async function getRecord(record_type: string): Promise<any> {
  const response = await API.get(
    `/lgu_profiling/manage_lgu/get_${record_type}`,
  );
  return response.data;
}

export async function addRecord(
  record_type: string,
  payload: any,
): Promise<any | false> {
  try {
    const response = await API.post(
      `/lgu_profiling/manage_lgu/add_${record_type}`,
      payload,
    );
    return response.data;
  } catch (error) {
    console.error("Failed to add record:", error);
    return false;
  }
}

export async function deleteResponseReport(reportId: String): Promise<any> {
  try {
    const response = await API.delete(
      `/response_dashboard/report_list/delete_report/${reportId}`,
    );
    return response;
  } catch (error: any) {
    if (error.response) {
      console.error("Error: ", error.response.data.detail);
    } else {
      console.error("Request error: ", error.message);
    }
  }
}

export async function updateResponseReport(
  reportId: String,
  report_type: String,
  report_status: String,
) {
  try {
    const response = await API.put(
      `/response_dashboard/report_list/update_report/${reportId}`,
      {
        report_type: report_type,
        status: report_status,
      },
    );
    return { sucess: true, data: response.data };
  } catch (error: any) {
    if (error.respose) {
      console.error("Error: ", error.response.data.detail);
      return {
        sucess: false,
        error: error.response?.data?.detail || error.message,
      };
    } else {
      console.error("Request error: ", error.message);
      return { sucess: false, error: "An unexpected error occured." };
    }
  }
}
type BaseModalProps = {
  isModalOpen: boolean;
  closeModal: () => void;
  setMessageBox: React.Dispatch<React.SetStateAction<MessageBoxState>>;
};

type addEvacuationModalProp = BaseModalProps & {
  handleAddEvacuation: (payload: any) => void;
  defaultValue?: any;
};
const AddEvacuationModal: React.FC<addEvacuationModalProp> = ({
  isModalOpen,
  closeModal,
  setMessageBox,
  handleAddEvacuation,
  defaultValue,
}) => {
  type evacuationProp = {
    name: string;
    lat: number;
    lng: number;
    capacity: number;
  };
  const [addEvacuationForm, setAddEvacuationForm] = useState<evacuationProp>({
    name: "",
    lat: 0,
    lng: 0,
    capacity: 0,
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
            <span className="item-details-identifier">Capacity:</span>
            <input
              type="text"
              name="capacity"
              value={addEvacuationForm.capacity}
              onChange={handleAddModalChange}
            />
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
                    handleAddEvacuation(addEvacuationForm);
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
//

const MapOfCebu = () => {
  const [activeTab, setActiveTab] = useState("lgu");
  const [lguResponse, setLguResponse] = useState<TableReponse | null>(null);
  const [barangayResponse, setBarangayResponse] = useState<TableReponse | null>(
    null,
  );
  const [rafiResponse, setRafiResponse] = useState<TableReponse | null>(null);
  const [hazardResponse, setHazardResponse] = useState<TableReponse | null>(
    null,
  );
  const [evacuationResponse, setEvacuationResponse] =
    useState<TableReponse | null>(null);
  const refreshTable = useRef<() => void>(() => {});
  const [currentTabName, setCurrentTabName] = useState("LGU");
  const handleRefreshTable = () => refreshTable.current?.();
  type MessageBoxState = {
    isOpen: boolean;
    type: "message" | "confirm";
    message: string;
    onSubmit?: () => void;
    onClose: () => void;
  };
  async function fetchData(name: string) {
    try {
      const response = await getRecord(name);
      switch (name) {
        case "lgu":
          setLguResponse(response);
          break;
        case "barangay":
          setBarangayResponse(response);
          break;
        case "rafi":
          setRafiResponse(response);
          break;
        case "hazard":
          setHazardResponse(response);
          break;
        case "evacuation":
          setEvacuationResponse(response);
          break;
      }
    } catch (error) {
      console.error(error);
    }
  }

  const [addModalState, setAddModalState] = useState<{
    lguModal: boolean;
    barangay: boolean;
    rafi: boolean;
    hazard: boolean;
    evacuation: boolean;
  }>({
    lguModal: false,
    barangay: false,
    rafi: false,
    hazard: false,
    evacuation: false,
  });

  const openAddModal = () => {
    setAddModalState((prev) => ({
      ...prev,
      [activeTab]: true,
    }));
  };
  const closeAddModal = () => {
    setAddModalState((prev) => ({
      ...prev,
      [activeTab]: false,
    }));
  };

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);
  const handleAddRecord = async (payload: any) => {
    const response = await addRecord(activeTab, payload);
    if (response) {
      setMessageBox((prev) => ({
        ...prev, // preserves onClose and anything else
        isOpen: true, // your new values
        type: "message",
        message: "Record added successfully",
      }));
      closeAddModal();
      handleRefreshTable();
    } else {
      setMessageBox((prev) => ({
        ...prev, // preserves onClose and anything else
        isOpen: true, // your new values
        type: "message",
        message: "Record failed",
      }));
    }
  };
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

  return (
    <div className="app-container">
      <MessageBox
        isOpen={messageBox.isOpen}
        onClose={messageBox.onClose}
        type={messageBox.type}
        message={messageBox.message}
        onSubmit={messageBox.onSubmit}
      ></MessageBox>
      <AddEvacuationModal
        isModalOpen={addModalState.evacuation}
        closeModal={closeAddModal}
        setMessageBox={setMessageBox}
        handleAddEvacuation={handleAddRecord}
      ></AddEvacuationModal>

      <div className="tabs">
        <button
          onClick={() => setActiveTab("lgu")}
          className={activeTab === "lgu" ? "active-tab" : ""}
        >
          LGU
        </button>
        <button
          onClick={() => setActiveTab("barangay")}
          className={activeTab === "barangay" ? "active-tab" : ""}
        >
          Baranggay
        </button>
        <button
          onClick={() => setActiveTab("rafi")}
          className={activeTab === "rafi" ? "active-tab" : ""}
        >
          RAFI Infrastructure
        </button>
        <button
          onClick={() => setActiveTab("hazard")}
          className={activeTab === "hazard" ? "active-tab" : ""}
        >
          Hazard Mapping
        </button>
        <button
          onClick={() => setActiveTab("evacuation")}
          className={activeTab === "evacuation" ? "active-tab" : ""}
        >
          Evacuation Center
        </button>
      </div>

      <div>
        {activeTab === "lgu" && (
          <>
            <div className="horizontal-container">
              <div className="table-actions">
                <input type="text" placeholder="Search report"></input>
                <button>Search</button>
                <button>+ Add LGU</button>
              </div>
            </div>
            {lguResponse ? (
              <TableView
                tableJSON={lguResponse}
                onClickCallback={(row: any) => {}}
                setCallbackTableData={true}
                pageRequest={`/lgu_profiling/manage_lgu/get_lgu?page=`}
                updateTable={(fn) => (refreshTable.current = fn)}
              />
            ) : (
              <div>Loading data...</div>
            )}
          </>
        )}
        {activeTab === "barangay" && (
          <>
            <div className="horizontal-container">
              <div className="table-actions">
                <input type="text" placeholder="Search report"></input>
                <button>Search</button>
                <button>+ Add Barangay</button>
              </div>
            </div>
            {barangayResponse ? (
              <TableView
                tableJSON={barangayResponse}
                onClickCallback={(row: any) => {}}
                setCallbackTableData={true}
                pageRequest={`/lgu_profiling/manage_lgu/get_barangay?page=`}
                updateTable={(fn) => (refreshTable.current = fn)}
              />
            ) : (
              <div>Loading data...</div>
            )}
          </>
        )}
        {activeTab === "rafi" && (
          <>
            <div className="horizontal-container">
              <div className="table-actions">
                <input type="text" placeholder="Search report"></input>
                <button>Search</button>
                <button>+ Add Rafi Infrastructure</button>
              </div>
            </div>
            {rafiResponse ? (
              <TableView
                tableJSON={rafiResponse}
                onClickCallback={(row: any) => {}}
                setCallbackTableData={true}
                pageRequest={`/lgu_profiling/manage_lgu/get_rafi?page=`}
                updateTable={(fn) => (refreshTable.current = fn)}
              />
            ) : (
              <div>Loading data...</div>
            )}
          </>
        )}
        {activeTab === "hazard" && (
          <>
            <div className="horizontal-container">
              <div className="table-actions">
                <input type="text" placeholder="Search report"></input>
                <button>Search</button>
                <button>+ Add Hazard</button>
              </div>
            </div>
            {hazardResponse ? (
              <TableView
                tableJSON={hazardResponse}
                onClickCallback={(row: any) => {}}
                setCallbackTableData={true}
                pageRequest={`/lgu_profiling/manage_lgu/get_hazard?page=`}
                updateTable={(fn) => (refreshTable.current = fn)}
              />
            ) : (
              <div>Loading data...</div>
            )}
          </>
        )}
        {activeTab === "evacuation" && (
          <>
            <div className="horizontal-container">
              <div className="table-actions">
                <input type="text" placeholder="Search report"></input>
                <button>Search</button>
                <button onClick={openAddModal}>+ Add Evacuation Center</button>
              </div>
            </div>
            {evacuationResponse ? (
              <TableView
                tableJSON={evacuationResponse}
                onClickCallback={(row: any) => {}}
                setCallbackTableData={true}
                pageRequest={`/lgu_profiling/manage_lgu/get_evacuation?page=`}
                updateTable={(fn) => (refreshTable.current = fn)}
              />
            ) : (
              <div>Loading data...</div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MapOfCebu;
