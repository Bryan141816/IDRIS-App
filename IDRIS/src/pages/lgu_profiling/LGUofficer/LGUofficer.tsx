// RAFFIInfrastructure.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import "../css/LGUofficermanagement.css";
import "../../response_dashboard/DefaultListViewStyle.scss";
import { API } from "../../../API_Handler/Axio_API_Handler";
import defaultpicture from "../../../../public/images/defaultpicture.jpg";
import { getMyLGULocation } from "../../../API_Handler/lguprofiling/LGUofficer";
import { MessageBox } from "../../../components/Page_Furniture/MessageBox";

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
    lat: 10.3150,
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
const LGUofficer = () => {
  // LGU modals
  const [myLGUViewOpen, setMyLGUViewOpen] = useState(false);
  const [myLGUEditOpen, setMyLGUEditOpen] = useState(false);
  const [modalData, setModalData] = useState<LGUEditForm | null>(null);

  // LGU info
  const [myLGULocation, setMyLGULocation] = useState<string | null>(null);
  const [loadingLGU, setLoadingLGU] = useState<boolean>(true);

  // Tables
  const [barangays, setBarangays] = useState<BarangayRow[]>([]);
  const [raffis, setRAFFIs] = useState<RAFFIRow[]>([]);

  // Barangay modal state
  const [selectedBarangay, setSelectedBarangay] = useState<BarangayRow | null>(null);
  const [isBrgyViewOpen, setIsBrgyViewOpen] = useState(false);
  const [isBrgyEditOpen, setIsBrgyEditOpen] = useState(false);
  const [isBrgyCreateOpen, setIsBrgyCreateOpen] = useState(false);
  const [isBrgyDeleteOpen, setIsBrgyDeleteOpen] = useState(false);

  // RAFFI modal state
  const [selectedRAFFI, setSelectedRAFFI] = useState<RAFFIRow | null>(null);
  const [isRAFFIViewOpen, setIsRAFFIViewOpen] = useState(false);
  const [isRAFFIEditOpen, setIsRAFFIEditOpen] = useState(false);
  const [isRAFFICreateOpen, setIsRAFFICreateOpen] = useState(false);
  const [isRAFFIDeleteOpen, setIsRAFFIDeleteOpen] = useState(false);

  // Filters
  const [filterView, setFilterView] = useState<"all" | "barangay" | "raffi">("all");

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
    setRAFFIs(sampleRAFFIs);
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
  const openBrgyView = (row: BarangayRow) => {
    setSelectedBarangay(row);
    setIsBrgyViewOpen(true);
  };
  const openBrgyEdit = () => {
    setIsBrgyViewOpen(false);
    setIsBrgyEditOpen(true);
  };
  const openBrgyDelete = () => {
    setIsBrgyDeleteOpen(true);
  };
  const confirmBrgyDelete = () => {
    if (!selectedBarangay) return;
    setBarangays((prev) => prev.filter((b) => b.id !== selectedBarangay.id));
    setIsBrgyDeleteOpen(false);
    setIsBrgyViewOpen(false);
    setSelectedBarangay(null);
  };
  const saveBrgyEdit = (data: MyBarangay | null) => {
    if (!selectedBarangay || !data) return;
    setBarangays((prev) =>
      prev.map((b) => (b.id === selectedBarangay.id ? { ...selectedBarangay, ...data } : b))
    );
    setSelectedBarangay((p) => (p ? { ...p, ...data } : p));
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

  /* ===== RAFFI actions ===== */
  const openRAFFIView = (row: RAFFIRow) => {
    setSelectedRAFFI(row);
    setIsRAFFIViewOpen(true);
  };
  const openRAFFIEdit = () => {
    setIsRAFFIViewOpen(false);
    setIsRAFFIEditOpen(true);
  };
  const openRAFFIDelete = () => {
    setIsRAFFIDeleteOpen(true);
  };
  const confirmRAFFIDelete = () => {
    if (!selectedRAFFI) return;
    setRAFFIs((prev) => prev.filter((r) => r.id !== selectedRAFFI.id));
    setIsRAFFIDeleteOpen(false);
    setIsRAFFIViewOpen(false);
    setSelectedRAFFI(null);
  };
  const saveRAFFIEdit = (data: RAFFIRecord | null) => {
    if (!selectedRAFFI || !data) return;
    setRAFFIs((prev) =>
      prev.map((r) => (r.id === selectedRAFFI.id ? { ...selectedRAFFI, ...data } : r))
    );
    setSelectedRAFFI((p) => (p ? { ...p, ...data } : p));
    setIsRAFFIEditOpen(false);
    setIsRAFFIViewOpen(true);
  };
  const createRAFFI = (data: RAFFIRecord | null) => {
    if (!data) return;
    const newRow: RAFFIRow = { id: Date.now(), ...data };
    setRAFFIs((prev) => [newRow, ...prev]);
    setIsRAFFICreateOpen(false);
    setSelectedRAFFI(newRow);
    setIsRAFFIViewOpen(true);
  };

  /* ===== Filter helpers ===== */
  const applyFilter = (value: "all" | "barangay" | "raffi") => {
    setFilterView(value);
    setIsFilterOpen(false);
  };

  const showBarangay = filterView === "all" || filterView === "barangay";
  const showRAFFI = filterView === "all" || filterView === "raffi";

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

      {/* === BARANGAY MODALS === */}
      <BarangayViewModal
        isModalOpen={isBrgyViewOpen}
        closeModal={() => setIsBrgyViewOpen(false)}
        setMessageBox={setMessageBox}
        data={selectedBarangay ?? undefined}
        onOpenEdit={openBrgyEdit}
        onOpenDelete={openBrgyDelete}
      />
      <BarangayEditModal
        isModalOpen={isBrgyEditOpen}
        closeModal={() => {
          setIsBrgyEditOpen(false);
          setIsBrgyViewOpen(true);
        }}
        setMessageBox={setMessageBox}
        data={(selectedBarangay as MyBarangay) || ({} as MyBarangay)}
        onSaved={saveBrgyEdit}
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
        setMessageBox={setMessageBox}
        targetName={selectedBarangay?.barangay_name}
        onConfirm={confirmBrgyDelete}
      />

      {/* === RAFFI MODALS === */}
      <RAFFIViewModal
        isModalOpen={isRAFFIViewOpen}
        closeModal={() => setIsRAFFIViewOpen(false)}
        data={selectedRAFFI ?? undefined}
        onOpenEdit={openRAFFIEdit}
        onOpenDelete={openRAFFIDelete}
  setMessageBox={setMessageBox}  
      />
      <RAFFIEditModal
        isModalOpen={isRAFFIEditOpen}
        closeModal={() => {
          setIsRAFFIEditOpen(false);
          setIsRAFFIViewOpen(true);
        }}
        setMessageBox={setMessageBox}
        data={(selectedRAFFI as RAFFIRecord) || ({} as RAFFIRecord)}
        onSaved={saveRAFFIEdit}
      />
      <RAFFICreateModal
        isModalOpen={isRAFFICreateOpen}
        closeModal={() => setIsRAFFICreateOpen(false)}
        setMessageBox={setMessageBox}
        onCreate={createRAFFI}
        prefill={{ lat: undefined, lng: undefined }}
      />
      <RAFFIDeleteModal
        isModalOpen={isRAFFIDeleteOpen}
        closeModal={() => setIsRAFFIDeleteOpen(false)}
        targetName={selectedRAFFI?.raffi_name}
        onConfirm={confirmRAFFIDelete}
  setMessageBox={setMessageBox}  
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
              <button
                role="menuitem"
                onClick={() => {
                  setIsAddPinOpen(false);
                  setIsBrgyCreateOpen(true);
                }}
              >
                Barangay
              </button>
              <button
                role="menuitem"
                onClick={() => {
                  setIsAddPinOpen(false);
                  setIsRAFFICreateOpen(true); // <-- RAFFI create here
                }}
              >
                RAFFI
              </button>
            </div>
          )}
        </div>

        {/* Filter */}
        <div className="filter-dropdown" ref={filterRef}>
          <button
            className="btn-pin"
            onClick={() => setIsFilterOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={isFilterOpen}
          >
            Filter:{" "}
            <strong
              style={{ marginLeft: 6, marginRight: 6, fontWeight: 800, color: "var(--clr-text)" }}
            >
              {filterView === "all" ? "All" : filterView === "barangay" ? "Barangay" : "RAFFI"}
            </strong>
            <span className="caret">▾</span>
          </button>
          {isFilterOpen && (
            <div className="filter-menu" role="menu">
              <button role="menuitem" onClick={() => applyFilter("all")} aria-pressed={filterView === "all"}>
                All
              </button>
              <button role="menuitem" onClick={() => applyFilter("barangay")} aria-pressed={filterView === "barangay"}>
                Barangay
              </button>
              <button role="menuitem" onClick={() => applyFilter("raffi")} aria-pressed={filterView === "raffi"}>
                RAFFI
              </button>
            </div>
          )}
        </div>
      </div>

      {/* === BARANGAY TABLE === */}
      {showBarangay && (
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
                        <button className="btn-view" onClick={() => openBrgyView(b)}>View</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* === RAFFI TABLE === */}
      {showRAFFI && (
        <section className="raffi-section" style={{ marginTop: "2rem" }}>
          <div className="raffi-header"><h2>RAFFI</h2></div>
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
                {raffis.length === 0 ? (
                  <tr><td colSpan={4} className="empty-cell">No RAFFI items to display.</td></tr>
                ) : (
                  raffis.map((r) => (
                    <tr key={r.id}>
                      <td>{r.raffi_name}</td>
                      <td>{fmtLL(r.lat, r.lng)}</td>
                      <td>{r.raffi_description || "—"}</td>
                      <td className="col-action">
                        <button className="btn-view" onClick={() => openRAFFIView(r)}>
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
export default LGUofficer;

