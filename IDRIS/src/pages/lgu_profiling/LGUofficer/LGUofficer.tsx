
import { useEffect, useMemo, useRef, useState } from "react";
import "../css/LGUofficermanagement.css";
import "../../response_dashboard/DefaultListViewStyle.scss";
import defaultpicture from "../../../../public/images/defaultpicture.jpg";
import { getMyLGULocation } from "../../../API_Handler/lguprofiling/LGUofficer";
import { MessageBox } from "../../../components/Page_Furniture/MessageBox";
import { Link } from "react-router-dom";
import { useUserContext } from "../../../UserContext";
import { useUserRoleContext } from "../../../UserRoleContext";

import { LGUOut } from "./Modals/LGUModals";
// ✅ LGU modals (unchanged in this file)
import {
  MyLGUViewModal,
  MyLGUEditModal,
  type LGUEditForm,
} from "./Modals/LGUModals";

// ✅ Barangay modals (your file)
import {
  BarangayViewModal,
  BarangayEditModal,
  type MyBarangay,
} from "./Modals/BarangayModal";

// ✅ RAFFI modals (from previous answer)
import {
  RAFFIViewModal,
  RAFFIEditModal,
  RAFFICreateModal,
  RAFFIDeleteModal,
  type RAFFIRecord,
} from "./Modals/RAFIInfrastructure";
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
  common_hazards: string[] | null; // assuming it can be multiple hazards
  evacucation_center: Evacuation | null;
}

type MessageBoxState = {
  isOpen: boolean;
  type: "message" | "confirm";
  message: string;
  onSubmit?: () => void;
  onClose: () => void;
};

// Local table row wrappers (keep your existing MyBarangay intact)
type BarangayRow = MyBarangay & { id: string | number };

// RAFFI row (aligned with RAFFIRecord/RAFFIForm)
type RAFFIRow = RAFFIRecord & { id: string | number };

/* ========================= HELPERS ========================= */
const fmtLL = (lat?: number | "" | null, lng?: number | "" | null) => {
  if (lat == null || lng == null || lat === "" || lng === "") return "—";
  const f = (n: number) => Number(n).toFixed(6);
  return `${f(Number(lat))}, ${f(Number(lng))}`;
};

/* ===== Placeholder data ===== */
const sampleBarangays: BarangayRow[] = [
  {
    id: 1,
    barangay_name: "Barangay Mabini",
    lat: 10.3182,
    lng: 123.8971,
    total_population: 12000,
    households: 2500,
    barangay_captain: "Juan Dela Cruz",
    contact: "09171234567",
    common_hazards: ["Typhoons", "Flooding"],
    nearest_evacuation: "Dayag's Evac",
    pwd: 120,
    senior: 800,
    children: 3000,
  },
  {
    id: 2,
    barangay_name: "Barangay Poblacion",
    lat: 10.315,
    lng: 123.9002,
    total_population: 9800,
    households: 2100,
    barangay_captain: "Maria Santos",
    contact: "09181234567",
    common_hazards: ["Typhoons", "Earthquakes"],
    nearest_evacuation: "Antier's Evac",
    pwd: 95,
    senior: 720,
    children: 2500,
  },
  {
    id: 3,
    barangay_name: "Barangay San Roque",
    lat: 10.3201,
    lng: 123.8805,
    total_population: 14300,
    households: 3000,
    barangay_captain: "Pedro Reyes",
    contact: "09191234567",
    common_hazards: ["Landslides", "Typhoons"],
    nearest_evacuation: "Alcantara's Evac",
    pwd: 140,
    senior: 950,
    children: 3600,
  },
];

