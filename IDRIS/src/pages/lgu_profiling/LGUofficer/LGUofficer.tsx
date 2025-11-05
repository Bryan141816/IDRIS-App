import { useEffect, useMemo, useState } from "react";
import "../css/LGUofficermanagement.css";
import "../../response_dashboard/DefaultListViewStyle.scss";
import defaultpicture from "../../../../public/images/defaultpicture.jpg";
import { getMyLGULocation } from "../../../API_Handler/lguprofiling/LGUofficer";
import { Link } from "react-router-dom";
import { useUserContext } from "../../../UserContext";
import { useUserRoleContext } from "../../../UserRoleContext";
import Swal from "sweetalert2";

import { LGUOut } from "./Modals/LGUModals";
import { MyLGUViewModal, MyLGUEditModal } from "./Modals/LGUModals";

// Barangay
import {
  BarangayViewModal,
  BarangayEditModal,
  type MyBarangay,
} from "./Modals/BarangayModal";

// RAFFI
import {
  RAFFIViewModal,
  RAFFIEditModal,
  RAFFICreateModal,
  type RAFFIEditForm,
  type RAFFIOut as RAFFIRecord,
} from "./Modals/RAFFIModals";

// RAFFI API
import {
  getMyRAFFIList,
  deleteRAFFI,
} from "../../../API_Handler/lguprofiling/RAFFI";

import { API } from "../../../API_Handler/Axio_API_Handler";

/* ========================= TYPES ========================= */

export interface Evacuation {
  name: string;
  evacuation_id: number;
  capacity: number;
  lng: number;
  lat: number;
  occupied: number;
}

export interface Barangay {
  id: number;
  name: string;
  lat: number | null;
  lng: number | null;
  barangay_captain: string | null;
  total_population: number | null;
  barangay_pwd: number | null;
  barangay_children: number | null;
  barangay_senior: number | null;
  baranggay_pic: string | null;
  contact_info: string | null;
  household_count: number | null;
  lgu_id: number;
  evacucation_center_id: number | null;
  common_hazards: string[] | null;
  evacucation_center: Evacuation | null;
}

/* ========================= HELPERS ========================= */
const fmtLL = (lat?: number | "" | null, lng?: number | "" | null) => {
  if (lat == null || lng == null || lat === "" || lng === "") return "—";
  const f = (n: number) => Number(n).toFixed(6);
  return `${f(Number(lat))}, ${f(Number(lng))}`;
};

