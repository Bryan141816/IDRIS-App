// LGUofficer.tsx
import { useEffect, useState, useCallback, useMemo } from "react";
import "../css/LGUofficermanagement.css";
import "../../response_dashboard/DefaultListViewStyle.scss";
import { API } from "../../../API_Handler/Axio_API_Handler";
import defaultpicture from "../../../../public/images/defaultpicture.jpg";
import {
  getMyLGULocation,
  getLGURecordByName,
} from "../../../API_Handler/lguprofiling/LGUofficer";

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
// LGUofficer.tsx (top)
import type { MyLGU } from "./Modals/LGUModals";


/* ========================= API HELPERS ========================= */
export async function getRecord(record_type: string): Promise<any> {
  const response = await API.get(`/lgu_profiling/manage_lgu/get_${record_type}`);
  return response.data;
}

// Helper: map MyLGU (modal) -> LGURecord (header uses this)
function mapMyLGUToLGURecord(fresh: MyLGU, prev?: LGURecord | null): LGURecord {
  return {
    id: Number(
      fresh.id ??
      prev?.id ??
      0
    ),
    name: fresh.name ?? prev?.name ?? "",
    lat: Number(fresh.lat ?? prev?.lat ?? 0),
    lng: Number(fresh.lng ?? prev?.lng ?? 0),
    classification: fresh.classification ?? prev?.classification ?? "",
    population: Number(fresh.population ?? prev?.population ?? 0),
    contact_info: fresh.contact_info ?? prev?.contact_info ?? "",
    lgu_picture: fresh.lgu_picture ?? prev?.lgu_picture ?? null,
    description: fresh.description ?? prev?.description ?? null,
    resources: fresh.resources ?? prev?.resources ?? null,
    players: fresh.players ?? prev?.players ?? null,
    schools: fresh.schools ?? prev?.schools ?? null,
    gyms: fresh.gyms ?? prev?.gyms ?? null,
    local_suppliers: fresh.local_suppliers ?? prev?.local_suppliers ?? null,
  };
}

