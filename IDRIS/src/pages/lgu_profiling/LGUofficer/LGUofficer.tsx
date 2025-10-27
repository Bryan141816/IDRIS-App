// LGUofficer.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import "../css/LGUofficermanagement.css";
import "../../response_dashboard/DefaultListViewStyle.scss";
import { API } from "../../../API_Handler/Axio_API_Handler";
import defaultpicture from "../../../../public/images/defaultpicture.jpg";
import { getMyLGULocation } from "../../../API_Handler/lguprofiling/LGUofficer";
import { MessageBox } from "../../../components/Page_Furniture/MessageBox";

// ✅ Frontend-only modals (no backend writes inside)
import {
  MyLGUViewModal,
  MyLGUEditModal,
  type LGUEditForm,
} from "./Modals/LGUModals";

/* ========================= TYPES ========================= */
type MessageBoxState = {
  isOpen: boolean;
  type: "message" | "confirm";
  message: string;
  onSubmit?: () => void;
  onClose: () => void;
};

export type LGURecord = {
  lgu_name?: string;
};

/* ========================= BARANGAY TABLE TYPES ========================= */
type BarangayRow = {
  id: string | number;
  name: string;
  location: string;
  captain: string;
  evacuation: string;
};

/* Placeholder data */
const sampleBarangays: BarangayRow[] = [
  { id: 1, name: "Barangay Mabini", location: "10.3182, 123.8971", captain: "Juan Dela Cruz", evacuation: "Dayag's Evac" },
  { id: 2, name: "Barangay Poblacion", location: "10.3150, 123.9002", captain: "Maria Santos", evacuation: "Antier's Evac" },
  { id: 3, name: "Barangay San Roque", location: "10.3201, 123.8805", captain: "Pedro Reyes", evacuation: "Alcantara's Evac" },
];

/* ========================= RAFI TABLE TYPES ========================= */
type RafiRow = {
  id: string | number;
  raffi: string;       // name/title of the RAFI item
  location: string;    // e.g., "Barangay Mabini" or coordinates
  description: string; // short details
};

/* Placeholder RAFI data */
const sampleRafis: RafiRow[] = [
  {
    id: "r1",
    raffi: "RAFI Multi-Purpose Hall",
    location: "Barangay Mabini (10.3182, 123.8971)",
    description: "Community hall used for relief ops and trainings.",
  },
  {
    id: "r2",
    raffi: "RAFI Evacuation Center",
    location: "Barangay Poblacion (10.3150, 123.9002)",
    description: "Designated evacuation site with 20 rooms.",
  },
  {
    id: "r3",
    raffi: "RAFI Water Point",
    location: "Barangay San Roque (10.3201, 123.8805)",
    description: "Solar-powered water filtration kiosk.",
  },
];

