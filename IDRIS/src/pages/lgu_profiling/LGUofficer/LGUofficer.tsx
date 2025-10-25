import { useEffect, useState, useRef, useCallback } from "react";
import "../css/LGUofficermanagement.css";
import "../../response_dashboard/DefaultListViewStyle.scss";
import { TableView } from "../../../components/TableView/table_view";
import { API } from "../../../API_Handler/Axio_API_Handler";
import { TableReponse } from "../../../components/TableView/table_view";
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
import { AddLGUModal, ViewLGUModal, EditLGUModal } from "./Modals/LGUModals";

/* ========================= API HELPERS ========================= */
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
  reportId: string,
): Promise<any> {
  try {
    const response = await API.delete(
      `/lgu_profiling/manage_lgu/delete_${record_type}/${reportId}`,
    );
    return response.data;
  } catch (error: any) {
    if (error.response) {
      console.error(
        "Error:",
        error.response.data.detail || error.response.data,
      );
    } else {
      console.error("Request error:", error.message);
    }
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

type Tabs = "all" | "lgu" | "barangay" | "rafi" | "hazard" | "evacuation";

type SectionTab = Exclude<Tabs, "all">;

/* ========================= COMPONENT ========================= */
const MapOfCebu = () => {
  // Which dataset(s) to show — default to "all" so everything shows first
  const [activeTab, setActiveTab] = useState<Tabs>("all");

  // When opening a row from "All", remember which section it came from
  const [viewContextTab, setViewContextTab] = useState<SectionTab | null>(null);

  // table data
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

  // Separate refreshers per table (critical fix)
  const tableRefreshers = useRef<
    Partial<Record<SectionTab, (page?: number) => void>>
  >({});

  const setTableRef = (tab: SectionTab, fn: (page?: number) => void) => {
    tableRefreshers.current[tab] = fn;
  };

  const refreshTableFor = (tab: SectionTab, page = 1) => {
    tableRefreshers.current[tab]?.(page);
  };

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

  // Filter dropdown state + outside click
  const [showFilter, setShowFilter] = useState(false);
  const filterRef = useRef<HTMLDivElement | null>(null);

  // Add Pin dropdown state + outside click
  const [showAddPin, setShowAddPin] = useState(false);
  const addPinRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilter(false);
      }
      if (addPinRef.current && !addPinRef.current.contains(e.target as Node)) {
        setShowAddPin(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const fetchDataOne = useCallback(async (name: SectionTab) => {
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
  }, []);

  const fetchAll = useCallback(async () => {
    await Promise.allSettled([
      fetchDataOne("lgu"),
      fetchDataOne("barangay"),
      fetchDataOne("rafi"),
      fetchDataOne("hazard"),
      fetchDataOne("evacuation"),
    ]);
  }, [fetchDataOne]);

  /* ---------- modal helpers ---------- */
  const openAddModal = (tabOverride?: SectionTab) => {
    const tab =
      tabOverride ||
      (activeTab === "all" ? undefined : (activeTab as SectionTab));
    if (!tab) return; // require explicit section in "All"
    setAddModalState((prev) => ({ ...prev, [tab]: true }));
  };
  const closeAddModal = () => {
    setAddModalState({
      lgu: false,
      barangay: false,
      rafi: false,
      hazard: false,
      evacuation: false,
    });
  };

  const openViewModal = async (
    row?: TableRowShape,
    tabOverride?: SectionTab,
  ) => {
    const tabToUse: SectionTab =
      tabOverride ||
      (activeTab === "all"
        ? viewContextTab || "lgu"
        : (activeTab as SectionTab));

    if (row) {
      const id = row.data?.[0]?.text; // hidden ID from table row
      if (tabToUse === "barangay" && id) {
        try {
          const { data } = await API.get(
            `/lgu_profiling/manage_lgu/barangay/${id}`,
          );
          (row as any).fullRecord = data;
        } catch (e) {
          console.error("❌ Failed to fetch barangay detail", e);
        }
      }
      setSelectedViewData(row);
      setViewContextTab(tabToUse);
    }

    setViewModalState((prev) => ({ ...prev, [tabToUse]: true }));
  };

  const hideViewModal = () => {
    setViewModalState({
      lgu: false,
      barangay: false,
      rafi: false,
      hazard: false,
      evacuation: false,
    });
  };

  const closeViewModal = () => {
    hideViewModal();
    setSelectedViewData(null);
    setViewContextTab(null);
  };

  const openEditModal = () => {
    hideViewModal();
    const tabForEdit =
      activeTab === "all"
        ? (viewContextTab as SectionTab)
        : (activeTab as SectionTab);
    setEditModalState((prev) => ({ ...prev, [tabForEdit]: true }));
  };

  const closeEditModal = () => {
    const tabForView =
      activeTab === "all"
        ? (viewContextTab as SectionTab)
        : (activeTab as SectionTab);
    setEditModalState({
      lgu: false,
      barangay: false,
      rafi: false,
      hazard: false,
      evacuation: false,
    });
    setViewModalState((prev) => ({ ...prev, [tabForView]: true }));
  };

  /* ---------- CRUD helpers ---------- */
  const resolveCurrentTab = (): SectionTab =>
    activeTab === "all" ? viewContextTab || "lgu" : (activeTab as SectionTab);

  const afterMutateRefresh = async (target: SectionTab) => {
    // Refresh the table UI and its dataset without reloading entire page
    refreshTableFor(target, 1);
    await fetchDataOne(target);
  };

  /* ---------- CRUD handlers ---------- */
  const handleDeleteRecord = async (id: string) => {
    try {
      const targetTab = resolveCurrentTab();
      await deleteRecord(targetTab, id);

      setMessageBox((prev) => ({
        ...prev,
        isOpen: true,
        type: "message",
        message: "Record deleted successfully",
      }));

      closeViewModal();
      await afterMutateRefresh(targetTab);
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
        message: serverDetail,
      }));
    }
  };

  const handleAddRecord = async (payload: any, tabOverride?: SectionTab) => {
    const target = tabOverride || resolveCurrentTab();
    const response = await addRecord(target, payload);

    if (!(response as any)?.error) {
      setMessageBox((prev) => ({
        ...prev,
        isOpen: true,
        type: "message",
        message: "Record added successfully",
      }));
      closeAddModal();
      await afterMutateRefresh(target);
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
    mapping: Record<number, any>,
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
    const target = resolveCurrentTab();
    const response = await updateRecord(target, id, payload);

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
      switch (target) {
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
            }),
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
            }),
          );
          break;
        case "evacuation":
          setSelectedViewData((prev) =>
            safeUpdateByIndex(prev, {
              1: payload.name,
              2: payload.lat,
              3: payload.lng,
              4: payload.capacity,
            }),
          );
          break;
        case "hazard":
          setSelectedViewData((prev) =>
            safeUpdateByIndex(prev, {
              2: payload.hazard_area,
              3: payload.image_url,
              4: payload.hazard_type,
            }),
          );
          break;
        case "rafi": {
          let rafi_name: string | null | undefined;
          let latStr: string | null | undefined;
          let lngStr: string | null | undefined;
          let rafi_desc: string | null | undefined;

          if (payload instanceof FormData) {
            rafi_name = payload.get("rafi_name") as string;
            latStr = payload.get("lat") as string;
            lngStr = payload.get("lng") as string;
            rafi_desc = payload.get("rafi_desc") as string;
          } else {
            rafi_name = payload.rafi_name ?? payload.name;
            latStr = payload.lat != null ? String(payload.lat) : undefined;
            lngStr = payload.lng != null ? String(payload.lng) : undefined;
            rafi_desc = payload.rafi_desc ?? payload.description;
          }

          const lat = latStr != null ? Number(latStr) : undefined;
          const lng = lngStr != null ? Number(lngStr) : undefined;

          const newPicFromResp = (response as any)?.record?.rafi_pic as
            | string
            | undefined;
          const prevPic =
            (selectedViewData?.data?.[5]?.text as string) || undefined;

          const cacheBust = (url?: string) =>
            url ? `${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}` : url;

          const picToUse = newPicFromResp
            ? cacheBust(newPicFromResp)
            : cacheBust(prevPic);

          document.dispatchEvent(
            new CustomEvent("rafi:updated", {
              detail: { id, rafi_pic: newPicFromResp },
            }),
          );

          setSelectedViewData((prev) =>
            safeUpdateByIndex(prev, {
              1: rafi_name ?? (prev?.data?.[1]?.text as string),
              2: lat != null ? String(lat) : (prev?.data?.[2]?.text as string),
              3: lng != null ? String(lng) : (prev?.data?.[3]?.text as string),
              4: rafi_desc ?? (prev?.data?.[4]?.text as string),
              5: picToUse as string,
            }),
          );
          break;
        }
      }
    } catch {
      // As a fallback, re-fetch that section
      await fetchDataOne(target);
    }

    closeEditModal();
    openViewModal(undefined, target);
    await afterMutateRefresh(target);
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
    // reset modals
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

    if (activeTab === "all") {
      fetchAll();
    } else {
      fetchDataOne(activeTab as SectionTab);
    }
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
        handleAddRecord={(payload: any) => handleAddRecord(payload, "hazard")}
      />
      <AddEvacuationModal
        isModalOpen={addModalState.evacuation}
        closeModal={closeAddModal}
        setMessageBox={setMessageBox}
        handleAddEvacuation={(payload: any) =>
          handleAddRecord(payload, "evacuation")
        }
      />
      <AddRafiModal
        isModalOpen={addModalState.rafi}
        closeModal={closeAddModal}
        setMessageBox={setMessageBox}
        handleAddRecord={(payload: any) => handleAddRecord(payload, "rafi")}
      />
      <AddLGUModal
        isModalOpen={addModalState.lgu}
        closeModal={closeAddModal}
        setMessageBox={setMessageBox}
        handleAddRecord={(payload: any) => handleAddRecord(payload, "lgu")}
      />
      <AddBarangayModal
        isModalOpen={addModalState.barangay}
        closeModal={closeAddModal}
        setMessageBox={setMessageBox}
        handleAddRecord={(payload: any) => handleAddRecord(payload, "barangay")}
      />

      {/* ========== GATED VIEW / EDIT MODALS ========== */}
      {/* LGU */}
      {viewModalState.lgu && selectedViewData && (
        <ViewLGUModal
          isModalOpen={viewModalState.lgu}
          closeModal={closeViewModal}
          setMessageBox={setMessageBox}
          selectedData={selectedViewData}
          handleDeleteRecord={handleDeleteRecord}
          openEditModal={openEditModal}
        />
      )}
      {editModalState.lgu && selectedViewData && (
        <EditLGUModal
          isModalOpen={editModalState.lgu}
          closeModal={closeEditModal}
          setMessageBox={setMessageBox}
          selectedData={selectedViewData}
          handleEditRecord={handleEditRecord}
        />
      )}

      {/* BARANGAY */}
      {viewModalState.barangay && selectedViewData && (
        <ViewBarangayModal
          isModalOpen={viewModalState.barangay}
          closeModal={closeViewModal}
          setMessageBox={setMessageBox}
          selectedData={selectedViewData}
          handleDeleteRecord={handleDeleteRecord}
          openEditModal={openEditModal}
        />
      )}
      {editModalState.barangay && selectedViewData && (
        <EditBarangayModal
          isModalOpen={editModalState.barangay}
          closeModal={closeEditModal}
          setMessageBox={setMessageBox}
          selectedData={selectedViewData}
          handleEditRecord={handleEditRecord}
        />
      )}

      {/* EVACUATION */}
      {viewModalState.evacuation && selectedViewData && (
        <ViewEvecuationModal
          isModalOpen={viewModalState.evacuation}
          closeModal={closeViewModal}
          setMessageBox={setMessageBox}
          selectedData={selectedViewData}
          handleDeleteRecord={handleDeleteRecord}
          openEditModal={openEditModal}
        />
      )}
      {editModalState.evacuation && selectedViewData && (
        <EditEvacuationModal
          isModalOpen={editModalState.evacuation}
          closeModal={closeEditModal}
          setMessageBox={setMessageBox}
          selectedData={selectedViewData}
          handleEditRecord={handleEditRecord}
        />
      )}

      {/* RAFI */}
      {viewModalState.rafi && selectedViewData && (
        <ViewRafiModalModal
          isModalOpen={viewModalState.rafi}
          closeModal={closeViewModal}
          setMessageBox={setMessageBox}
          selectedData={selectedViewData}
          handleDeleteRecord={handleDeleteRecord}
          openEditModal={openEditModal}
        />
      )}
      {editModalState.rafi && selectedViewData && (
        <EditRafiModal
          isModalOpen={editModalState.rafi}
          closeModal={closeEditModal}
          setMessageBox={setMessageBox}
          selectedData={selectedViewData}
          handleEditRecord={handleEditRecord}
        />
      )}

      {/* HAZARD */}
      {viewModalState.hazard && selectedViewData && (
        <ViewHazardModal
          isModalOpen={viewModalState.hazard}
          closeModal={closeViewModal}
          setMessageBox={setMessageBox}
          selectedData={selectedViewData}
          handleDeleteRecord={handleDeleteRecord}
          openEditModal={openEditModal}
        />
      )}
      {editModalState.hazard && selectedViewData && (
        <EditHazardModal
          isModalOpen={editModalState.hazard}
          closeModal={closeEditModal}
          setMessageBox={setMessageBox}
          selectedData={selectedViewData}
          handleEditRecord={handleEditRecord}
        />
      )}
  {/* ---------- LGU Section ---------- */}
      <div className="lgu-header-container">
        <div className="lgu-text-container">
          <span className="lgu-text">LGU:</span>
        </div>
      <div className="lgu-image-container">
  <img src={defaultpicture} alt="Default LGU Logo" className="lgu-image" />
