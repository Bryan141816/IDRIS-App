// LGUofficer.tsx
import { useEffect, useMemo, useState } from "react";
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
  // kept for type-compat if you re-enable later
  lgu_name?: string;
};

/* ========================= UTILS ========================= */
const withBase = (maybeUrl?: string | null) => {
  if (!maybeUrl) return null;
  if (/^https?:\/\//i.test(maybeUrl)) return maybeUrl;
  const base = (API.defaults as any)?.baseURL || "";
  return `${String(base).replace(/\/$/, "")}/${String(maybeUrl).replace(/^\//, "")}`;
};

/* ========================= COMPONENT ========================= */
const MapOfCebu = () => {
  // ✅ Officer-scoped LGU modals
  const [myLGUViewOpen, setMyLGUViewOpen] = useState(false);
  const [myLGUEditOpen, setMyLGUEditOpen] = useState(false);

  // ✅ Data shown in the modals (frontend only)
  const [modalData, setModalData] = useState<LGUEditForm | null>(null);

  // ✅ Current user's LGU location (label for header) — this is the ONLY fetch
  const [myLGULocation, setMyLGULocation] = useState<string | null>(null);
  const [loadingLGU, setLoadingLGU] = useState<boolean>(true);

  // ✅ No LGU record anymore
  const [messageBox, setMessageBox] = useState<MessageBoxState>({
    isOpen: false,
    type: "message",
    message: "",
    onSubmit: undefined,
    onClose: () => setMessageBox((prev) => ({ ...prev, isOpen: false })),
  });

  // Fetch only the location label for header
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

  /* ---------- Display fields ---------- */
  const displayName = myLGULocation ?? (loadingLGU ? "Loading..." : "—");
  const displayClass = ""; // left blank on purpose
  const displayMayor = "";
  const displayPopulation: number | null = null;
  const displayBarangays: number | null = null;
  const displayDRRM = "";
  const displayContact = "";

  /* ---------- Image (no LGU seal -> default) ---------- */
  const lguImageSrc = useMemo(() => defaultpicture, []);

  /* ---------- Modal data (use only location for name) ---------- */
  function toModalData(): LGUEditForm {
    return {
      // LGU info
      lgu_name: myLGULocation ?? "",
      classification: "",
      lgu_seal: undefined,
      population: "",
      barangay_count: "",
      mayor: "",
      contact: "",

      // DRP
      major_hazard: [],
      hazard_picture: "",

      // DRRMO
      drmm_personnel: "",
      drmm_contact: "",
      evacuation_center: "",

      critical_facilities: [],

      // Vulnerable pop
      pwd: "",
      senior: "",
      children: "",
    };
  }

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

      {/* Page header (outside the card) */}
      <header className="lgu-page-header">
        <h1 className="lgu-page-title">{displayName}</h1>
        {displayClass && <div className="lgu-page-sub">{displayClass}</div>}
      </header>

      {/* Summary Card */}
      <div className="lgu-summary-card">
        {/* Left: LGU Seal */}
        <div className="lgu-summary-left">
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

        {/* Spacer (center column removed in CSS, but kept safe) */}
        <div className="lgu-summary-center" />

        {/* Right: Facts table + View more */}
        <div className="lgu-summary-right">
          <div className="lgu-summary-grid">
            <div className="label">Category</div>
            <div className="value">—</div>

            <div className="label">Mayor</div>
            <div className="value">—</div>

            <div className="label">Population</div>
            <div className="value">—</div>

            <div className="label">No. of Barangays</div>
            <div className="value">—</div>

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
              disabled={!myLGULocation} // optional: disable if no location yet
            >
              View more
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapOfCebu;
