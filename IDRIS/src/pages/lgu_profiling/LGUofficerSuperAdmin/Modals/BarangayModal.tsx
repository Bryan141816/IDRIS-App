
import React, { useMemo, useState } from "react";
import { Modal } from "../../../../components/Page_Furniture/Modals";
import type { BaseModalProps } from "../ModalProps";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLock,
  faMapMarkerAlt,
  faTriangleExclamation,
  faImage,
} from "@fortawesome/free-solid-svg-icons";
import LocationPickerModal from "../../../../components/Page_Furniture/LocationPickerModal";
import { MapViewWithSearch } from "../../../procurement_inventory/procurement_inventory/Tabs/MapViewWithSearch";
import defaultPicture from "../../../../../public/images/defaultpicture.jpg";
import "../../css/LGUModal.css";
import type { BarangaySummary } from "../../../../API_Handler/lguprofiling/SuperAdminLGU";
import Swal from "sweetalert2";

/* ===============================================================
   Types
================================================================*/
export type HazardOption =
  | "Typhoon"
  | "Flood"
  | "Earthquake"
  | "Fire"
  | "Landslide";

export interface Barangay {
  id?: number;
  name: string;
  lat?: number | null;
  lng?: number | null;
  total_population?: number | null;
  household_count?: number | null;
  barangay_captain?: string | null;
  contact_info?: string | null; // Ex: 09XXXXXXXXX
  baranggay_pic?: string | null; // data URL or http

  // Disaster profile
  common_hazards?: HazardOption[];
  evacucation_center?: { id?: number; name: string } | null;

  // Vulnerable groups
  barangay_pwd?: number | null;
  barangay_senior?: number | null;
  barangay_children?: number | null;
}

/* ===============================================================
   Helpers
================================================================*/
const is11Digits = (v?: string | null) => !!v && /^\d{11}$/.test(v);
const fmtNum = (v?: number | null) => (v == null ? "—" : Number(v).toLocaleString());
function fmtLL(lat?: number | null, lng?: number | null) {
  if (lat == null || lng == null) return "—";
  const f = (n: number) => Number(n).toFixed(6);
  return `${f(lat)}, ${f(lng)}`;
}
const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });

/* ===============================================================
   VIEW MODAL (read-only)
================================================================*/
type ViewProps = {
  isOpen?: boolean;
  onClose: () => void;
  data: BarangaySummary | null;
  loading?: boolean;
  error?: string | null;
};

export const BarangayViewModal: React.FC<ViewProps> = ({
  isOpen = true,
  onClose,
  data,
  loading,
  error,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      zIndex={998}
      width="clamp(560px,56vw,840px)"
      height="86vh"
    >
      <div className="modal-container lgu-modal">
        <div className="horizontal-container">
          <span className="title-modal-text">Barangay Information</span>
        </div>

        <div className="lgu-scroll">
          {loading ? (
            <div style={{ padding: 16 }}>Loading…</div>
          ) : error ? (
            <div style={{ padding: 16, color: "#b91c1c" }}>{error}</div>
          ) : !data ? (
            <div style={{ padding: 16 }}>No data.</div>
          ) : (
            <>
              <Section title="Barangay Information Details">
                <DL label="Barangay Name" value={data.name || "—"} />
                <DL label="Location (Lat, Lng)" value={fmtLL(data.lat, data.lng)} />
                <DL label="Total Population" value={fmtNum(data.total_population)} />
                <DL label="Number of Households" value={fmtNum(data.household_count)} />
                <DL label="Barangay Captain" value={data.barangay_captain || "—"} />
                <DL
                  label="Contact Number"
                  value={data.contact_info || "—"}
                  invalid={!!data.contact_info && !is11Digits(data.contact_info)}
                />
              </Section>

              <Section title="Disaster Risk Profile">
                <DL
                  label="Common Hazards"
                  value={data.common_hazards?.join(", ") || "—"}
                />
              </Section>

              <Section title="Vulnerable Groups">
                <DL label="PWD" value={fmtNum(data.barangay_pwd)} />
                <DL label="Senior" value={fmtNum(data.barangay_senior)} />
                <DL label="Children" value={fmtNum(data.barangay_children)} />
              </Section>

              <Section title="Barangay Seal">
                <div className="lgu-media-row">
                  <ImgOrPlaceholder
                    label="Barangay Seal"
                    src={data.baranggay_pic || defaultPicture}
                  />
                </div>
              </Section>
            </>
          )}
        </div>

        <div className="action-button">
          <button
  style={{ background: "rgb(248, 75, 77)", color: "rgb(255, 255, 255)" }}
  onClick={onClose}
>
  Close
</button>

        </div>
      </div>
    </Modal>
  );
};

/* ===============================================================
   EDIT MODAL (frontend-only; emits onSaved)
================================================================*/
type EditProps = {
  isOpen?: boolean;
  onClose: () => void;
  data: Barangay; // initial snapshot
  lgu_name: string;
  lgu_coordinate: [number, number];
  onSaved?: (updated: Barangay) => void; // parent will persist
};

