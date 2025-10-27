// LGUofficer.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import "../css/LGUofficermanagement.css";
import "../../response_dashboard/DefaultListViewStyle.scss";
import { API } from "../../../API_Handler/Axio_API_Handler";
import defaultpicture from "../../../../public/images/defaultpicture.jpg";
import { getMyLGULocation } from "../../../API_Handler/lguprofiling/LGUofficer";
import { MessageBox } from "../../../components/Page_Furniture/MessageBox";

// ✅ LGU modals (unchanged)
import {
  MyLGUViewModal,
  MyLGUEditModal,
  type LGUEditForm,
} from "./Modals/LGUModals";

// ✅ Barangay modals (YOUR current file)
import {
  BarangayViewModal,
  BarangayEditModal,
  BarangayCreateModal,
  BarangayDeleteModal,
  type MyBarangay,
} from "./Modals/BarangayModal";

/* ========================= TYPES ========================= */
type MessageBoxState = {
  isOpen: boolean;
  type: "message" | "confirm";
  message: string;
  onSubmit?: () => void;
  onClose: () => void;
};

// Local table row wrapper (keeps your MyBarangay intact)
type BarangayRow = MyBarangay & { id: string | number };

/* Helpers */
const fmtLL = (lat?: number | "" | null, lng?: number | "" | null) => {
  if (lat == null || lng == null || lat === "" || lng === "") return "—";
  const f = (n: number) => Number(n).toFixed(6);
  return `${f(Number(lat))}, ${f(Number(lng))}`;
};

/* Placeholder data mapped to your MyBarangay fields */
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

/* RAFI placeholder kept as-is for now */
type RafiRow = {
  id: string | number;
  raffi: string;
  location: string;
  description: string;
};
const sampleRafis: RafiRow[] = [
  { id: "r1", raffi: "RAFI Multi-Purpose Hall", location: "Barangay Mabini (10.3182, 123.8971)", description: "Community hall used for relief ops and trainings." },
  { id: "r2", raffi: "RAFI Evacuation Center", location: "Barangay Poblacion (10.3150, 123.9002)", description: "Designated evacuation site with 20 rooms." },
  { id: "r3", raffi: "RAFI Water Point", location: "Barangay San Roque (10.3201, 123.8805)", description: "Solar-powered water filtration kiosk." },
];

