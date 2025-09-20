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
import {
  AddBarangayModal,
  ViewBarangayModal,
  EditBarangayModal,
} from "./Modals/BarangayModal";
import {
  AddHazardModal,
  ViewHazardModal,
  EditHazardModal,
} from "./Modals/hazardModal";

import { AddLGUModal, ViewLGUModal, EditLGUModal } from "./Modals/LGUModals";

/* ========================= API HELPERS ========================= */
export async function getRecord(record_type: string): Promise<any> {
  const response = await API.get(
    `/lgu_profiling/manage_lgu/get_${record_type}`
  );
  return response.data;
}

export async function addRecord(
  record_type: string,
  payload: any
): Promise<any | { success: boolean; error: string }> {
  try {
    const response = await API.post(
      `/lgu_profiling/manage_lgu/add_${record_type}`,
      payload
    );

    if (response.data?.success === false) {
      return {
        success: false,
        error: response.data.error || "Unknown error from server",
      };
    }
    return response.data;
  } catch (error: any) {
    console.error("Failed to add record:", error);
    const message =
      error.response?.data?.error ||
      error.response?.data?.detail ||
      error.message ||
      "Unknown error occurred";
    return { success: false, error: message };
  }
}

export async function deleteRecord(
  record_type: string,
  reportId: string
): Promise<any> {
  try {
    const response = await API.delete(
      `/lgu_profiling/manage_lgu/delete_${record_type}/${reportId}`
    );
    return response;
  } catch (error: any) {
    if (error.response) {
      console.error("Error: ", error.response.data.detail);
    } else {
      console.error("Request error: ", error.message);
    }
    throw error;
  }
}

export async function updateRecord(
  record_type: string,
  reportId: string,
  payload: any
): Promise<any | { success: boolean; error: string }> {
  try {
    const response = await API.put(
      `/lgu_profiling/manage_lgu/update_${record_type}/${reportId}`,
      payload
    );

    if (response.data?.success === false) {
      return {
        success: false,
        error: response.data.error || "Unknown error from server",
      };
    }
    return response.data;
  } catch (error: any) {
    console.error("Failed to update record:", error);
    const message =
      error.response?.data?.error ||
      error.response?.data?.detail ||
      error.message ||
      "Unknown error occurred";
    return { success: false, error: message };
  }
}

/* ========================= TYPES ========================= */
type MessageBoxState = {
  isOpen: boolean;
  type: "message" | "confirm";
  message: string;
  onSubmit?: () => void;
  onClose: () => void;
};

type TableRowShape = {
  id?: string | number;
  data?: Array<{ text?: any; [k: string]: any }>;
  [k: string]: any;
};

