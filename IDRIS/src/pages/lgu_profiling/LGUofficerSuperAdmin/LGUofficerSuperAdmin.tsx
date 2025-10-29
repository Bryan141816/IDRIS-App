// RAFFIInfrastructure.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import "../css/LGUofficerSuperAdmin.css";
import "../../response_dashboard/DefaultListViewStyle.scss";
import { API } from "../../../API_Handler/Axio_API_Handler";
import defaultpicture from "../../../../public/images/defaultpicture.jpg";
import { getMyLGULocation } from "../../../API_Handler/lguprofiling/LGUofficer";
import { MessageBox } from "../../../components/Page_Furniture/MessageBox";
import { LGUOut } from "./Modals/LGUModals";
import { Link } from "react-router-dom"; // ✅ Added for navigation

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

// ✅ LGU table row (for sample LGU table)
type LGURow = {
  id: string | number;
  lgu_name: string;
  lgu_classification: "Municipality" | "City" | string;
  mayor?: string;
  lgu_contact?: string;
  lgu_seal?: string;
  population?: number | "";
  baranggay_count?: number | "";
  DRMMpersonel?: string;
};

/* ========================= HELPERS ========================= */
const fmtLL = (lat?: number | "" | null, lng?: number | "" | null) => {
  if (lat == null || lng == null || lat === "" || lng === "") return "—";
  const f = (n: number) => Number(n).toFixed(6);
  return `${f(Number(lat))}, ${f(Number(lng))}`;
};

/* ===== Placeholder data ===== */
const sampleLGUs: LGURow[] = [
  {
    id: "l1",
    lgu_name: "Bayawan City",
    lgu_classification: "City",
    mayor: "Jane D. Reyes",
    lgu_contact: "03512345678",
    lgu_seal: defaultpicture,
    population: 135000,
    baranggay_count: 28,
    DRMMpersonel: "15",
  },
  {
    id: "l2",
    lgu_name: "Sta. Monica",
    lgu_classification: "Municipality",
    mayor: "Carlos P. Dizon",
    lgu_contact: "09181234567",
    lgu_seal: defaultpicture,
    population: 42000,
    baranggay_count: 12,
    DRMMpersonel: "6",
  },
];

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
  // const [myLGULocation, setMyLGULocation] = useState<LGUOut | null>(null);
  // const [loadingLGU, setLoadingLGU] = useState<boolean>(true);
  // const [error, setError] = useState<string | null>(null);
  const [selectedData, setSelectedData] = useState<any>(null);
  const [activeModal, setActiveModal] = useState("");

  const openModal = (type: string, selected: any = null) => {
    setActiveModal(type);
    if (selected) {
      setSelectedData(selected);
    }
  };
  const closeModal = () => {
    setActiveModal("");
    setSelectedData(null);
  };

  // Fetch LGU location (⚠️ commented out for now, replaced with sample LGU data)
  /*
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
  */

  return (
    <>
      {/* ✅ LGU MODALS */}
      {activeModal === "view-lgu" && selectedData && (
        <MyLGUViewModal
          closeModal={closeModal}
          onOpenEdit={() => {
            openModal("edit-modal", selectedData);
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
        {/* === LGU TABLE (sample data added here) === */}
        <section className="lgu-table-section" style={{ marginBottom: "2rem" }}>
          <div className="lgu-header">
            <h2>LGUs</h2>
          </div>
          <div className="lgu-table-wrap">
            <table className="barangay-table">
              <thead>
                <tr>
                  <th>LGU Name</th>
                  <th>Classification</th>
                  <th>Mayor</th>
                  <th>Contact</th>
                  <th className="col-action">Action</th>
                </tr>
              </thead>
              <tbody>
                {sampleLGUs.map((lgu) => (
                  <tr key={lgu.id}>
                    <td>{lgu.lgu_name}</td>
                    <td>{lgu.lgu_classification}</td>
                    <td>{lgu.mayor ?? "—"}</td>
                    <td>{lgu.lgu_contact ?? "—"}</td>
                    <td>
                      {/* ✅ Changed: link to LGUofficermanagement page */}
                      <Link to="/lgu_profiling/LGUofficermanagement">
                        <button>View</button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

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
                    {/* loadingLGU ? "Loading..." :  */}
                    No barangays to display.
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
                    {/* loadingLGU ? "Loading..." : */}
                    No RAFFI entries to display.
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