/* ========================= COMPONENT ========================= */
const MapOfCebu = () => {
  // LGU modals
  const [myLGUViewOpen, setMyLGUViewOpen] = useState(false);
  const [myLGUEditOpen, setMyLGUEditOpen] = useState(false);
  const [modalData, setModalData] = useState<LGUEditForm | null>(null);

  // LGU info
  const [myLGULocation, setMyLGULocation] = useState<string | null>(null);
  const [loadingLGU, setLoadingLGU] = useState<boolean>(true);

  // Tables
  const [barangays, setBarangays] = useState<BarangayRow[]>([]);
  const [rafis, setRafis] = useState<RafiRow[]>([]);

  // Barangay modal state
  const [selectedBarangay, setSelectedBarangay] = useState<BarangayRow | null>(null);
  const [isBrgyViewOpen, setIsBrgyViewOpen] = useState(false);
  const [isBrgyEditOpen, setIsBrgyEditOpen] = useState(false);
  const [isBrgyCreateOpen, setIsBrgyCreateOpen] = useState(false);
  const [isBrgyDeleteOpen, setIsBrgyDeleteOpen] = useState(false);

  // Filters
  const [filterView, setFilterView] = useState<"all" | "barangay" | "rafi">("all");

  // Dropdowns
  const [isAddPinOpen, setIsAddPinOpen] = useState(false);
  const addPinRef = useRef<HTMLDivElement | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement | null>(null);

  // MessageBox
  const [messageBox, setMessageBox] = useState<MessageBoxState>({
    isOpen: false,
    type: "message",
    message: "",
    onSubmit: undefined,
    onClose: () => setMessageBox((prev) => ({ ...prev, isOpen: false })),
  });

  // Close menus outside
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (addPinRef.current && !addPinRef.current.contains(target)) setIsAddPinOpen(false);
      if (filterRef.current && !filterRef.current.contains(target)) setIsFilterOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Fetch LGU location
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

  // Load placeholder rows
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

  /* ===== Barangay actions ===== */
  const openView = (row: BarangayRow) => {
    setSelectedBarangay(row);
    setIsBrgyViewOpen(true);
  };

  const openEdit = () => {
    setIsBrgyViewOpen(false);
    setIsBrgyEditOpen(true);
  };

  const openDelete = () => {
    setIsBrgyDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedBarangay) return;
    setBarangays((prev) => prev.filter((b) => b.id !== selectedBarangay.id));
    setIsBrgyDeleteOpen(false);
    setIsBrgyViewOpen(false);
    setSelectedBarangay(null);
  };

  const saveEdit = (data: MyBarangay | null) => {
    if (!selectedBarangay || !data) return;
    setBarangays((prev) =>
      prev.map((b) =>
        b.id === selectedBarangay.id ? { ...selectedBarangay, ...data } : b
      )
    );
    // Keep selection fresh and bounce back to View
    setSelectedBarangay((p) => (p ? ({ ...p, ...data }) : p));
    setIsBrgyEditOpen(false);
    setIsBrgyViewOpen(true);
  };

  const createBarangay = (data: MyBarangay | null) => {
    if (!data) return;
    const newRow: BarangayRow = { id: Date.now(), ...data };
    setBarangays((prev) => [newRow, ...prev]);
    setIsBrgyCreateOpen(false);
    setSelectedBarangay(newRow);
    setIsBrgyViewOpen(true);
  };

  /* ===== Filter helpers ===== */
  const applyFilter = (value: "all" | "barangay" | "rafi") => {
    setFilterView(value);
    setIsFilterOpen(false);
  };

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

      {/* === LGU MODALS === */}
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
        prefetch={{ lgu_name: displayName || "", barangay_count: undefined, evacuation_center: "" }}
        onSaved={(updated) => {
          setModalData(updated ?? null);
          setMyLGUEditOpen(false);
          setMyLGUViewOpen(true);
        }}
      />

      {/* === BARANGAY MODALS (yours) === */}
      <BarangayViewModal
        isModalOpen={isBrgyViewOpen}
        closeModal={() => setIsBrgyViewOpen(false)}
        setMessageBox={setMessageBox}
        data={selectedBarangay ?? undefined}
        onOpenEdit={openEdit}
        onOpenDelete={openDelete}  // <-- wired delete from View
      />

      <BarangayEditModal
        isModalOpen={isBrgyEditOpen}
        closeModal={() => {
          setIsBrgyEditOpen(false);
          setIsBrgyViewOpen(true);
        }}
        setMessageBox={setMessageBox}
        data={(selectedBarangay as MyBarangay) || ({} as MyBarangay)}
        onSaved={saveEdit}
        prefetch={{
          nearest_evacuation: selectedBarangay?.nearest_evacuation,
          lat: selectedBarangay?.lat,
          lng: selectedBarangay?.lng,
        }}
      />

      <BarangayCreateModal
        isModalOpen={isBrgyCreateOpen}
        closeModal={() => setIsBrgyCreateOpen(false)}
        setMessageBox={setMessageBox}
        onCreate={createBarangay}
        prefetch={{ nearest_evacuation: "", lat: undefined, lng: undefined }}
      />

     <BarangayDeleteModal
  isModalOpen={isBrgyDeleteOpen}
  closeModal={() => setIsBrgyDeleteOpen(false)}
  setMessageBox={setMessageBox}   // <-- add this
  targetName={selectedBarangay?.barangay_name}
  onConfirm={confirmDelete}