export const BarangayEditModal: React.FC<EditProps> = ({
  isOpen = true,
  onClose,
  data,
  lgu_name,
  lgu_coordinate,
  onSaved,
}) => {
  const [form, setForm] = useState<Barangay>({ ...data });
  const [locationPickerIsOpen, setLocationPickerIsOpen] = useState(false);

  const hazards = useMemo<readonly HazardOption[]>(
    () => ["Typhoon", "Flood", "Earthquake", "Fire", "Landslide"],
    []
  );

  // Validation flags
  const [validation, setValidation] = useState<Record<string, boolean>>({});

  const openLocationPicker = () => setLocationPickerIsOpen(true);
  const closeLocationPicker = () => setLocationPickerIsOpen(false);

  const onLocationSelectSubmit = (address: string, coordinates: [number, number]) => {
    setForm((prev) => ({ ...prev, lat: coordinates[0], lng: coordinates[1] }));
  };

  const onImage =
    (key: keyof Barangay) => async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const url = await readAsDataUrl(file);
        setForm((prev) => ({ ...prev, [key]: url as string }));
      } catch (err) {
        console.error("Failed to read image file:", err);
      }
    };

  const handleContactChange = (value: string) => {
    const cleaned = value.replace(/[^\d]/g, "");
    setForm((prev) => ({ ...prev, contact_info: cleaned }));
  };

  const toggleHazard = (val: HazardOption) => {
    setForm((prev) => {
      const next = new Set(prev.common_hazards || []);
      next.has(val) ? next.delete(val) : next.add(val);
      return { ...prev, common_hazards: Array.from(next) };
    });
  };

  const validateForm = () => {
    const v: Record<string, boolean> = {};
    v.name = !form.name?.trim();
    v.lat = form.lat == null;
    v.lng = form.lng == null;
    v.total_population = form.total_population == null;
    v.household_count = form.household_count == null;
    v.barangay_captain = !form.barangay_captain?.trim();
    v.contact_info = !form.contact_info?.trim() || !is11Digits(form.contact_info);
    v.common_hazards =
      !Array.isArray(form.common_hazards) || form.common_hazards.length === 0;
    v.barangay_pwd = form.barangay_pwd == null;
    v.barangay_senior = form.barangay_senior == null;
    v.barangay_children = form.barangay_children == null;
    setValidation(v);
    return !Object.values(v).some(Boolean);
  };
// inside BarangayEditModal
const handleSave = () => {
  if (!validateForm()) {
    Swal.fire({
      icon: "warning",
      title: "Incomplete Fields",
      text: "Please complete all required fields. Fields with red highlight need attention.",
      confirmButtonColor: "#3B82F6",
    });
    return;
  }
  onSaved?.({ ...form }); // parent does API + alerts + close
};


  return (
    <>
      {locationPickerIsOpen && (
        <MapViewWithSearch
          onClose={closeLocationPicker}
          defaultValue={{
            address: `${form.name}`,
            coordinates: [form.lat ?? -1000000, form.lng ?? -1000000],
          }}
          onSubmit={onLocationSelectSubmit}
          changeAddressOnclik={false}
          customCenter={lgu_coordinate}
        />
      )}

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        zIndex={998}
        width="clamp(560px,56vw,840px)"
        height="86vh"
      >
        <div className="modal-container lgu-modal">
          <div className="horizontal-container">
            <span className="details-title">Edit Barangay</span>
          </div>

          <div className="lgu-scroll">
            <Section title="Barangay Information Details">
              <Row label="Barangay Name">
                <input type="text" value={form.name} disabled />
              </Row>

              <Row label="Location">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    gap: 8,
                  }}
                >
                  <input
                    type="text"
                    readOnly
                    placeholder="Pick on map"
                    value={
                      form.lat != null && form.lng != null
                        ? `${form.lat}, ${form.lng}`
                        : ""
                    }
                    style={{ flex: 1 }}
                  />

                  <button
                    type="button"
                    onClick={openLocationPicker}
                    title="Pick location on map"
                    style={pinBtnStyle}
                  >
                    <FontAwesomeIcon icon={faMapMarkerAlt} />
                  </button>
                </div>
              </Row>

              <Row label="Barangay Seal">
                <label className="filelike">
                  <FontAwesomeIcon icon={faImage} />
                  <span>Choose image</span>
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={onImage("baranggay_pic")}
                  />
                </label>
                {form.baranggay_pic && (
                  <img
                    src={form.baranggay_pic}
                    alt="baranggay_pic"
                    className="img-thumb"
                  />
                )}
              </Row>

              <Row label="Total Population">
                <input
                  type="number"
                  min={0}
                  value={form.total_population ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      total_population:
                        e.target.value === "" ? null : Number(e.target.value),
                    }))
                  }
                  className={validation.total_population ? "input-invalid" : ""}
                />
              </Row>

              <Row label="Number of Households">
                <input
                  type="number"
                  min={0}
                  value={form.household_count ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      household_count:
                        e.target.value === "" ? null : Number(e.target.value),
                    }))
                  }
                  className={validation.household_count ? "input-invalid" : ""}
                />
              </Row>

              <Row label="Barangay Captain">
                <input
                  type="text"
                  value={form.barangay_captain ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, barangay_captain: e.target.value }))
                  }
                  className={validation.barangay_captain ? "input-invalid" : ""}
                />
              </Row>

              <Row label="Contact Number" hint="11 digits">
                <input
                  type="tel"
                  value={form.contact_info ?? ""}
                  placeholder="09XXXXXXXXX"
                  onChange={(e) => handleContactChange(e.target.value)}
                  className={validation.contact_info ? "input-invalid" : ""}
                />
              </Row>
            </Section>

            <Section title="Disaster Risk Profile">
              <Row label="Common Hazards">
                <CheckGroup
                  options={hazards}
                  selected={form.common_hazards || []}
                  onToggle={toggleHazard}
                  columns={3}
                />
              </Row>
            </Section>

            <Section title="Vulnerable Groups">
              <Row label="PWD">
                <input
                  type="number"
                  min={0}
                  value={form.barangay_pwd ?? ""}
                  placeholder="0"
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      barangay_pwd:
                        e.target.value === "" ? null : Number(e.target.value),
                    }))
                  }
                  className={validation.barangay_pwd ? "input-invalid" : ""}
                />
              </Row>
              <Row label="Senior">
                <input
                  type="number"
                  min={0}
                  value={form.barangay_senior ?? ""}
                  placeholder="0"
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      barangay_senior:
                        e.target.value === "" ? null : Number(e.target.value),
                    }))
                  }
                  className={validation.barangay_senior ? "input-invalid" : ""}
                />
              </Row>
              <Row label="Children">
                <input
                  type="number"
                  min={0}
                  value={form.barangay_children ?? ""}
                  placeholder="0"
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      barangay_children:
                        e.target.value === "" ? null : Number(e.target.value),
                    }))
                  }
                  className={validation.barangay_children ? "input-invalid" : ""}
                />
              </Row>
            </Section>
          </div>

          <div className="action-button">
            <button style={{ background: "#749AB6", color: "#fff" }} onClick={handleSave}>
              Save
            </button>
            <button style={{ background: "#F84B4D", color: "#fff" }} onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