const sampleRAFFIs: RAFFIRow[] = [
  {
    id: "rf1",
    raffi_name: "RAFFI Multi-Purpose Hall",
    raffi_description: "Community hall used for relief ops and trainings.",
    lat: 10.3182,
    lng: 123.8971,
    raffi_picture: "",
  },
  {
    id: "rf2",
    raffi_name: "RAFFI Evacuation Center",
    raffi_description: "Designated evacuation site with 20 rooms.",
    lat: 10.315,
    lng: 123.9002,
    raffi_picture: "",
  },
  {
    id: "rf3",
    raffi_name: "RAFFI Water Point",
    raffi_description: "Solar-powered water filtration kiosk.",
    lat: 10.3201,
    lng: 123.8805,
    raffi_picture: "",
  },
];

/* ========================= COMPONENT ========================= */
const LGUofficer: React.FC = () => {

  const { userType } = useUserContext();
  const { userRoles } = useUserRoleContext();
  const roles = Array.isArray(userRoles) ? userRoles : [];

  const [myLGULocation, setMyLGULocation] = useState<LGUOut | null>(null);
  const [loadingLGU, setLoadingLGU] = useState<boolean>(true);
  const [selectedData, setSelectedData] = useState<LGUOut | Barangay | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState("");
  const [barangayList, setBarangayList] = useState<Barangay[]>([]);
  const openModal = (
    type: string,
    selected: LGUOut | Barangay | null = null,
  ) => {
    setActiveModal(type);
    if (selected) {
      setSelectedData(selected);
    }
  };
  const closeModal = () => {
    setActiveModal("");
    setSelectedData(null);
  };
  // Fetch LGU location
  //
  const fetchBarangay = async () => {
    try {
      const response = await API.get("/lgu_profiling/me/barangay_list");
      setBarangayList(response.data);
    } catch (e: any) {
      console.error("Error fetching barangay: " + e.mesasge);
    }
  };
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoadingLGU(true);
        setError(null);
        const loc = await getMyLGULocation();
        console.log(loc);
        if (isMounted) setMyLGULocation(loc);
      } catch (e) {
        if (isMounted) setError("Failed to load LGU information.");
      } finally {
        if (isMounted) setLoadingLGU(false);
      }
    })();
    fetchBarangay();
    return () => {
      isMounted = false;
    };
  }, []);

  function isLGUOut(x: LGUOut | Barangay): x is LGUOut {
    // pick fields unique to LGUOut
    return typeof (x as LGUOut).lgu_name === "string";
  }

  function isBarangay(x: LGUOut | Barangay): x is Barangay {
    // pick fields unique to Barangay
    return typeof (x as Barangay).name === "string";
  }

  return (
    <>
      {activeModal === "view-lgu" && selectedData && isLGUOut(selectedData) && (
        <MyLGUViewModal
          closeModal={closeModal}
          onOpenEdit={() => {
            openModal("edit-modal", myLGULocation);
          }}
          data={selectedData}
        ></MyLGUViewModal>
      )}
      {activeModal === "edit-modal" &&
        selectedData &&
        isLGUOut(selectedData) && (
          <MyLGUEditModal
            closeModal={closeModal}
            data={selectedData}
          ></MyLGUEditModal>
        )}
      {activeModal === "view-barangay" &&
        selectedData &&
        isBarangay(selectedData) && (
          <BarangayViewModal
            closeModal={closeModal}
            data={selectedData}
          ></BarangayViewModal>
        )}
      {activeModal === "edit-barangay" &&
        myLGULocation &&
        myLGULocation.lat &&
        myLGULocation.lng &&
        selectedData &&
        isBarangay(selectedData) && (
          <BarangayEditModal
            lgu_name={myLGULocation?.lgu_name}
            closeModal={closeModal}
            data={selectedData}
            lgu_coordinate={[myLGULocation.lat, myLGULocation.lng]}
          ></BarangayEditModal>
        )}




        {/* backkk button,,,, condition ni sa superAdmin kung mo navigate dri sa specific lgu*/}
      <div className="app-container">
          {userType === "admin" && userRoles.includes("superadmin") && (
    <Link
      to="/lgu_profiling/LGUofficerSuperAdmin"
      className="back-button"
    >
      ← All Records
    </Link>
  )}

        <header className="lgu-page-header">
          <h1 className="lgu-page-title">
            {loadingLGU
              ? "Loading..."
              : "LGU of " + (myLGULocation?.lgu_name ?? "")}
          </h1>
        </header>

        {error && (
          <div
            className="alert error"
            role="alert"
            style={{ marginBottom: 12 }}
          >
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
              src={
                myLGULocation?.lgu_seal
                  ? myLGULocation.lgu_seal
                  : defaultpicture
              }
            />
          </div>

          <div className="lgu-summary-center" />

          <div className="lgu-summary-right">
            <div className="lgu-summary-grid">
              <div className="label">Category</div>
              <div className="value">
                {myLGULocation?.lgu_classification ?? "—"}
              </div>

              <div className="label">Mayor</div>
              <div className="value">
                {myLGULocation?.mayor ?? "Not yet filled up"}
              </div>

              <div className="label">Population</div>
              <div className="value">
                {myLGULocation?.population ?? "Not yet filled up"}
              </div>

              <div className="label">No. of Barangays</div>
              <div className="value">{myLGULocation?.baranggay_count ?? 0}</div>

              <div className="label">DRRM Personnel</div>
              <div className="value">
                {myLGULocation?.DRMMpersonel ?? "Not yet filled up"}
              </div>

              <div className="label">Contact Nos.</div>
              <div className="value">
                {myLGULocation?.lgu_contact ?? "Not yet filled up"}
              </div>
            </div>

            <div className="lgu-summary-actions">
              <button
                className="view-lgu-button"
                onClick={() => openModal("view-lgu", myLGULocation)}
              >
                View more
              </button>
            </div>
          </div>
        </div>

        {/* === TOOLS BAR === */}
        <div className="lgu-tools">{/* Add tool buttons/filters here */}</div>

        {/* === BARANGAY TABLE === */}
        <section className="barangay-section">
          <div className="barangay-header">
            <h2>Barangays</h2>
          </div>
          <div className="barangay-table-wrap">
            <table className="barangay-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Coordinates</th>
                  <th>Contact</th>
                  <th>Captain</th>
                  <th>Total Household </th>
                  <th>Total Population</th>
                  <th>Evacuation</th>
                  <th className="col-action">Action</th>
                </tr>
              </thead>
              <tbody>
                {/* Render rows here. For now, show an empty state. */}
                {barangayList.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{ textAlign: "center", padding: "1rem" }}
                    >
                      {loadingLGU ? "Loading..." : "No barangays to display."}
                    </td>
                  </tr>
                ) : (
                  barangayList.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>
                        {item.lat && item.lng
                          ? `${item.lat}, ${item.lng}`
                          : "Not yet assigned"}
                      </td>
                      <td>
                        {item.contact_info
                          ? item.contact_info
                          : "Not yet assigned"}
                      </td>
                      <td>
                        {item.barangay_captain
                          ? item.barangay_captain
                          : "Not yet assigned"}
                      </td>
                      <td>
                        {item.household_count
                          ? item.household_count
                          : "Not yet assigned"}
                      </td>
                      <td>
                        {item.total_population
                          ? item.total_population
                          : "Not yet assigned"}
                      </td>
                      <td>
                        {item.evacucation_center
                          ? item.evacucation_center?.name
                          : "Not yet assigned"}
                      </td>
                      <td>
                        <button
                          className="action-btn"
                          onClick={() => openModal("view-barangay", item)}
                        >
                          View
                        </button>
                        <button
                          className="action-btn"
                          onClick={() => openModal("edit-barangay", item)}
                        >
                          Edit
                        </button>
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
          </div>
          <div className="raffi-table-wrap">
            <table className="barangay-table">
              <thead>
                <tr>
                  <th>RAFFI Name</th>
                  <th>Location</th>
                  <th>Description</th>
                  <th className="col-action">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    colSpan={4}
                    style={{ textAlign: "center", padding: "1rem" }}
                  >
                    {loadingLGU ? "Loading..." : "No RAFFI entries to display."}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
};

export default LGUofficer;
