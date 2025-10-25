// LGUofficer.tsx
import { useEffect, useState, useCallback } from "react";
import "../css/LGUofficermanagement.css";
import "../../response_dashboard/DefaultListViewStyle.scss";
import { API } from "../../../API_Handler/Axio_API_Handler";
import defaultpicture from "../../../../public/images/defaultpicture.jpg";

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

// ✅ LGU officer-scoped modals
import { MyLGUViewModal, MyLGUEditModal } from "./Modals/LGUModals";

// ✅ helper that calls GET /lgu_profiling/me/lgu_location
import { getMyLGULocation } from "../../../API_Handler/lguprofiling/LGUofficer";

/* ========================= API HELPERS (unchanged) ========================= */
export async function getRecord(record_type: string): Promise<any> {
  const response = await API.get(`/lgu_profiling/manage_lgu/get_${record_type}`);
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
    if (response.data?.success === false) {
      return { success: false, error: response.data.error || "Unknown error from server" };
    }
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.error ||
      error.response?.data?.detail ||
      error.message ||
      "Unknown error occurred";
    return { success: false, error: message };
  }
}

export async function deleteRecord(record_type: string, reportId: string): Promise<any> {
  try {
    const response = await API.delete(
      `/lgu_profiling/manage_lgu/delete_${record_type}/${reportId}`,
    );
    return response.data;
  } catch (error: any) {
    throw error;
  }
}