/* ===============================================================
   Presentational building blocks
================================================================*/
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="section-block" style={{ marginTop: 12 }}>
      <h3 className="section-title" style={{ marginBottom: 8 }}>
        {title}
      </h3>
      <div className="lgu-modal-form">{children}</div>
    </div>
  );
}

function Row({
  label,
  children,
  locked,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  locked?: boolean;
  hint?: string;
}) {
  return (
    <div className="lgu-row">
      <div className="item-details-identifier" style={{ fontWeight: 700 }}>
        {label}
        {hint ? ` — ${hint}` : ""}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{children}</div>
      {locked ? <LockIcon /> : <span />}
    </div>
  );
}

function DL({
  label,
  value,
  locked,
  invalid,
}: {
  label: string;
  value: React.ReactNode;
  locked?: boolean;
  invalid?: boolean;
}) {
  return (
    <div className="lgu-row" style={{ padding: "4px 0" }}>
      <div className="item-details-identifier" style={{ fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ color: invalid ? "#b91c1c" : "#111827" }}>{value}</div>
      {locked ? <LockIcon /> : <span />}
    </div>
  );
}

function ImgOrPlaceholder({ label, src }: { label: string; src?: string | null }) {
  const hasImg = !!src;
  return (
    <div className="lgu-media">
      <div className="item-details-identifier" style={{ marginBottom: 6 }}>
        {label}
      </div>
      {hasImg ? (
        <img src={src!} alt={label} className="img-thumb" />
      ) : (
        <div className="img-placeholder">No image</div>
      )}
    </div>
  );
}

function CheckGroup<T extends string>({
  options,
  selected,
  onToggle,
  columns = 3,
}: {
  options: readonly T[];
  selected: readonly T[];
  onToggle: (v: T) => void;
  columns?: number;
}) {
  return (
    <div
      className="lgu-checkgrid"
      style={{ "--cols": String(columns) } as React.CSSProperties}
    >
      {options.map((opt) => {
        const id = `chk_${String(opt).replace(/\s+/g, "_")}`;
        const checked = selected?.includes(opt);
        return (
          <label key={id} htmlFor={id} className="lgu-check">
            <input
              id={id}
              type="checkbox"
              checked={!!checked}
              onChange={() => onToggle(opt)}
            />
            <span className="lgu-check-text">{opt}</span>
          </label>
        );
      })}
    </div>
  );
}

function LockIcon() {
  return (
    <span title="Prefetched and locked">
      <FontAwesomeIcon icon={faLock} style={{ color: "#64748b" }} />
    </span>
  );
}

const pinBtnStyle: React.CSSProperties = {
  backgroundColor: "transparent",
  border: "1px solid  #ddd",
  outline: "none",
  color: "#3b82f6",
  width: 44,
  height: 44,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 6,
  cursor: "pointer",
};
