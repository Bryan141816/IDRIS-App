// LGUofficer.tsx
import { useEffect, useMemo, useState } from "react";
import "../css/LGUofficermanagement.css";
import "../../response_dashboard/DefaultListViewStyle.scss";
import { API } from "../../../API_Handler/Axio_API_Handler";
import defaultpicture from "../../../../public/images/defaultpicture.jpg";
import {
  getMyLGULocation,
  getLGURecordByName,
} from "../../../API_Handler/lguprofiling/LGUofficer";

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

// Compatible with both old & new API payloads
export type LGURecord = {
  // old
  id?: number;
  name?: string;
  classification?: string;
  contact_info?: string;
  lgu_picture?: string | null;

  // new (snake_case)
  lgu_id?: number;
  lgu_name?: string;
  lgu_classification?: string;
  lgu_contact?: string | null;
  lgu_seal?: string | null;
  mayor?: string | null;

  // optional extras
  description?: string | null;
  resources?: string[] | null;
  players?: string[] | null;
  schools?: string[] | null;
  gyms?: string[] | null;
  local_suppliers?: string[] | null;

  // sometimes present
  population?: number;
  barangays?: any[];
  DRMMpersonel?: string | null;
};

/* ========================= UTILS ========================= */
const withBase = (maybeUrl?: string | null) => {
  if (!maybeUrl) return null;
  if (/^https?:\/\//i.test(maybeUrl)) return maybeUrl;
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
  // ✅ Officer-scoped LGU modals
  const [myLGUViewOpen, setMyLGUViewOpen] = useState(false);
  const [myLGUEditOpen, setMyLGUEditOpen] = useState(false);

  // ✅ Data shown in the modals (frontend only)
  const [modalData, setModalData] = useState<LGUEditForm | null>(null);

  // ✅ Current user's LGU location (label for header)
  const [myLGULocation, setMyLGULocation] = useState<string | null>(null);
  const [loadingLGU, setLoadingLGU] = useState<boolean>(true);

  // ✅ The full LGU record
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
      if (loadingLGU) return;

      setLoadingLGURecord(true);
      try {
        const mine = await getMyLGURecord();
        if (mine) {
          setMyLGURecord(mine);
          return;
        }
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

  const [messageBox, setMessageBox] = useState<MessageBoxState>({
    isOpen: false,
    type: "message",
    message: "",
    onSubmit: undefined,
    onClose: () => setMessageBox((prev) => ({ ...prev, isOpen: false })),
  });

  /* ---------- Derived display fields (handles both schemas) ---------- */
  const displayName =
    myLGURecord?.lgu_name ??
    myLGURecord?.name ??
    (loadingLGU ? "Loading..." : "—");

  const displayClass =
    myLGURecord?.lgu_classification ??
    myLGURecord?.classification ??
    "";

  const displayMayor = myLGURecord?.mayor ?? "";

  const displayPopulation =
    typeof (myLGURecord as any)?.population === "number"
      ? (myLGURecord as any).population
      : null;

  const displayBarangays = Array.isArray((myLGURecord as any)?.barangays)
    ? (myLGURecord as any).barangays.length
    : null;

  const displayDRRM = (myLGURecord as any)?.DRMMpersonel ?? "";

  const displayContact =
    (myLGURecord?.lgu_contact as string | null) ??
    (myLGURecord?.contact_info as string | null) ??
    "";

  /* ---------- Image (prefer lgu_seal, fallback to old lgu_picture, then default) ---------- */
  const lguImageSrc = useMemo(() => {
    const url =
      withBase(myLGURecord?.lgu_seal) ||
      withBase(myLGURecord?.lgu_picture);
    return url || defaultpicture;
  }, [myLGURecord?.lgu_seal, myLGURecord?.lgu_picture]);

  /* ---------- Map card data -> modal shape ---------- */
  function toModalData(rec: LGURecord | null): LGUEditForm {
    return {
      // LGU info
      lgu_name: rec?.lgu_name ?? rec?.name ?? "",
      classification: ((rec?.lgu_classification ?? rec?.classification) as any) || "",
      lgu_seal: withBase(rec?.lgu_seal ?? rec?.lgu_picture) ?? undefined,
      population: (rec as any)?.population ?? "",
      barangay_count: Array.isArray((rec as any)?.barangays) ? (rec as any).barangays.length : "",
      mayor: rec?.mayor ?? "",
      contact: (rec?.lgu_contact ?? rec?.contact_info) ?? "",

      // DRP
      major_hazard: [],
      hazard_picture: "",

      // DRRMO
      drmm_personnel: (rec as any)?.DRMMpersonel ?? "",
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
          barangay_count: displayBarangays ?? undefined,
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
            <div className="value">{displayClass || "—"}</div>

            <div className="label">Mayor</div>
            <div className="value">{displayMayor || "—"}</div>

            <div className="label">Population</div>
            <div className="value">
              {displayPopulation != null ? displayPopulation.toLocaleString() : "—"}
            </div>

            <div className="label">No. of Barangays</div>
            <div className="value">{displayBarangays != null ? displayBarangays : "—"}</div>

            <div className="label">DRRM Personnel</div>
            <div className="value">{displayDRRM || "—"}</div>

            <div className="label">Contact Nos.</div>
            <div className="value">{displayContact || "—"}</div>
          </div>

          <div className="lgu-summary-actions">
            <button
              className="view-lgu-button"
              onClick={() => {
                setModalData(toModalData(myLGURecord));
                setMyLGUViewOpen(true);
              }}
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