export async function updateRecord(
  record_type: string,
  reportId: string,
  payload: any,
): Promise<any | { success: boolean; error: string }> {
  try {
    const response = await API.put(
      `/lgu_profiling/manage_lgu/update_${record_type}/${reportId}`,
      payload,
    );
    if (response.data?.success === false) {
      return { success: false, error: response.data.error || "Unknown error from server" };
    }
    return response.data;
  } catch (error: any) {
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

type Tabs = "all" | "lgu" | "barangay" | "rafi" | "hazard" | "evacuation";
type SectionTab = Exclude<Tabs, "all">;

/* ========================= COMPONENT ========================= */
const MapOfCebu = () => {
  const [activeTab] = useState<Tabs>("lgu");

  // View/Edit selection for non-LGU sections (kept for compatibility)
  const [selectedViewData, setSelectedViewData] = useState<TableRowShape | null>(null);

  // Add/View/Edit modals (non-LGU)
  const [addModalState, setAddModalState] = useState({
    barangay: false,
    rafi: false,
    hazard: false,
    evacuation: false,
  });
  const [viewModalState, setViewModalState] = useState({
    barangay: false,
    rafi: false,
    hazard: false,
    evacuation: false,
  });
  const [editModalState, setEditModalState] = useState({
    barangay: false,
    rafi: false,
    hazard: false,
    evacuation: false,
  });

  // ✅ Officer-scoped LGU modals
  const [myLGUViewOpen, setMyLGUViewOpen] = useState(false);
  const [myLGUEditOpen, setMyLGUEditOpen] = useState(false);

  // ✅ Current user's LGU location (from AdminUserProfile.lgu_location)
  const [myLGULocation, setMyLGULocation] = useState<string | null>(null);
  const [loadingLGU, setLoadingLGU] = useState<boolean>(true);

  // Fetch current user's LGU location once
  useEffect(() => {
    (async () => {
      setLoadingLGU(true);
      const loc = await getMyLGULocation();
      setMyLGULocation(loc);
      setLoadingLGU(false);
    })();
  }, []);

  const fetchDataOne = useCallback(async (_name: SectionTab) => {
    // No table on this page; left for compatibility.
  }, []);

  useEffect(() => {
    // Ensure non-LGU modals are closed initially
    setAddModalState({ barangay: false, rafi: false, hazard: false, evacuation: false });
    setViewModalState({ barangay: false, rafi: false, hazard: false, evacuation: false });
    setEditModalState({ barangay: false, rafi: false, hazard: false, evacuation: false });
    setSelectedViewData(null);
  }, [activeTab]);

  /* ---------- CRUD helpers ---------- */
  const afterMutateRefresh = async (_target: SectionTab) => {
    await fetchDataOne(_target);
  };

  const [messageBox, setMessageBox] = useState<MessageBoxState>({
    isOpen: false,
    type: "message",
    message: "",
    onSubmit: undefined,
    onClose: () => setMessageBox((prev) => ({ ...prev, isOpen: false })),
  });

  const handleDeleteRecord = async (id: string) => {
    try {
      const current: SectionTab =
        (viewModalState.barangay && "barangay") ||
        (viewModalState.rafi && "rafi") ||
        (viewModalState.hazard && "hazard") ||
        (viewModalState.evacuation && "evacuation") ||
        "barangay";

      await deleteRecord(current, id);

      setMessageBox((prev) => ({ ...prev, isOpen: true, type: "message", message: "Record deleted successfully" }));

      // Close all view modals for non-LGU
      setViewModalState({ barangay: false, rafi: false, hazard: false, evacuation: false });
      await afterMutateRefresh(current);
    } catch (err: any) {
      const serverDetail =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        err?.message ||
        "Delete failed. Please try again.";
      setMessageBox((prev) => ({ ...prev, isOpen: true, type: "message", message: serverDetail }));
    }
  };

  const handleAddRecord = async (payload: any, tab: SectionTab) => {
    const response = await addRecord(tab, payload);
    if (!(response as any)?.error) {
      setMessageBox((prev) => ({ ...prev, isOpen: true, type: "message", message: "Record added successfully" }));
      setAddModalState({ barangay: false, rafi: false, hazard: false, evacuation: false });
      await afterMutateRefresh(tab);
    } else {
      setMessageBox((prev) => ({ ...prev, isOpen: true, type: "message", message: (response as any).error }));
    }
  };

  const handleEditRecord = async (id: string, payload: any) => {
    const current: SectionTab =
      (editModalState.barangay && "barangay") ||
      (editModalState.rafi && "rafi") ||
      (editModalState.hazard && "hazard") ||
      (editModalState.evacuation && "evacuation") ||
      "barangay";

    const response = await updateRecord(current, id, payload);

    if ((response as any)?.error) {
      setMessageBox((prev) => ({ ...prev, isOpen: true, type: "message", message: (response as any).error }));
      return;
    }

    setMessageBox((prev) => ({ ...prev, isOpen: true, type: "message", message: "Record has been updated" }));

    setEditModalState({ barangay: false, rafi: false, hazard: false, evacuation: false });
    setViewModalState((prev) => ({ ...prev, [current]: true }));
    await afterMutateRefresh(current);
  };

  return (
    <div className="app-container">
      <MessageBox
        isOpen={messageBox.isOpen}
        onClose={messageBox.onClose}
        type={messageBox.type}
        message={messageBox.message}
        onSubmit={messageBox.onSubmit}
      />

      {/* ---------- ADD MODALS (non-LGU only) ---------- */}
      <AddHazardModal
        isModalOpen={addModalState.hazard}
        closeModal={() => setAddModalState((s) => ({ ...s, hazard: false }))}
        setMessageBox={setMessageBox}
        handleAddRecord={(payload: any) => handleAddRecord(payload, "hazard")}
      />
      <AddEvacuationModal
        isModalOpen={addModalState.evacuation}
        closeModal={() => setAddModalState((s) => ({ ...s, evacuation: false }))}
        setMessageBox={setMessageBox}
        handleAddEvacuation={(payload: any) => handleAddRecord(payload, "evacuation")}
      />
      <AddRafiModal
        isModalOpen={addModalState.rafi}
        closeModal={() => setAddModalState((s) => ({ ...s, rafi: false }))}
        setMessageBox={setMessageBox}
        handleAddRecord={(payload: any) => handleAddRecord(payload, "rafi")}
      />
      <AddBarangayModal
        isModalOpen={addModalState.barangay}
        closeModal={() => setAddModalState((s) => ({ ...s, barangay: false }))}
        setMessageBox={setMessageBox}
        handleAddRecord={(payload: any) => handleAddRecord(payload, "barangay")}
      />

      {/* ---------- VIEW / EDIT MODALS (non-LGU kept) ---------- */}
      {viewModalState.barangay && selectedViewData && (
        <ViewBarangayModal
          isModalOpen={viewModalState.barangay}
          closeModal={() => setViewModalState((s) => ({ ...s, barangay: false }))}
          setMessageBox={setMessageBox}
          selectedData={selectedViewData}
          handleDeleteRecord={handleDeleteRecord}
          openEditModal={() => {
            setViewModalState((s) => ({ ...s, barangay: false }));
            setEditModalState((s) => ({ ...s, barangay: true }));
          }}
        />
      )}
      {editModalState.barangay && selectedViewData && (
        <EditBarangayModal
          isModalOpen={editModalState.barangay}
          closeModal={() => setEditModalState((s) => ({ ...s, barangay: false }))}
          setMessageBox={setMessageBox}
          selectedData={selectedViewData}
          handleEditRecord={handleEditRecord}
        />
      )}

      {viewModalState.evacuation && selectedViewData && (
        <ViewEvecuationModal
          isModalOpen={viewModalState.evacuation}
          closeModal={() => setViewModalState((s) => ({ ...s, evacuation: false }))}
          setMessageBox={setMessageBox}
          selectedData={selectedViewData}
          handleDeleteRecord={handleDeleteRecord}
          openEditModal={() => {
            setViewModalState((s) => ({ ...s, evacuation: false }));
            setEditModalState((s) => ({ ...s, evacuation: true }));
          }}
        />
      )}
      {editModalState.evacuation && selectedViewData && (
        <EditEvacuationModal
          isModalOpen={editModalState.evacuation}
          closeModal={() => setEditModalState((s) => ({ ...s, evacuation: false }))}
          setMessageBox={setMessageBox}
          selectedData={selectedViewData}
          handleEditRecord={handleEditRecord}
        />
      )}

      {viewModalState.rafi && selectedViewData && (
        <ViewRafiModalModal
          isModalOpen={viewModalState.rafi}
          closeModal={() => setViewModalState((s) => ({ ...s, rafi: false }))}
          setMessageBox={setMessageBox}
          selectedData={selectedViewData}
          handleDeleteRecord={handleDeleteRecord}
          openEditModal={() => {
            setViewModalState((s) => ({ ...s, rafi: false }));
            setEditModalState((s) => ({ ...s, rafi: true }));
          }}
        />
      )}
      {editModalState.rafi && selectedViewData && (
        <EditRafiModal
          isModalOpen={editModalState.rafi}
          closeModal={() => setEditModalState((s) => ({ ...s, rafi: false }))}
          setMessageBox={setMessageBox}
          selectedData={selectedViewData}
          handleEditRecord={handleEditRecord}
        />
      )}

      {viewModalState.hazard && selectedViewData && (
        <ViewHazardModal
          isModalOpen={viewModalState.hazard}
          closeModal={() => setViewModalState((s) => ({ ...s, hazard: false }))}
          setMessageBox={setMessageBox}
          selectedData={selectedViewData}
          handleDeleteRecord={handleDeleteRecord}
          openEditModal={() => {
            setViewModalState((s) => ({ ...s, hazard: false }));
            setEditModalState((s) => ({ ...s, hazard: true }));
          }}
        />
      )}
      {editModalState.hazard && selectedViewData && (
        <EditHazardModal
          isModalOpen={editModalState.hazard}
          closeModal={() => setEditModalState((s) => ({ ...s, hazard: false }))}
          setMessageBox={setMessageBox}
          selectedData={selectedViewData}
          handleEditRecord={handleEditRecord}
        />
      )}

      {/* ---------- LGU Section (officer-scoped) ---------- */}
      <MyLGUViewModal
        isModalOpen={myLGUViewOpen}
        closeModal={() => setMyLGUViewOpen(false)}
        setMessageBox={setMessageBox}
        onOpenEdit={() => {
          setMyLGUViewOpen(false);
          setMyLGUEditOpen(true);
        }}
        // You can optionally add lguLocation as a prop if your modal supports it:
        // lguLocation={myLGULocation}
      />
      <MyLGUEditModal
        isModalOpen={myLGUEditOpen}
        closeModal={() => setMyLGUEditOpen(false)}
        setMessageBox={setMessageBox}
        onSaved={() => {
          setMyLGUEditOpen(false);
          setMyLGUViewOpen(true);
        }}
        // lguLocation={myLGULocation}
        // setLGULocation={setMyLGULocation}
      />

      {/* ---------- Header with LGU location ---------- */}
      <div className="lgu-header-container">
        <div className="lgu-text-container">
          <span className="lgu-text">
            LGU:&nbsp;{loadingLGU ? "Loading..." : (myLGULocation ?? "—")}
          </span>
        </div>
        <div className="lgu-image-container">
          <img src={defaultpicture} alt="Default LGU Logo" className="lgu-image" />
        </div>
        <button
          className="view-lgu-button"
          onClick={() => setMyLGUViewOpen(true)}
          
        >
          View
        </button>
      </div>
    </div>
  );
};

export default MapOfCebu;