</div>
<button
  className="view-lgu-button"
  onClick={() => openViewModal(undefined, 'lgu')}  // Trigger the view modal for LGU
>
  View
</button>


      </div>





      {/* ---------- TOP CONTROLS: FILTER + ADD PIN ---------- */}
      <div className="top-controls">
        {/* Filter (left) */}
        <div className="filter-container" ref={filterRef}>
          <div className="filter-dropdown">
            <button
              className="filter-button"
              onClick={(e) => {
                e.stopPropagation();
                setShowFilter((prev) => !prev);
                setShowAddPin(false);
              }}
            >
              Filter:&nbsp;
              {activeTab === "all"
                ? "All"
                : activeTab === "lgu"
                  ? "LGU"
                  : activeTab === "barangay"
                    ? "Barangay"
                    : activeTab === "rafi"
                      ? "RAFI"
                      : activeTab === "hazard"
                        ? "Hazard"
                        : "Evacuation"}
              <span className="arrow">▼</span>
            </button>

            {showFilter && (
              <div
                className="dropdown-menu"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    setActiveTab("all");
                    setShowFilter(false);
                  }}
                >
                  All
                </button>
                <button
                  onClick={() => {
                    setActiveTab("lgu");
                    setShowFilter(false);
                  }}
                >
                  LGU
                </button>
                <button
                  onClick={() => {
                    setActiveTab("barangay");
                    setShowFilter(false);
                  }}
                >
                  Barangay
                </button>
                <button
                  onClick={() => {
                    setActiveTab("rafi");
                    setShowFilter(false);
                  }}
                >
                  RAFI
                </button>
                <button
                  onClick={() => {
                    setActiveTab("hazard");
                    setShowFilter(false);
                  }}
                >
                  Hazard
                </button>
                {/* Add Evacuation here if you want to expose it */}
                {/* <button onClick={() => { setActiveTab("evacuation"); setShowFilter(false); }}>Evacuation</button> */}
              </div>
            )}
          </div>
        </div>

        {/* Add Pin (right) */}
        <div className="addpin-container" ref={addPinRef}>
          <button
            className="addpin-button"
            onClick={(e) => {
              e.stopPropagation();
              setShowAddPin((p) => !p);
              setShowFilter(false);
            }}
          >
            + Add Pin <span className="arrow">▼</span>
          </button>

          {showAddPin && (
            <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => {
                  setShowAddPin(false);
                  openAddModal("lgu");
                }}
              >
                LGU
              </button>
              <button
                onClick={() => {
                  setShowAddPin(false);
                  openAddModal("barangay");
                }}
              >
                Barangay
              </button>
              <button
                onClick={() => {
                  setShowAddPin(false);
                  openAddModal("rafi");
                }}
              >
                RAFI
              </button>
              <button
                onClick={() => {
                  setShowAddPin(false);
                  openAddModal("hazard");
                }}
              >
                Hazard
              </button>
              {/* No Evacuation per request */}
            </div>
          )}
        </div>
      </div>

      {/* ---------- CONTENT ---------- */}
      <div>
        {/* ===== ALL VIEW: show every table stacked ===== */}
        {activeTab === "all" && (
          <>
            {/* LGU Block */}
            <section className="section-block">
              <div className="horizontal-container">
                <h2 className="section-title">LGU</h2>
              </div>

              {lguResponse ? (
                <div className="table-scroll">
                  <TableView
                    tableJSON={lguResponse}
                    onClickCallback={(row: TableRowShape) =>
                      openViewModal(row, "lgu")
                    }
                    setCallbackTableData={true}
                    pageRequest={`/lgu_profiling/manage_lgu/get_lgu?page=`}
                    updateTable={(fn) => setTableRef("lgu", fn)}
                  />
                </div>
              ) : (
                <div>Loading LGU data...</div>
              )}
            </section>

            {/* Barangay Block */}
            <section className="section-block">
              <div className="horizontal-container">
                <h2 className="section-title">Barangay</h2>
              </div>
              {barangayResponse ? (
                <div className="table-scroll">
                  <TableView
                    tableJSON={barangayResponse}
                    onClickCallback={(row: TableRowShape) =>
                      openViewModal(row, "barangay")
                    }
                    setCallbackTableData={true}
                    pageRequest={`/lgu_profiling/manage_lgu/get_barangay?page=`}
                    updateTable={(fn) => setTableRef("barangay", fn)}
                  />
                </div>
              ) : (
                <div>Loading Barangay data...</div>
              )}
            </section>

            {/* RAFI Block */}
            <section className="section-block">
              <div className="horizontal-container">
                <h2 className="section-title">RAFI Infrastructure</h2>
              </div>
              {rafiResponse ? (
                <div className="table-scroll">
                  <TableView
                    tableJSON={rafiResponse}
                    onClickCallback={(row: TableRowShape) =>
                      openViewModal(row, "rafi")
                    }
                    setCallbackTableData={true}
                    pageRequest={`/lgu_profiling/manage_lgu/get_rafi?page=`}
                    updateTable={(fn) => setTableRef("rafi", fn)}
                  />
                </div>
              ) : (
                <div>Loading RAFI data...</div>
              )}
            </section>

            {/* Hazard Block */}
            <section className="section-block">
              <div className="horizontal-container">
                <h2 className="section-title">Hazard Mapping</h2>
              </div>
              {hazardResponse ? (
                <div className="table-scroll">
                  <TableView
                    tableJSON={hazardResponse}
                    onClickCallback={(row: TableRowShape) =>
                      openViewModal(row, "hazard")
                    }
                    setCallbackTableData={true}
                    pageRequest={`/lgu_profiling/manage_lgu/get_hazard?page=`}
                    updateTable={(fn) => setTableRef("hazard", fn)}
                  />
                </div>
              ) : (
                <div>Loading Hazard data...</div>
              )}
            </section>

            {/* Evacuation center (optional to show in All) */}
            {/* <section className="section-block">
              <div className="horizontal-container">
                <h2 className="section-title">Evacuation Centers</h2>
              </div>
              {evacuationResponse ? (
                <div className="table-scroll">
                  <TableView
                    tableJSON={evacuationResponse}
                    onClickCallback={(row: TableRowShape) => openViewModal(row, "evacuation")}
                    setCallbackTableData={true}
                    pageRequest={`/lgu_profiling/manage_lgu/get_evacuation?page=`}
                    updateTable={(fn) => setTableRef("evacuation", fn)}
                  />
                </div>
              ) : (
                <div>Loading Evacuation data...</div>
              )}
            </section> */}
          </>
        )}

        {/* ===== SINGLE SECTION VIEWS ===== */}
        {activeTab === "lgu" && (
          <>
            <div className="horizontal-container">
              <h2 className="section-title">LGU</h2>
            </div>

            {lguResponse ? (
              <div className="table-scroll">
                <TableView
                  tableJSON={lguResponse}
                  onClickCallback={(row: TableRowShape) =>
                    openViewModal(row, "lgu")
                  }
                  setCallbackTableData={true}
                  pageRequest={`/lgu_profiling/manage_lgu/get_lgu?page=`}
                  updateTable={(fn) => setTableRef("lgu", fn)}
                />
              </div>
            ) : (
              <div>Loading data...</div>
            )}
          </>
        )}

        {activeTab === "barangay" && (
          <>
            <div className="horizontal-container">
              <h2 className="section-title">Barangay</h2>
            </div>
            {barangayResponse ? (
              <div className="table-scroll">
                <TableView
                  tableJSON={barangayResponse}
                  onClickCallback={(row: TableRowShape) =>
                    openViewModal(row, "barangay")
                  }
                  setCallbackTableData={true}
                  pageRequest={`/lgu_profiling/manage_lgu/get_barangay?page=`}
                  updateTable={(fn) => setTableRef("barangay", fn)}
                />
              </div>
            ) : (
              <div>Loading data...</div>
            )}
          </>
        )}

        {activeTab === "rafi" && (
          <>
            <div className="horizontal-container">
              <h2 className="section-title">RAFI Infrastructure</h2>
            </div>
            {rafiResponse ? (
              <div className="table-scroll">
                <TableView
                  tableJSON={rafiResponse}
                  onClickCallback={(row: TableRowShape) =>
                    openViewModal(row, "rafi")
                  }
                  setCallbackTableData={true}
                  pageRequest={`/lgu_profiling/manage_lgu/get_rafi?page=`}
                  updateTable={(fn) => setTableRef("rafi", fn)}
                />
              </div>
            ) : (
              <div>Loading data...</div>
            )}
          </>
        )}

        {activeTab === "hazard" && (
          <>
            <div className="horizontal-container">
              <h2 className="section-title">Hazard Mapping</h2>
            </div>
            {hazardResponse ? (
              <div className="table-scroll">
                <TableView
                  tableJSON={hazardResponse}
                  onClickCallback={(row: TableRowShape) =>
                    openViewModal(row, "hazard")
                  }
                  setCallbackTableData={true}
                  pageRequest={`/lgu_profiling/manage_lgu/get_hazard?page=`}
                  updateTable={(fn) => setTableRef("hazard", fn)}
                />
              </div>
            ) : (
              <div>Loading data...</div>
            )}
          </>
        )}

        {activeTab === "evacuation" && (
          <>
            <div className="horizontal-container">
              <h2 className="section-title">Evacuation Centers</h2>
            </div>
            {evacuationResponse ? (
              <div className="table-scroll">
                <TableView
                  tableJSON={evacuationResponse}
                  onClickCallback={(row: TableRowShape) =>
                    openViewModal(row, "evacuation")
                  }
                  setCallbackTableData={true}
                  pageRequest={`/lgu_profiling/manage_lgu/get_evacuation?page=`}
                  updateTable={(fn) => setTableRef("evacuation", fn)}
                />
              </div>
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