/>

      {/* === HEADER === */}
      <header className="lgu-page-header">
        <h1 className="lgu-page-title">{displayName}</h1>
      </header>

      {/* === SUMMARY CARD === */}
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
            <div className="label">Category</div><div className="value">—</div>
            <div className="label">Mayor</div><div className="value">—</div>
            <div className="label">Population</div><div className="value">—</div>
            <div className="label">No. of Barangays</div><div className="value">{barangays.length}</div>
            <div className="label">DRRM Personnel</div><div className="value">—</div>
            <div className="label">Contact Nos.</div><div className="value">—</div>
          </div>
          <div className="lgu-summary-actions">
            <button
              className="view-lgu-button"
              onClick={() => { setModalData(toModalData()); setMyLGUViewOpen(true); }}
              disabled={!myLGULocation}
            >
              View more
            </button>
          </div>
        </div>
      </div>

      {/* === TOOLS BAR === */}
      <div className="lgu-tools">
        {/* Add Pin */}
        <div className="addpin-dropdown" ref={addPinRef}>
          <button className="btn-pin" onClick={() => setIsAddPinOpen((o) => !o)} aria-haspopup="menu" aria-expanded={isAddPinOpen}>
            + Add Pin <span className="caret">▾</span>
          </button>
          {isAddPinOpen && (
            <div className="addpin-menu" role="menu">
              <button role="menuitem" onClick={() => { setIsAddPinOpen(false); setIsBrgyCreateOpen(true); }}>
                Barangay
              </button>
              <button role="menuitem" onClick={() => { setIsAddPinOpen(false); /* hook RAFI create here */ }}>
                RAFI
              </button>
            </div>
          )}
        </div>

        {/* Filter */}
        <div className="filter-dropdown" ref={filterRef}>
          <button className="btn-pin" onClick={() => setIsFilterOpen((o) => !o)} aria-haspopup="menu" aria-expanded={isFilterOpen}>
            Filter: <strong style={{ marginLeft: 6, marginRight: 6, fontWeight: 800, color: "var(--clr-text)" }}>
              {filterView === "all" ? "All" : filterView === "barangay" ? "Barangay" : "RAFI"}
            </strong>
            <span className="caret">▾</span>
          </button>
          {isFilterOpen && (
            <div className="filter-menu" role="menu">
              <button role="menuitem" onClick={() => applyFilter("all")} aria-pressed={filterView === "all"}>All</button>
              <button role="menuitem" onClick={() => applyFilter("barangay")} aria-pressed={filterView === "barangay"}>Barangay</button>
              <button role="menuitem" onClick={() => applyFilter("rafi")} aria-pressed={filterView === "rafi"}>RAFI</button>
            </div>
          )}
        </div>
      </div>

      {/* === BARANGAY TABLE === */}
      {(filterView === "all" || filterView === "barangay") && (
        <section className="barangay-section">
          <div className="barangay-header"><h2>Barangays</h2></div>
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
                  <tr><td colSpan={5} className="empty-cell">No barangays to display.</td></tr>
                ) : (
                  barangays.map((b) => (
                    <tr key={b.id}>
                      <td>{b.barangay_name}</td>
                      <td>{fmtLL(b.lat, b.lng)}</td>
                      <td>{b.barangay_captain || "—"}</td>
                      <td>{b.nearest_evacuation || "—"}</td>
                      <td className="col-action">
                        <button className="btn-view" onClick={() => openView(b)}>View</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* === RAFI TABLE (unchanged) === */}
      {(filterView === "all" || filterView === "rafi") && (
        <section className="raffi-section" style={{ marginTop: "2rem" }}>
          <div className="raffi-header"><h2>RAFI</h2></div>
          <div className="raffi-table-wrap">
            <table className="barangay-table">
              <thead>
                <tr>
                  <th>RAFI</th><th>Location</th><th>Description</th><th className="col-action">Action</th>
                </tr>
              </thead>
              <tbody>
                {rafis.length === 0 ? (
                  <tr><td colSpan={4} className="empty-cell">No RAFI items to display.</td></tr>
                ) : (
                  rafis.map((r) => (
                    <tr key={r.id}>
                      <td>{r.raffi}</td>
                      <td>{r.location}</td>
                      <td>{r.description}</td>
                      <td className="col-action">
                        <button className="btn-view" onClick={() =>
                          setMessageBox({
                            isOpen: true,
                            type: "message",
                            message: `RAFI: ${r.raffi}\nLocation: ${r.location}\nDescription: ${r.description}`,
                            onClose: () => setMessageBox((p) => ({ ...p, isOpen: false })),
                          })
                        }>
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
