import { useEffect, useState, useRef } from "react";
import "../css/LGUmanagement.css";
import "../../response_dashboard/DefaultListViewStyle.scss";
import { TableView } from "../../../components/TableView/table_view";
import { API } from "../../../API_Handler/Axio_API_Handler";
import { TableReponse } from "../../../components/TableView/table_view";

import { MessageBox } from "../../../components/Page_Furniture/MessageBox";
import {
  AddEvacuationModal,
  ViewEvecuationModal,
  EditEvacuationModal,
} from "./Modals/EvacuationModals";
import {
  AddRafiModal,
  ViewRafiModalModal,
  EditRafiModal,
} from "./Modals/RAFIInfrastructure";
import { AddBarangayModal } from "./Modals/BarangayModal";
import { AddLGUModal, ViewLGUModal, EditLGUModal } from "./Modals/LGUModals";

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
): Promise<any | { success: boolean; error: string }> {
  try {
    const response = await API.post(
      `/lgu_profiling/manage_lgu/add_${record_type}`,
      payload,
    );

    // If backend returns an ErrorResponse (success = false), catch it here
    if (response.data.success === false) {
      return {
        success: false,
        error: response.data.error || "Unknown error from server",
      };
    }

    // Otherwise, return the created record
    return response.data;
  } catch (error: any) {
    console.error("Failed to add record:", error);

    const message =
      error.response?.data?.error || // new error format
      error.response?.data?.detail || // if FastAPI still raises HTTPException
      error.message ||
      "Unknown error occurred";

    return { success: false, error: message };
  }
}
export async function deleteRecord(
  record_type: string,
  reportId: String,
): Promise<any> {
  try {
    const response = await API.delete(
      `/lgu_profiling/manage_lgu/delete_${record_type}/${reportId}`,
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

export async function updateRecord(
  record_type: string,
  reportId: String,
  payload: any,
) {
  try {
    const response = await API.put(
      `/lgu_profiling/manage_lgu/update_${record_type}/${reportId}`,
      payload,
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
  const handleRefreshTable = () => refreshTable.current?.();
  const [selectedViewData, setSelectedViewData] = useState<any>(null);
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
    lgu: boolean;
    barangay: boolean;
    rafi: boolean;
    hazard: boolean;
    evacuation: boolean;
  }>({
    lgu: false,
    barangay: false,
    rafi: false,
    hazard: false,
    evacuation: false,
  });
  const [viewModalState, setViewModalState] = useState<{
    lgu: boolean;
    barangay: boolean;
    rafi: boolean;
    hazard: boolean;
    evacuation: boolean;
  }>({
    lgu: false,
    barangay: false,
    rafi: false,
    hazard: false,
    evacuation: false,
  });
  const [editModalState, setEditModalState] = useState<{
    lgu: boolean;
    barangay: boolean;
    rafi: boolean;
    hazard: boolean;
    evacuation: boolean;
  }>({
    lgu: false,
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
  const openViewModal = () => {
    setViewModalState((prev) => ({
      ...prev,
      [activeTab]: true,
    }));
  };
  const closeViewModal = () => {
    setViewModalState((prev) => ({
      ...prev,
      [activeTab]: false,
    }));
  };
  const openEditModal = () => {
    closeViewModal();
    setEditModalState((prev) => ({
      ...prev,
      [activeTab]: true,
    }));
  };
  const closeEditModal = () => {
    setEditModalState((prev) => ({
      ...prev,
      [activeTab]: false,
    }));
    openViewModal();
  };

  const handleDeleteRecord = async (id: string) => {
    const response = await deleteRecord(activeTab, id);
    setMessageBox((prev) => ({
      ...prev, // preserves onClose and anything else
      isOpen: true, // your new values
      type: "message",
      message: "Record deleted successfully",
    }));
    closeViewModal();
    handleRefreshTable();
  };

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);
  const handleAddRecord = async (payload: any) => {
    const response = await addRecord(activeTab, payload);
    console.log(response);
    if (!response.error) {
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
        message: response.error,
      }));
    }
  };
  const handleEditRecord = async (id: string, payload: any) => {
    const response = await updateRecord(activeTab, id, payload);
    setMessageBox((prev) => ({
      ...prev, // preserves onClose and anything else
      isOpen: true, // your new values
      type: "message",
      message: "Record has been updated",
    }));
    switch (activeTab) {
      case "lgu":
        setSelectedViewData((prev: any) => {
          const newData = [...prev.data];
          newData[1].text = payload.name;
          newData[2].text = payload.lat;
          newData[3].text = payload.lng;
          newData[4].text = payload.classification;
          newData[5].text = payload.population;
          newData[6].text = payload.contact_info;
          newData[7].text = payload.risk_level;
          return {
            ...prev,
            data: newData,
          };
        });
        break;
      case "evacuation":
        setSelectedViewData((prev: any) => {
          const newData = [...prev.data];
          newData[1].text = payload.name;
          newData[2].text = payload.lat;
          newData[3].text = payload.lng;
          newData[4].text = payload.capacity;
          return {
            ...prev,
            data: newData,
          };
        });
        break;
      case "rafi":
        setSelectedViewData((prev: any) => {
          const newData = [...prev.data];
          newData[1].text = payload.name;
          newData[2].text = payload.lat;
          newData[3].text = payload.lng;
          newData[4].text = payload.description;
          return {
            ...prev,
            data: newData,
          };
        });
        break;
    }
    closeEditModal();
    openViewModal();
    handleRefreshTable();
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
      <AddRafiModal
        isModalOpen={addModalState.rafi}
        closeModal={closeAddModal}
        setMessageBox={setMessageBox}
        handleAddRecord={handleAddRecord}
      ></AddRafiModal>
      <AddLGUModal
        isModalOpen={addModalState.lgu}
        closeModal={closeAddModal}
        setMessageBox={setMessageBox}
        handleAddRecord={handleAddRecord}
      ></AddLGUModal>
      <AddBarangayModal
        isModalOpen={addModalState.barangay}
        closeModal={closeAddModal}
        setMessageBox={setMessageBox}
        handleAddRecord={handleAddRecord}
      ></AddBarangayModal>
      {selectedViewData && (
        <ViewLGUModal
          isModalOpen={viewModalState.lgu}
          closeModal={closeViewModal}
          setMessageBox={setMessageBox}
          selectedData={selectedViewData}
          handleDeleteRecord={handleDeleteRecord}
          openEditModal={openEditModal}
        ></ViewLGUModal>
      )}
      {selectedViewData && (
        <EditLGUModal
          isModalOpen={editModalState.lgu}
          closeModal={closeEditModal}
          setMessageBox={setMessageBox}
          selectedData={selectedViewData}
          handleEditRecord={handleEditRecord}
        ></EditLGUModal>
      )}

      {selectedViewData && (
        <ViewEvecuationModal
          isModalOpen={viewModalState.evacuation}
          closeModal={closeViewModal}
          setMessageBox={setMessageBox}
          selectedData={selectedViewData}
          handleDeleteRecord={handleDeleteRecord}
          openEditModal={openEditModal}
        ></ViewEvecuationModal>
      )}
      {selectedViewData && (
        <EditEvacuationModal
          isModalOpen={editModalState.evacuation}
          closeModal={closeEditModal}
          setMessageBox={setMessageBox}
          selectedData={selectedViewData}
          handleEditRecord={handleEditRecord}
        ></EditEvacuationModal>
      )}

      {selectedViewData && (
        <ViewRafiModalModal
          isModalOpen={viewModalState.rafi}
          closeModal={closeViewModal}
          setMessageBox={setMessageBox}
          selectedData={selectedViewData}
          handleDeleteRecord={handleDeleteRecord}
          openEditModal={openEditModal}
        ></ViewRafiModalModal>
      )}
      {selectedViewData && (
        <EditRafiModal
          isModalOpen={editModalState.rafi}
          closeModal={closeEditModal}
          setMessageBox={setMessageBox}
          selectedData={selectedViewData}
          handleEditRecord={handleEditRecord}
        ></EditRafiModal>
      )}

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
                <button onClick={openAddModal}>+ Add LGU</button>
              </div>
            </div>
            {lguResponse ? (
              <TableView
                tableJSON={lguResponse}
                onClickCallback={(row: any) => {
                  setSelectedViewData(row);
                  openViewModal();
                }}
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
                <button onClick={openAddModal}>+ Add Barangay</button>
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
                <button onClick={openAddModal}>
                  + Add Rafi Infrastructure
                </button>
              </div>
            </div>
            {rafiResponse ? (
              <TableView
                tableJSON={rafiResponse}
                onClickCallback={(row: any) => {
                  setSelectedViewData(row);
                  openViewModal();
                }}
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
                onClickCallback={(row: any) => {
                  setSelectedViewData(row);
                  openViewModal();
                }}
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