export async function addRecord(
  record_type: string,
  payload: any
): Promise<any | { success: false; error: string }> {
  try {
    const response = await API.post(
      `/lgu_profiling/manage_lgu/add_${record_type}`,
      payload
    );
    if (response.data?.success === false) {
      return { success: false, error: response.data.error || "Unknown server error" };
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
  const { data } = await API.delete(
    `/lgu_profiling/manage_lgu/delete_${record_type}/${reportId}`
  );
  return data;
}

export async function updateRecord(
  record_type: string,
  reportId: string,
  payload: any
): Promise<any | { success: false; error: string }> {
  try {
    const { data } = await API.put(
      `/lgu_profiling/manage_lgu/update_${record_type}/${reportId}`,
      payload
    );
    if (data?.success === false) {
      return { success: false, error: data.error || "Unknown server error" };
    }
    return data;
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

export type LGURecord = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  classification: string;
  population: number;
  contact_info: string;
  lgu_picture?: string | null;
  description?: string | null;
  resources?: string[] | null;
  players?: string[] | null;
  schools?: string[] | null;
  gyms?: string[] | null;
  local_suppliers?: string[] | null;
  // risk_level?: number | null;
};

/* ========================= UTILS ========================= */
// Prefix relative media paths with baseURL
const withBase = (maybeUrl?: string | null) => {
  if (!maybeUrl) return null;
  if (/^https?:\/\//i.test(maybeUrl)) return maybeUrl; // already full URL
  const base = (API.defaults as any)?.baseURL || "";
  return `${String(base).replace(/\/$/, "")}/${String(maybeUrl).replace(/^\//, "")}`;
};

// Fetch the LGU record bound to the logged-in officer
async function getMyLGURecord(): Promise<LGURecord | null> {
  try {
    const res = await API.get("/lgu_profiling/manage_lgu/my_lgu");
    return res?.data ?? null;
  } catch (err: any) {
    if (err?.response?.status === 404) return null;
    throw err;
  }
}

/* ========================= COMPONENT ========================= */
const MapOfCebu = () => {
  const [activeTab] = useState<Tabs>("lgu");

  // Non-LGU view state
  const [selectedViewData, setSelectedViewData] = useState<TableRowShape | null>(null);
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

  // ✅ Current user's LGU location (label for header)
  const [myLGULocation, setMyLGULocation] = useState<string | null>(null);
  const [loadingLGU, setLoadingLGU] = useState<boolean>(true);

  // ✅ The full LGU record (for lgu_picture, etc.)
  const [myLGURecord, setMyLGURecord] = useState<LGURecord | null>(null);
  const [loadingLGURecord, setLoadingLGURecord] = useState<boolean>(false);

  // Fetch the location label for header
  useEffect(() => {
    (async () => {
      try {
        setLoadingLGU(true);
        const loc = await getMyLGULocation();
        setMyLGULocation(loc || null);
      } finally {
        setLoadingLGU(false);
      }
    })();
  }, []);

  // Fetch the bound LGU record; fallback to find-by-name if needed
  useEffect(() => {
    (async () => {
      if (loadingLGU) return; // wait until label fetch completes

      setLoadingLGURecord(true);
      try {
        // 1) Primary: the LGU record tied to this officer
        const mine = await getMyLGURecord();
        if (mine) {
          setMyLGURecord(mine);
          return;
        }

        // 2) Fallback: try to look up by the human-readable location label
        if (myLGULocation) {
          const rec = await getLGURecordByName(myLGULocation);
          setMyLGURecord(rec ?? null);
        } else {
          setMyLGURecord(null);
        }
      } catch {
        setMyLGURecord(null);
      } finally {
        setLoadingLGURecord(false);
      }
    })();
  }, [myLGULocation, loadingLGU]);

  const fetchDataOne = useCallback(async (_name: SectionTab) => {
    // reserved for other sections
  }, []);

  useEffect(() => {
    // reset non-LGU modals on tab change
    setAddModalState({ barangay: false, rafi: false, hazard: false, evacuation: false });
    setViewModalState({ barangay: false, rafi: false, hazard: false, evacuation: false });
    setEditModalState({ barangay: false, rafi: false, hazard: false, evacuation: false });
    setSelectedViewData(null);
  }, [activeTab]);

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

      setMessageBox((prev) => ({
        ...prev,
        isOpen: true,
        type: "message",
        message: "Record deleted successfully",
      }));

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
      setMessageBox((prev) => ({
        ...prev,
        isOpen: true,
        type: "message",
        message: "Record added successfully",
      }));
      setAddModalState({ barangay: false, rafi: false, hazard: false, evacuation: false });
      await afterMutateRefresh(tab);
    } else {
      setMessageBox((prev) => ({
        ...prev,
        isOpen: true,
        type: "message",
        message: (response as any).error,
      }));
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

  /* ---------- Choose image with robust fallback ---------- */
  const lguImageSrc = useMemo(() => {
    const url = withBase(myLGURecord?.lgu_picture);
    return url || defaultpicture;
  }, [myLGURecord?.lgu_picture]);

  return (
    <div className="app-container">
      <MessageBox
        isOpen={messageBox.isOpen}
        onClose={messageBox.onClose}
        type={messageBox.type}
        message={messageBox.message}
        onSubmit={messageBox.onSubmit}
      />

      {/* ---------- ADD MODALS (non-LGU) ---------- */}
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

      {/* ---------- VIEW / EDIT MODALS (non-LGU) ---------- */}
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
      />
   <MyLGUEditModal
  isModalOpen={myLGUEditOpen}
  closeModal={() => setMyLGUEditOpen(false)}
  setMessageBox={setMessageBox}
  onSaved={(fresh?: MyLGU | null) => {
    if (fresh) {
      setMyLGURecord(prev => mapMyLGUToLGURecord(fresh, prev));
    }
    setMyLGUEditOpen(false);
    setMyLGUViewOpen(true);
  }}
/>


      {/* ---------- Header with LGU location & picture ---------- */}
      <div className="lgu-header-container">
        <div className="lgu-text-container">
          <span className="lgu-text">
            LGU:&nbsp;{loadingLGU ? "Loading..." : (myLGULocation ?? "—")}
          </span>
          {!loadingLGURecord && myLGURecord?.classification && (
            <span className="lgu-subtext">&nbsp;•&nbsp;{myLGURecord.classification}</span>
          )}
        </div>

        <div className="lgu-image-container">
          <img
            src={lguImageSrc}
            alt={myLGURecord?.name || "LGU"}
            className="lgu-image"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              if (!img.src.endsWith("defaultpicture.jpg")) {
                img.onerror = null; // avoid loop
                img.src = defaultpicture;
              }
            }}
          />
        </div>

        <button className="view-lgu-button" onClick={() => setMyLGUViewOpen(true)}>
          View
        </button>
      </div>
    </div>
  );
};

export default MapOfCebu;