/* ========================= COMPONENT ========================= */
const LGUofficer: React.FC = () => {
  // LGU + permissions
  const { userType } = useUserContext();
  const { userRoles } = useUserRoleContext();

  const [myLGULocation, setMyLGULocation] = useState<LGUOut | null>(null);
  const [loadingLGU, setLoadingLGU] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const refreshMyLGU = async () => {
  try {
    setLoadingLGU(true);
    setError(null);
    const loc = await getMyLGULocation();
    setMyLGULocation(loc);
  } catch (e: any) {
    setError("Failed to load LGU information.");
  } finally {
    setLoadingLGU(false);
  }
};

  // Barangays
  const [barangayList, setBarangayList] = useState<Barangay[]>([]);
  const handleBarangaySaved = (updated: Barangay) => {
    setBarangayList(prev => prev.map(b => (b.id === updated.id ? { ...b, ...updated } : b)));
    setSelectedData(prev =>
      prev && "id" in prev && (prev as Barangay).id === updated.id
        ? { ...(prev as Barangay), ...updated }
        : prev
    );
  };

  // RAFFI
  const [raffiList, setRaffiList] = useState<RAFFIRecord[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRaffi, setSelectedRaffi] = useState<RAFFIRecord | null>(null);

  // Modals shared
  const [activeModal, setActiveModal] = useState<
    | ""
    | "view-lgu"
    | "edit-lgu"
    | "view-barangay"
    | "edit-barangay"
    | "view-raffi"
    | "edit-raffi"
  >("");
  const [selectedData, setSelectedData] = useState<LGUOut | Barangay | null>(null);

  // Gate "Add RAFFI" by LGU coords
  const canOpenRaffiCreate = useMemo(() => {
    const lat = Number(myLGULocation?.lat);
    const lng = Number(myLGULocation?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
    if (Math.abs(lat) < 0.1 && Math.abs(lng) < 0.1) return false; // avoid (near) 0,0
    return true;
  }, [myLGULocation]);

  // Data loaders
  const refreshBarangays = async () => {
    try {
      const res = await API.get("/lgu_profiling/me/barangay_list");
      setBarangayList(res.data);
    } catch (e: any) {
      console.error("Error fetching barangays:", e?.message || e);
    }
  };

  const refreshRaffi = async () => {
    try {
      const rows = await getMyRAFFIList();
      setRaffiList(rows || []);
    } catch (e: any) {
      console.error("Error fetching RAFFI:", e?.message || e);
    }
  };

  // Init
  useEffect(() => {
  let mounted = true;

  (async () => {
    await refreshMyLGU();
    if (!mounted) return;
    // optionally: nothing else here
  })();

  refreshBarangays();
  refreshRaffi();

  return () => {
    mounted = false;
  };
}, []);


  // Modal openers
  const openModal = (
    type:
      | "view-lgu"
      | "edit-lgu"
      | "view-barangay"
      | "edit-barangay"
      | "view-raffi"
      | "edit-raffi",
    payload?: any
  ) => {
    setActiveModal(type);
    if (type === "view-raffi" || type === "edit-raffi") {
      setSelectedRaffi(payload || null);
    } else {
      setSelectedData(payload || null);
    }
  };

  const closeModal = () => {
    setActiveModal("");
    setSelectedData(null);
    setSelectedRaffi(null);
  };

  // RAFFI callbacks
  const handleRAFFICreated = (created: RAFFIRecord | RAFFIEditForm) => {
    refreshRaffi();
    setShowCreateModal(false);
  };

  const handleRAFFISaved = (updated: RAFFIRecord | RAFFIEditForm) => {
    if (updated && "rafi_id" in updated) {
      setRaffiList(prev =>
        prev.map(r => (r.rafi_id === (updated as RAFFIRecord).rafi_id ? { ...r, ...updated } : r))
      );
    } else {
      refreshRaffi();
    }
  };

  // Delete handler used by table
  const handleRAFFIDelete = async (id: number) => {
    const confirm = await Swal.fire({
      title: "Delete RAFFI?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });
    if (!confirm.isConfirmed) return;

    try {
      await deleteRAFFI(id);
      setRaffiList(prev =>
        prev.filter(r => Number((r as any).rafi_id ?? (r as any).raffi_id) !== id)
      );
      Swal.fire("Deleted!", "RAFFI has been removed.", "success");
    } catch (e) {
      console.error(e);
      Swal.fire("Error", "Failed to delete the record.", "error");
    }
  };

  // Type guards
  function isLGUOut(x: LGUOut | Barangay): x is LGUOut {
    return typeof (x as LGUOut).lgu_name === "string";
  }
  function isBarangay(x: LGUOut | Barangay): x is Barangay {
    return typeof (x as Barangay).name === "string";
  }

  return (
    <>
      {/* ===== MODALS (LGU) ===== */}
      {activeModal === "view-lgu" && selectedData && isLGUOut(selectedData) && (
        <MyLGUViewModal
          closeModal={closeModal}
          onOpenEdit={() => openModal("edit-lgu", myLGULocation)}
          data={selectedData}
        />
      )}
      {activeModal === "edit-lgu" && selectedData && isLGUOut(selectedData) && (
        <MyLGUEditModal closeModal={closeModal} data={selectedData} onSaved={refreshMyLGU}  />
      )}

      {/* ===== MODALS (Barangay) ===== */}
      {activeModal === "view-barangay" && selectedData && isBarangay(selectedData) && (
        <BarangayViewModal closeModal={closeModal} data={selectedData} />
      )}
      {activeModal === "edit-barangay" &&
        myLGULocation?.lat &&
        myLGULocation?.lng &&
        selectedData &&
        isBarangay(selectedData) && (
          <BarangayEditModal
            lgu_name={myLGULocation?.lgu_name}
            closeModal={closeModal}
            data={selectedData}
            lgu_coordinate={[myLGULocation.lat, myLGULocation.lng]}
            onSaved={handleBarangaySaved}
          />
        )}

      {/* ===== MODALS (RAFFI) ===== */}
      {activeModal === "view-raffi" && selectedRaffi && (
        <RAFFIViewModal
          closeModal={closeModal}
          data={selectedRaffi}
          onOpenEdit={() => openModal("edit-raffi", selectedRaffi)}
          onDeleted={(id) => {
            setRaffiList(prev =>
              prev.filter(r => Number((r as any).rafi_id ?? (r as any).raffi_id) !== id)
            );
            closeModal();
          }}
        />
      )}
      {activeModal === "edit-raffi" && selectedRaffi && (
        <RAFFIEditModal
          closeModal={closeModal}
          data={selectedRaffi}
          lgu={myLGULocation || null}
          onSaved={(saved) => {
            handleRAFFISaved(saved as RAFFIRecord);
            closeModal();
          }}
          onDeleted={(id) => {
            setRaffiList(prev =>
              prev.filter(r => Number((r as any).rafi_id ?? (r as any).raffi_id) !== id)
            );
            closeModal();
          }}
        />
      )}
      {showCreateModal && canOpenRaffiCreate && myLGULocation && (
        <RAFFICreateModal
          closeModal={() => setShowCreateModal(false)}
          onCreated={handleRAFFICreated}
          lgu={myLGULocation}
        />
      )}

      {/* ===== PAGE ===== */}
      <div className="app-container">
        {/* Back button (superadmin) */}
        {userType === "admin" && userRoles.includes("superadmin") && (
          <Link to="/lgu_profiling/LGUofficerSuperAdmin" className="back-button">
            ← All Records
          </Link>
        )}

        <header className="lgu-page-header">
          <h1 className="lgu-page-title">
            {loadingLGU ? "Loading..." : `LGU of ${myLGULocation?.lgu_name ?? ""}`}
          </h1>
        </header>

        {error && (
          <div className="alert error" role="alert" style={{ marginBottom: 12 }}>
            {error}
          </div>
        )}

        {/* === SUMMARY CARD === */}
        <div className="lgu-summary-card">
          <div className="lgu-summary-left">
            <div className="lgu-seal-label">LGU Seal</div>
            <img
              className="lgu-summary-img"
              alt="LGU Seal"
              src={myLGULocation?.lgu_seal || defaultpicture}
            />
          </div>

          <div className="lgu-summary-center" />

          <div className="lgu-summary-right">
            <div className="lgu-summary-grid">
              <div className="label">Category</div>
              <div className="value">{myLGULocation?.lgu_classification ?? "—"}</div>

              <div className="label">Mayor</div>
              <div className="value">{myLGULocation?.mayor ?? "Not yet filled up"}</div>

              <div className="label">Population</div>
              <div className="value">{myLGULocation?.population ?? "Not yet filled up"}</div>

              <div className="label">No. of Barangays</div>
              <div className="value">{myLGULocation?.baranggay_count ?? 0}</div>

              <div className="label">DRRM Personnel</div>
              <div className="value">{myLGULocation?.DRMMpersonel ?? "Not yet filled up"}</div>

              <div className="label">Contact Nos.</div>
              <div className="value">{myLGULocation?.lgu_contact ?? "Not yet filled up"}</div>
            </div>

            <div className="lgu-summary-actions">
              <button className="view-lgu-button" onClick={() => openModal("view-lgu", myLGULocation)}>
                View more
              </button>
            </div>
          </div>
        </div>

        {/* === BARANGAY TABLE === */}
        <section className="barangay-section">
          <div className="barangay-header">
            <h2>Barangays - {myLGULocation?.baranggay_count ?? 0}</h2>
          </div>
          <div className="barangay-table-wrap">
            <table className="barangay-table">
              
              <thead>
                <tr>
                  <th>Name</th>
                  {/* <th>Coordinates</th> */}
                  <th>Captain</th>
                  <th>Contact</th>
                  {/* <th>Total Household</th> */}
                  <th>Total Population</th>
                  <th>Evacuation</th>
                  <th className="col-action">Action</th>
                </tr>
              </thead>
              <tbody>
                {barangayList.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "1rem" }}>
                      {loadingLGU ? "Loading..." : "No barangays to display."}
                    </td>
                  </tr>
                ) : (
                  barangayList.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      {/* <td>{item.lat && item.lng ? `${item.lat}, ${item.lng}` : "Not yet assigned"}</td> */}
                      <td>{item.barangay_captain || "Not yet assigned"}</td>
                      <td>{item.contact_info || "Not yet assigned"}</td>
                      {/* <td>{item.household_count ?? "Not yet assigned"}</td> */}
                      <td>{item.total_population ?? "Not yet assigned"}</td>
                      <td>{item.evacucation_center ? item.evacucation_center?.name : "Not yet assigned"}</td>
                      <td>
                        <button className="action-btn" onClick={() => openModal("view-barangay", item)}>View</button>
                        <button   className="action-btn edits" onClick={() => openModal("edit-barangay", item)}>Edit</button>
                        {/* If you add barangay delete later, put it here */}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* === RAFFI TABLE === */}
        <section className="raffi-section" style={{ marginTop: "2rem" }}>
          <div className="raffi-header">
            <h2>RAFFI</h2>
            <button
              className="add-raffi"
              onClick={() => setShowCreateModal(true)}
              disabled={!canOpenRaffiCreate || loadingLGU}
              style={{
                marginLeft: "auto",
                background: "#749AB6",
                color: "white",
                padding: "0.5rem 1rem",
                borderRadius: 6,
                border: "none",
                cursor: !canOpenRaffiCreate || loadingLGU ? "not-allowed" : "pointer",
                opacity: !canOpenRaffiCreate || loadingLGU ? 0.6 : 1,
              }}
              title={
                !canOpenRaffiCreate
                  ? "LGU coordinates not available yet"
                  : "Add RAFFI (centered to LGU)"
              }
            >
              + Add
            </button>
          </div>

          <div className="raffi-table-wrap">
            <table className="barangay-table">
              <thead>
                <tr>
                  <th>RAFFI Name</th>
                  <th>Location</th>
                  <th >Description</th>
                  <th className="raffi-action">Action</th>
                </tr>
              </thead>
              <tbody>
                {raffiList.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "1rem" }}>
                      {loadingLGU ? "Loading..." : "No RAFFI entries to display."}
                    </td>
                  </tr>
                ) : (
                  raffiList.map((r) => {
                    const rid = Number((r as any).rafi_id ?? (r as any).raffi_id);
                    return (
                      <tr key={rid}>
                        <td>{(r as any).raffi_name ?? (r as any).rafi_name}</td>
                        <td>{fmtLL((r as any).lat, (r as any).lng)}</td>
                        <td>{(r as any).raffi_desc || (r as any).rafi_desc || "—"}</td>
                        <td>
                          <button className="action-btn" onClick={() => openModal("view-raffi", r)}>View</button>
                          <button
  className="action-btn edit"
  onClick={() => openModal("edit-raffi", r)}
>
  Edit
</button>

                          <button
                            className="action-btn delete"
                            onClick={() => handleRAFFIDelete(rid)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
};

export default LGUofficer;