/* ========================= COMPONENT ========================= */
const MapOfCebu = () => {
  const [activeTab, setActiveTab] = useState<
    "lgu" | "barangay" | "rafi" | "hazard" | "evacuation"
  >("lgu");

  const [lguResponse, setLguResponse] = useState<TableReponse | null>(null);
  const [barangayResponse, setBarangayResponse] = useState<TableReponse | null>(
    null
  );
  const [rafiResponse, setRafiResponse] = useState<TableReponse | null>(null);
  const [hazardResponse, setHazardResponse] = useState<TableReponse | null>(
    null
  );
  const [evacuationResponse, setEvacuationResponse] =
    useState<TableReponse | null>(null);

  const refreshTable = useRef<() => void>(() => {});
  const handleRefreshTable = () => refreshTable.current?.();

  const [selectedViewData, setSelectedViewData] =
    useState<TableRowShape | null>(null);

  const [addModalState, setAddModalState] = useState({
    lgu: false,
    barangay: false,
    rafi: false,
    hazard: false,
    evacuation: false,
  });
  const [viewModalState, setViewModalState] = useState({
    lgu: false,
    barangay: false,
    rafi: false,
    hazard: false,
    evacuation: false,
  });
  const [editModalState, setEditModalState] = useState({
    lgu: false,
    barangay: false,
    rafi: false,
    hazard: false,
    evacuation: false,
  });

  const fetchData = async (name: string) => {
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
  };

  /* ---------- modal helpers ---------- */
  const openAddModal = () => {
    setAddModalState((prev) => ({ ...prev, [activeTab]: true }));
  };
  const closeAddModal = () => {
    setAddModalState((prev) => ({ ...prev, [activeTab]: false }));
  };

  // One-click open: accept the row, set data, then open for current tab
  const openViewModal = (row?: TableRowShape) => {
    if (row) setSelectedViewData(row);
    setViewModalState((prev) => ({ ...prev, [activeTab]: true }));
  };

  // Hide only (keep selection when switching to edit)
  const hideViewModal = () => {
    setViewModalState((prev) => ({ ...prev, [activeTab]: false }));
  };

  // Close and clear selection
  const closeViewModal = () => {
    hideViewModal();
    setSelectedViewData(null);
  };

  const openEditModal = () => {
    // don’t clear selectedViewData; we need it in the edit modal
    hideViewModal();
    setEditModalState((prev) => ({ ...prev, [activeTab]: true }));
  };

  const closeEditModal = () => {
    setEditModalState((prev) => ({ ...prev, [activeTab]: false }));
    // After editing, reopen the view modal to show updated data
    setViewModalState((prev) => ({ ...prev, [activeTab]: true }));
  };

  /* ---------- CRUD handlers ---------- */
const handleDeleteRecord = async (id: string) => {
  try {
    await deleteRecord(activeTab, id);
    setMessageBox((prev) => ({
      ...prev,
      isOpen: true,
      type: "message",
      message: "Record deleted successfully",
    }));
    closeViewModal();
    handleRefreshTable();
  } catch (err: any) {
    const serverDetail =
      err?.response?.data?.detail ||
      err?.response?.data?.error ||
      err?.message ||
      "Delete failed. Please try again.";
    setMessageBox((prev) => ({
      ...prev,
      isOpen: true,
      type: "message",
      message: serverDetail, // 👈 will show: “Cannot delete: this evacuation center is linked…”
    }));
  }
};


  const handleAddRecord = async (payload: any) => {
    const response = await addRecord(activeTab, payload);
    if (!(response as any)?.error) {
      setMessageBox((prev) => ({
        ...prev,
        isOpen: true,
        type: "message",
        message: "Record added successfully",
      }));
      closeAddModal();
      handleRefreshTable();
    } else {
      setMessageBox((prev) => ({
        ...prev,
        isOpen: true,
        type: "message",
        message: (response as any).error,
      }));
    }
  };

  const safeUpdateByIndex = (
    prev: TableRowShape | null,
    mapping: Record<number, any>
  ): TableRowShape | null => {
    if (!prev?.data || !Array.isArray(prev.data)) return prev;
    const newData = prev.data.map((cell, idx) => {
      if (Object.prototype.hasOwnProperty.call(mapping, idx)) {
        return { ...cell, text: mapping[idx] };
      }
      return cell;
    });
    return { ...prev, data: newData };
  };

  const handleEditRecord = async (id: string, payload: any) => {
    const response = await updateRecord(activeTab, id, payload);
    if ((response as any)?.error) {
      setMessageBox((prev) => ({
        ...prev,
        isOpen: true,
        type: "message",
        message: (response as any).error,
      }));
      return;
    }

    setMessageBox((prev) => ({
      ...prev,
      isOpen: true,
      type: "message",
      message: "Record has been updated",
    }));

    try {
      switch (activeTab) {
        case "barangay":
          setSelectedViewData((prev) =>
            safeUpdateByIndex(prev, {
              1: payload.name,
              2: payload.lat,
              3: payload.lng,
              4: payload.LGU ?? payload.lgu,
              5: payload.evacuation,
              6: payload.population,
              7: payload.contact_info,
              8: payload.risk_level,
            })
          );
          break;
        case "lgu":
          setSelectedViewData((prev) =>
            safeUpdateByIndex(prev, {
              1: payload.name,
              2: payload.lat,
              3: payload.lng,
              4: payload.classification,
              5: payload.population,
              6: payload.contact_info,
              7: payload.risk_level,
              8: payload.description,
              9: Array.isArray(payload.resources)
                ? payload.resources.join(", ")
                : payload.resources,
              10: Array.isArray(payload.players)
                ? payload.players.join(", ")
                : payload.players,
              11: Array.isArray(payload.schools)
                ? payload.schools.join(", ")
                : payload.schools,
              12: Array.isArray(payload.gyms)
                ? payload.gyms.join(", ")
                : payload.gyms,
              13: Array.isArray(payload.local_suppliers)
                ? payload.local_suppliers.join(", ")
                : payload.local_suppliers,
            })
          );
          break;

        case "evacuation":
          setSelectedViewData((prev) =>
            safeUpdateByIndex(prev, {
              1: payload.name,
              2: payload.lat,
              3: payload.lng,
              4: payload.capacity,
            })
          );
          break;
        case "hazard":
          setSelectedViewData((prev) =>
            safeUpdateByIndex(prev, {
              2: payload.hazard_area,
              3: payload.image_url,
              4: payload.hazard_type,
              // 1: optionally update last_updated if your API returns it; otherwise leave it
            })
          );
          break;
case "rafi": {
  // ----- read values whether payload is FormData or plain object -----
  let rafi_name: string | null | undefined;
  let latStr: string | null | undefined;
  let lngStr: string | null | undefined;
  let rafi_desc: string | null | undefined;
  let userPickedNewFile = false;

  if (payload instanceof FormData) {
    rafi_name = payload.get("rafi_name") as string;
    latStr    = payload.get("lat") as string;
    lngStr    = payload.get("lng") as string;
    rafi_desc = payload.get("rafi_desc") as string;
    userPickedNewFile = payload.has("rafi_pic");
  } else {
    rafi_name = payload.rafi_name ?? payload.name;
    latStr    = payload.lat != null ? String(payload.lat) : undefined;
    lngStr    = payload.lng != null ? String(payload.lng) : undefined;
    rafi_desc = payload.rafi_desc ?? payload.description;
  }

  const lat = latStr != null ? Number(latStr) : undefined;
  const lng = lngStr != null ? Number(lngStr) : undefined;

  // ✅ get correct pic URL from backend response
  const newPicFromResp = (response as any)?.record?.rafi_pic as string | undefined;
  const prevPic = (selectedViewData?.data?.[5]?.text as string) || undefined;

  // add cache-buster
  const cacheBust = (url?: string) =>
    url ? `${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}` : url;

  const picToUse =
    newPicFromResp ? cacheBust(newPicFromResp)
    : userPickedNewFile ? cacheBust(prevPic)
    : prevPic;

  // ✅ immediately tell View modal to reload
  document.dispatchEvent(
    new CustomEvent("rafi:updated", {
      detail: { id, rafi_pic: newPicFromResp },
    })
  );

  setSelectedViewData(prev =>
    safeUpdateByIndex(prev, {
      1: rafi_name ?? (prev?.data?.[1]?.text as string),
      2: lat != null ? String(lat) : (prev?.data?.[2]?.text as string),
      3: lng != null ? String(lng) : (prev?.data?.[3]?.text as string),
      4: rafi_desc ?? (prev?.data?.[4]?.text as string),
      5: picToUse as string, // 👈 update image immediately
    })
  );
  break;
}

 default:
          break;
      }
    } catch {
      await fetchData(activeTab);
    }

    closeEditModal();
    // show updated view
    openViewModal();
    handleRefreshTable();
  };

  /* ---------- message box ---------- */
  const closeMessageBox = () => {
    setMessageBox((prev) => ({ ...prev, isOpen: false }));
  };
  const [messageBox, setMessageBox] = useState<MessageBoxState>({
    isOpen: false,
    type: "message",
    message: "",
    onSubmit: undefined,
    onClose: closeMessageBox,
  });

  /* ---------- reset & fetch on tab change ---------- */
  useEffect(() => {
    setAddModalState({
      lgu: false,
      barangay: false,
      rafi: false,
      hazard: false,
      evacuation: false,
    });
    setViewModalState({
      lgu: false,
      barangay: false,
      rafi: false,
      hazard: false,
      evacuation: false,
    });
    setEditModalState({
      lgu: false,
      barangay: false,
      rafi: false,
      hazard: false,
      evacuation: false,
    });
    setSelectedViewData(null);
    fetchData(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  return (
    <div className="app-container">
      <MessageBox
        isOpen={messageBox.isOpen}
        onClose={messageBox.onClose}
        type={messageBox.type}
        message={messageBox.message}
        onSubmit={messageBox.onSubmit}
      />

      {/* ---------- ADD MODALS ---------- */}
      <AddHazardModal
        isModalOpen={addModalState.hazard}
        closeModal={closeAddModal}
        setMessageBox={setMessageBox}
        handleAddRecord={handleAddRecord}
      />
      <AddEvacuationModal
        isModalOpen={addModalState.evacuation}
        closeModal={closeAddModal}
        setMessageBox={setMessageBox}
        handleAddEvacuation={handleAddRecord}
      />
      <AddRafiModal
        isModalOpen={addModalState.rafi}
        closeModal={closeAddModal}
        setMessageBox={setMessageBox}
        handleAddRecord={handleAddRecord}
      />
      <AddLGUModal
        isModalOpen={addModalState.lgu}
        closeModal={closeAddModal}
        setMessageBox={setMessageBox}
        handleAddRecord={handleAddRecord}
      />
      <AddBarangayModal
        isModalOpen={addModalState.barangay}
        closeModal={closeAddModal}
        setMessageBox={setMessageBox}
        handleAddRecord={handleAddRecord}
      />

      {/* ========== GATED VIEW / EDIT MODALS (MOUNT ONLY FOR ACTIVE TAB) ========== */}
      {/* LGU */}
      {viewModalState.lgu && activeTab === "lgu" && selectedViewData && (
        <ViewLGUModal
          isModalOpen={viewModalState.lgu}
          closeModal={closeViewModal}
          setMessageBox={setMessageBox}
          selectedData={selectedViewData}
          handleDeleteRecord={handleDeleteRecord}
          openEditModal={openEditModal}
        />
      )}
      {editModalState.lgu && activeTab === "lgu" && selectedViewData && (
        <EditLGUModal
          isModalOpen={editModalState.lgu}
          closeModal={closeEditModal}
          setMessageBox={setMessageBox}
          selectedData={selectedViewData}
          handleEditRecord={handleEditRecord}
        />
      )}

      {/* BARANGAY */}
      {viewModalState.barangay &&
        activeTab === "barangay" &&
        selectedViewData && (
          <ViewBarangayModal
            isModalOpen={viewModalState.barangay}
            closeModal={closeViewModal}
            setMessageBox={setMessageBox}
            selectedData={selectedViewData}
            handleDeleteRecord={handleDeleteRecord}
            openEditModal={openEditModal}
          />
        )}
      {editModalState.barangay &&
        activeTab === "barangay" &&
        selectedViewData && (
          <EditBarangayModal
            isModalOpen={editModalState.barangay}
            closeModal={closeEditModal}
            setMessageBox={setMessageBox}
            selectedData={selectedViewData}
            handleEditRecord={handleEditRecord}
          />
        )}

      {/* EVACUATION */}
      {viewModalState.evacuation &&
        activeTab === "evacuation" &&
        selectedViewData && (
          <ViewEvecuationModal
            isModalOpen={viewModalState.evacuation}
            closeModal={closeViewModal}
            setMessageBox={setMessageBox}
            selectedData={selectedViewData}
            handleDeleteRecord={handleDeleteRecord}
            openEditModal={openEditModal}
          />
        )}
      {editModalState.evacuation &&
        activeTab === "evacuation" &&
        selectedViewData && (
          <EditEvacuationModal
            isModalOpen={editModalState.evacuation}
            closeModal={closeEditModal}
            setMessageBox={setMessageBox}
            selectedData={selectedViewData}
            handleEditRecord={handleEditRecord}
          />
        )}

      {/* RAFI */}
      {viewModalState.rafi && activeTab === "rafi" && selectedViewData && (
        <ViewRafiModalModal
          isModalOpen={viewModalState.rafi}
          closeModal={closeViewModal}
          setMessageBox={setMessageBox}
          selectedData={selectedViewData}
          handleDeleteRecord={handleDeleteRecord}
          openEditModal={openEditModal}
        />
      )}
      {editModalState.rafi && activeTab === "rafi" && selectedViewData && (
        <EditRafiModal
          isModalOpen={editModalState.rafi}
          closeModal={closeEditModal}
          setMessageBox={setMessageBox}
          selectedData={selectedViewData}
          handleEditRecord={handleEditRecord}
        />
      )}
      {/* HAZARD */}
      {viewModalState.hazard && activeTab === "hazard" && selectedViewData && (
        <ViewHazardModal
          isModalOpen={viewModalState.hazard}
          closeModal={closeViewModal}
          setMessageBox={setMessageBox}
          selectedData={selectedViewData}
          handleDeleteRecord={handleDeleteRecord}
          openEditModal={openEditModal}
        />
      )}
      {editModalState.hazard && activeTab === "hazard" && selectedViewData && (
        <EditHazardModal
          isModalOpen={editModalState.hazard}
          closeModal={closeEditModal}
          setMessageBox={setMessageBox}
          selectedData={selectedViewData}
          handleEditRecord={handleEditRecord}
        />
      )}

      {/* ---------- TABS ---------- */}
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
          Barangay
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

      {/* ---------- CONTENT ---------- */}
      <div>
        {activeTab === "lgu" && (
          <>
            <div className="horizontal-container">
              <div className="table-actions">
                <input type="text" placeholder="Search report" />
                <button>Search</button>
                <button onClick={openAddModal}>+ Add LGU</button>
              </div>
            </div>
            {lguResponse ? (
              <TableView
                tableJSON={lguResponse}
                onClickCallback={(row: TableRowShape) => openViewModal(row)}
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
                <input type="text" placeholder="Search report" />
                <button>Search</button>
                <button onClick={openAddModal}>+ Add Barangay</button>
              </div>
            </div>
            {barangayResponse ? (
              <TableView
                tableJSON={barangayResponse}
                onClickCallback={(row: TableRowShape) => openViewModal(row)}
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
                <input type="text" placeholder="Search report" />
                <button>Search</button>
                <button onClick={openAddModal}>
                  + Add Rafi Infrastructure
                </button>
              </div>
            </div>
            {rafiResponse ? (
              <TableView
                tableJSON={rafiResponse}
                onClickCallback={(row: TableRowShape) => openViewModal(row)}
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
                <input type="text" placeholder="Search report" />
                <button>Search</button>
                <button onClick={openAddModal}>+ Add Hazard</button>
              </div>
            </div>
            {hazardResponse ? (
              <TableView
                tableJSON={hazardResponse}
                onClickCallback={(row: TableRowShape) => openViewModal(row)}
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
                <input type="text" placeholder="Search report" />
                <button>Search</button>
                <button onClick={openAddModal}>+ Add Evacuation Center</button>
              </div>
            </div>
            {evacuationResponse ? (
              <TableView
                tableJSON={evacuationResponse}
                onClickCallback={(row: TableRowShape) => openViewModal(row)}
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