/* ========================= COMPONENT ========================= */
const MapOfCebu = () => {
  const [myLGUViewOpen, setMyLGUViewOpen] = useState(false);
  const [myLGUEditOpen, setMyLGUEditOpen] = useState(false);
  const [modalData, setModalData] = useState<LGUEditForm | null>(null);

  const [myLGULocation, setMyLGULocation] = useState<string | null>(null);
  const [loadingLGU, setLoadingLGU] = useState<boolean>(true);

  const [barangays, setBarangays] = useState<BarangayRow[]>([]);
  const [rafis, setRafis] = useState<RafiRow[]>([]);

  // Filter state => 'all' | 'barangay' | 'rafi'
  const [filterView, setFilterView] = useState<"all" | "barangay" | "rafi">("all");

  // Add Pin dropdown state
  const [isAddPinOpen, setIsAddPinOpen] = useState(false);
  const addPinRef = useRef<HTMLDivElement | null>(null);

  // Filter dropdown state (custom dropdown, same style as Add Pin)
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement | null>(null);

  const [messageBox, setMessageBox] = useState<MessageBoxState>({
    isOpen: false,
    type: "message",
    message: "",
    onSubmit: undefined,
    onClose: () => setMessageBox((prev) => ({ ...prev, isOpen: false })),
  });

  // Close menus on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (addPinRef.current && !addPinRef.current.contains(target)) {
        setIsAddPinOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // ✅ Fetch only the LGU location
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

  // ✅ Load placeholder data (replace later with backend)
  useEffect(() => {
    setBarangays(sampleBarangays);
    setRafis(sampleRafis);
  }, [myLGULocation]);

  const displayName = myLGULocation ?? (loadingLGU ? "Loading..." : "—");
  const lguImageSrc = useMemo(() => defaultpicture, []);

  function toModalData(): LGUEditForm {
    return {
      lgu_name: myLGULocation ?? "",
      classification: "",
      lgu_seal: undefined,
      population: "",
      barangay_count: "",
      mayor: "",
      contact: "",
      major_hazard: [],
      hazard_picture: "",
      drmm_personnel: "",
      drmm_contact: "",
      evacuation_center: "",
      critical_facilities: [],
      pwd: "",
      senior: "",
      children: "",
    };
  }

  const handleViewBarangay = (row: BarangayRow) => {
    setMessageBox({
      isOpen: true,
      type: "message",
      message:
        `Barangay: ${row.name}\n` +
        `Location: ${row.location}\n` +
        `Captain: ${row.captain}\n` +
        `Evacuation: ${row.evacuation}`,
      onSubmit: undefined,
      onClose: () => setMessageBox((prev) => ({ ...prev, isOpen: false })),
    });
  };

  const handleViewRafi = (row: RafiRow) => {
    setMessageBox({
      isOpen: true,
      type: "message",
      message:
        `RAFI: ${row.raffi}\n` +
        `Location: ${row.location}\n` +
        `Description: ${row.description}`,
      onSubmit: undefined,
      onClose: () => setMessageBox((prev) => ({ ...prev, isOpen: false })),
    });
  };

  const handleAddPin = (type: "barangay" | "rafi") => {
    setIsAddPinOpen(false);
    setMessageBox({
      isOpen: true,
      type: "message",
      message:
        type === "barangay"
          ? "Add Pin → Barangay clicked. (Hook to your map pin flow)"
          : "Add Pin → RAFI clicked. (Hook to your map pin flow)",
      onClose: () => setMessageBox((p) => ({ ...p, isOpen: false })),
    });
  };

  const applyFilter = (value: "all" | "barangay" | "rafi") => {
    setFilterView(value);
    setIsFilterOpen(false);
  };

  // helpers for conditional rendering
  const showBarangay = filterView === "all" || filterView === "barangay";
  const showRafi = filterView === "all" || filterView === "rafi";

  return (
    <div className="app-container">
      <MessageBox
        isOpen={messageBox.isOpen}
        onClose={messageBox.onClose}
        type={messageBox.type}
        message={messageBox.message}
        onSubmit={messageBox.onSubmit}
      />

      {/* === LGU modals === */}
      <MyLGUViewModal
        isModalOpen={myLGUViewOpen}
        closeModal={() => setMyLGUViewOpen(false)}
        setMessageBox={setMessageBox}
        data={modalData}
        onOpenEdit={() => {
          setMyLGUViewOpen(false);
          setMyLGUEditOpen(true);
        }}
      />

      <MyLGUEditModal
        isModalOpen={myLGUEditOpen}
        closeModal={() => setMyLGUEditOpen(false)}
        setMessageBox={setMessageBox}
        prefetch={{
          lgu_name: displayName || "",
          barangay_count: undefined,
          evacuation_center: "",
        }}
        onSaved={(updated) => {
          setModalData(updated ?? null);
          setMyLGUEditOpen(false);
          setMyLGUViewOpen(true);
        }}
      />

      {/* === LGU HEADER === */}
      <header className="lgu-page-header">
        <h1 className="lgu-page-title">{displayName}</h1>
      </header>

      {/* === LGU SUMMARY CARD === */}
      <div className="lgu-summary-card">
        <div className="lgu-summary-left">
  <div className="lgu-seal-label">LGU Seal</div>
  <img
    src={lguImageSrc}
    alt={displayName || "LGU"}
    className="lgu-summary-img"
    onError={(e) => {
      const img = e.currentTarget as HTMLImageElement;
      if (!img.src.endsWith("defaultpicture.jpg")) {
        (img as any).onerror = null;
        img.src = defaultpicture;
      }
    }}
  />
</div>


        <div className="lgu-summary-center" />

        <div className="lgu-summary-right">
          <div className="lgu-summary-grid">
            <div className="label">Category</div>
            <div className="value">—</div>

            <div className="label">Mayor</div>
            <div className="value">—</div>

            <div className="label">Population</div>
            <div className="value">—</div>

            <div className="label">No. of Barangays</div>
            <div className="value">{barangays.length}</div>

            <div className="label">DRRM Personnel</div>
            <div className="value">—</div>

            <div className="label">Contact Nos.</div>
            <div className="value">—</div>
          </div>

          <div className="lgu-summary-actions">
            <button
              className="view-lgu-button"
              onClick={() => {
                setModalData(toModalData());
                setMyLGUViewOpen(true);
              }}
              disabled={!myLGULocation}
            >
              View more
            </button>
          </div>
        </div>
      </div>

      {/* === TOOLS BAR: Add Pin (dropdown) left / Filter (dropdown) right === */}
      <div className="lgu-tools">
        {/* Add Pin dropdown */}
        <div className="addpin-dropdown" ref={addPinRef}>
          <button
            className="btn-pin"
            onClick={() => setIsAddPinOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={isAddPinOpen}
          >
            + Add Pin <span className="caret">▾</span>
          </button>

          {isAddPinOpen && (
            <div className="addpin-menu" role="menu">
              <button role="menuitem" onClick={() => handleAddPin("barangay")}>
                Barangay
              </button>
              <button role="menuitem" onClick={() => handleAddPin("rafi")}>
                RAFI
              </button>
            </div>
          )}
        </div>

        {/* Filter dropdown (same style as Add Pin) */}
        <div className="filter-dropdown" ref={filterRef}>
          <button
            className="btn-pin" /* reuse same button style */
            onClick={() => setIsFilterOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={isFilterOpen}
          >
            Filter: <strong style={{marginLeft: 6, marginRight: 6, fontWeight: 800, color: "var(--clr-text)"}}>
              {filterView === "all" ? "All" : filterView === "barangay" ? "Barangay" : "RAFI"}
            </strong>
            <span className="caret">▾</span>
          </button>

          {isFilterOpen && (
            <div className="filter-menu" role="menu">
              <button
                role="menuitem"
                onClick={() => applyFilter("all")}
                aria-pressed={filterView === "all"}
              >
                All
              </button>
              <button
                role="menuitem"
                onClick={() => applyFilter("barangay")}
                aria-pressed={filterView === "barangay"}
              >
                Barangay
              </button>
              <button
                role="menuitem"
                onClick={() => applyFilter("rafi")}
                aria-pressed={filterView === "rafi"}
              >
                RAFI
              </button>
            </div>
          )}
        </div>
      </div>

      {/* === BARANGAY TABLE === */}
      {(filterView === "all" || filterView === "barangay") && (
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
                {barangays.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-cell">
                      No barangays to display.
                    </td>
                  </tr>
                ) : (
                  barangays.map((b) => (
                    <tr key={b.id}>
                      <td>{b.name}</td>
                      <td>{b.location}</td>
                      <td>{b.captain}</td>
                      <td>{b.evacuation}</td>
                      <td className="col-action">
                        <button className="btn-view" onClick={() => handleViewBarangay(b)}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* === RAFI TABLE === */}
      {(filterView === "all" || filterView === "rafi") && (
        <section className="raffi-section" style={{ marginTop: "2rem" }}>
          <div className="raffi-header">
            <h2>RAFI</h2>
          </div>

          <div className="raffi-table-wrap">
            <table className="barangay-table">
              <thead>
                <tr>
                  <th>RAFI</th>
                  <th>Location</th>
                  <th>Description</th>
                  <th className="col-action">Action</th>
                </tr>
              </thead>
              <tbody>
                {rafis.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="empty-cell">
                      No RAFI items to display.
                    </td>
                  </tr>
                ) : (
                  rafis.map((r) => (
                    <tr key={r.id}>
                      <td>{r.raffi}</td>
                      <td>{r.location}</td>
                      <td>{r.description}</td>
                      <td className="col-action">
                        <button className="btn-view" onClick={() => handleViewRafi(r)}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

export default MapOfCebu;
