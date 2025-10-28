// RAFFIInfrastructure.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import "../css/LGUofficermanagement.css";
import "../../response_dashboard/DefaultListViewStyle.scss";
import { API } from "../../../API_Handler/Axio_API_Handler";
import defaultpicture from "../../../../public/images/defaultpicture.jpg";
import { getMyLGULocation } from "../../../API_Handler/lguprofiling/LGUofficer";
import { MessageBox } from "../../../components/Page_Furniture/MessageBox";
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
  BarangayCreateModal,
  BarangayDeleteModal,
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

/* ========================= TYPES ========================= */
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
  const [myLGULocation, setMyLGULocation] = useState<LGUOut | null>(null);
  const [loadingLGU, setLoadingLGU] = useState<boolean>(true);
  const [selectedData, setSelectedData] = useState<LGUOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState("");

  const openModal = (type: string, selected: LGUOut | null = null) => {
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
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      {activeModal === "view-lgu" && selectedData && (
        <MyLGUViewModal
          closeModal={closeModal}
          onOpenEdit={() => {
            openModal("edit-modal", myLGULocation);
          }}
          data={selectedData}
        ></MyLGUViewModal>
      )}
      {activeModal === "edit-modal" && selectedData && (
        <MyLGUEditModal
          closeModal={closeModal}
          data={selectedData}
        ></MyLGUEditModal>
      )}
      <div className="app-container">
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
                  <th>Barangay</th>
                  <th>Location</th>
                  <th>Captain</th>
                  <th>Evacuation</th>
                  <th className="col-action">Action</th>
                </tr>
              </thead>
              <tbody>
                {/* Render rows here. For now, show an empty state. */}
                <tr>
                  <td
                    colSpan={5}
                    style={{ textAlign: "center", padding: "1rem" }}
                  >
                    {loadingLGU ? "Loading..." : "No barangays to display."}
                  </td>
                </tr>
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
