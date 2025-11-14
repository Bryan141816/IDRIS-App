//  Modals.tsx (frontend-only modal; no backend calls)
import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "../../../../components/Page_Furniture/Modals";
import type { BaseModalProps } from "../ModalProps";
import LocationPickerModal from "../../../../components/Page_Furniture/LocationPickerModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faImage,
  faLock,
  faMapMarkerAlt,
} from "@fortawesome/free-solid-svg-icons";
import "../../css/LGUModal.css";
import Swal from "sweetalert2";
import defaultpicture from "../../../../../public/images/defaultpicture.jpg";
export interface LGUOut {
  id: number;
  lgu_name: string;
  lgu_seal?: string | null;
  lgu_classification: string;
  lat?: number | null;
  lng?: number | null;
  population?: number | null;
  mayor?: string | null;
  lgu_contact?: string | null;
  lgu_majorHazard?: string[] | null;
  DRMMpersonel?: string | null;
  DRMM_contact?: string | null;
  hazard_pic?: string | null;
  lgu_critical_facility?: string[] | null;
  lgu_pwd?: number | null;
  lgu_senior?: number | null;
  lgu_children?: number | null;
  baranggay_count?: number | null;
}
import { MapViewWithSearch } from "../../../procurement_inventory/procurement_inventory/Tabs/MapViewWithSearch";
import { API } from "../../../../API_Handler/Axio_API_Handler";
/* ========= Types ========= */
export type LGUEditForm = {
  // LGU information Details
  lgu_name: string; // locked (prefetch)
  classification: "Municipality" | "City" | "";
  lgu_seal?: string; // dataUrl preview
  population?: number | "";
  barangay_count?: number | ""; // locked (prefetch)
  mayor?: string;
  contact?: string; // 11 digits

  // Coordinates
  lat?: number;
  lng?: number;

  // Disaster Risk Profile
  major_hazard: Array<
    "Typhoon" | "Flood" | "Earthquake" | "Fire" | "Landslide"
  >;
  hazard_picture?: string; // dataUrl preview

  // DRRMO
  drmm_personnel?: string;
  DRMM_contact?: string; // 11 digits
  evacuation_center?: string; // locked (prefetch text)
  critical_facilities: Array<
    | "Municipal Hall"
    | "Barangay Hall"
    | "Hospital/Health Center"
    | "Evacuation Center"
    | "Police Station"
    | "Fire Station"
    | "School"
  >;

  // Vulnerable Population
  pwd?: number | "";
  senior?: number | "";
  children?: number | "";
};

export type MyLGU = LGUEditForm;

/* ========= Helpers ========= */
const is11Digits = (v?: string) => !!v && /^[0-9]{11}$/.test(v);
const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });

function fmtNum(v?: number | "" | null) {
  if (v === "" || v == null || Number.isNaN(v as number)) return "—";
  try {
    return Number(v).toLocaleString();
  } catch {
    return String(v);
  }
}

function fmtLL(lat?: number | "" | null, lng?: number | "" | null) {
  if (lat === "" || lng === "" || lat == null || lng == null) return "—";
  const f = (n: number) => Number(n).toFixed(6);
  return `${f(Number(lat))}, ${f(Number(lng))}`;
}

/* =========================================================================
   VIEW
===========================================================================*/

type ViewProps = {
  closeModal: () => void;

  data: LGUOut;
  onOpenEdit?: () => void;
};

export const MyLGUViewModal: React.FC<ViewProps> = ({
  closeModal,
  onOpenEdit,
  data,
}) => {
  const d = data;

  return (
    <Modal
      isOpen={true}
      onClose={closeModal}
      zIndex={998}
      width="clamp(560px, 56vw, 840px)"
      height="86vh"
    >
      <div className="modal-container lgu-modal">
        <div className="horizontal-container">
          <span className="title-modal-text">LGU Information</span>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="lgu-scroll">
          {!d ? (
            <div style={{ padding: 12, color: "#6b7280" }}>
              No data yet. Click <b>Edit</b> to fill this in.
            </div>
          ) : (
            <>
              <Section title="LGU information Details">
                <DL label="LGU Name" value={d.lgu_name || "—"} locked />
                <DL
                  label="Classification"
                  value={d.lgu_classification || "—"}
                />
                <DL label="Total Population" value={fmtNum(d.population)} />
                <DL
                  label="No. of Barangay"
                  value={fmtNum(d.baranggay_count)}
                  locked
                />
                <DL label="Mayor" value={d.mayor || "—"} />
                <DL label="Coordinates" value={fmtLL(d.lat, d.lng)} />
                {/* moved images out of this section */}
              </Section>

              <Section title="Disaster Risk Profile">
                <DL
                  label="Major Hazard"
                  value={d.lgu_majorHazard?.join(", ") || "—"}
                />
                {/* moved image out of this section */}
              </Section>

              <Section title="Disaster Risk Reduction & Management Office">
                <DL
                  label="DRMM local personnel"
                  value={d.DRMMpersonel || "—"}
                />

                <DL
                  label="DRMM contact"
                  value={d.DRMM_contact || "—"}
                  invalid={!!d.DRMM_contact && !is11Digits(d.DRMM_contact)}
                />
                <DL
                  label="Critical Facilities"
                  value={d.lgu_critical_facility?.join(", ") || "—"}
                />
              </Section>

              <Section title="Vulnerable Population">
                <DL label="PWD" value={fmtNum(d.lgu_pwd)} />
                <DL label="Senior Citizen" value={fmtNum(d.lgu_senior)} />
                <DL label="Children" value={fmtNum(d.lgu_children)} />
              </Section>

              {/* --- NEW: Images at the very bottom --- */}
              <Section title="Images">
                <div className="lgu-media-row">
                  <ImgOrPlaceholder
                    label="LGU Seal"
                    src={d.lgu_seal ? d.lgu_seal : defaultpicture}
                  />
                  <ImgOrPlaceholder
                    label="Hazard Picture"
                    src={d.hazard_pic ? d.hazard_pic : defaultpicture}
                  />
                </div>
              </Section>
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="action-button">
          <button
            style={{ backgroundColor: "#749AB6", color: "#fff" }}
            onClick={onOpenEdit}
          >
            Edit
          </button>
          <button
            style={{ backgroundColor: "#F84B4D", color: "#fff" }}
            onClick={closeModal}
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export const MyLGUEditModal: React.FC<
  ViewProps & { onSaved?: () => void } // 👈 new optional callback
> = ({ closeModal, data, onSaved }) => {
  // ===== state =====
  const defaultForm: LGUOut = {
    id: 0,
    lgu_name: "",
    lat: -1000000,
    lng: -1000000,
    lgu_classification: "",
    lgu_seal: "",
    population: 0,
    mayor: "",
    DRMMpersonel: "",
    DRMM_contact: "",
    lgu_pwd: 0,
    lgu_senior: 0,
    lgu_children: 0,
    hazard_pic: "",
    lgu_majorHazard: [],
  };
  const [form, setForm] = useState<LGUOut>(data ?? defaultForm);

  useEffect(() => {
    if (data) {
      // merge with defaults so missing keys get default values
      setForm({ ...defaultForm, ...data });
    }
  }, [data]);

  const [locationPickerIsOpen, setLocationPickerIsOpen] = useState(false);
  const openLocationPicker = () => setLocationPickerIsOpen(true);
  const closeLocationPicker = () => setLocationPickerIsOpen(false);
  const [lguContactInvalid, setLguContactInvalid] = useState(false);
  const [drrmContactInvalid, setDrrmContactInvalid] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [validation, setValidation] = useState<{ [key: string]: boolean }>({});

  const validateForm = () => {
    const v: { [key: string]: boolean } = {};
    v.lgu_name = !form.lgu_name?.trim();
    v.lgu_classification = !form.lgu_classification;
    v.mayor = !form.mayor?.trim();
    v.lgu_contact = !form.lgu_contact?.trim() || lguContactInvalid;
    v.location =
      !form.lat || !form.lng || form.lat === -1000000 || form.lng === -1000000;
    v.population = !form.population && form.population !== 0;
    v.lgu_majorHazard =
      !Array.isArray(form.lgu_majorHazard) || !form.lgu_majorHazard.length;
    v.DRMMpersonel = !form.DRMMpersonel?.trim();
    v.DRMM_contact = !form.DRMM_contact?.trim() || drrmContactInvalid;
    v.lgu_critical_facility =
      !Array.isArray(form.lgu_critical_facility) ||
      !form.lgu_critical_facility.length;
    v.lgu_pwd = !form.lgu_pwd && form.lgu_pwd !== 0;
    v.lgu_senior = !form.lgu_senior && form.lgu_senior !== 0;
    v.lgu_children = !form.lgu_children && form.lgu_children !== 0;
    setValidation(v);
    return !Object.values(v).some(Boolean);
  };

  const handleSubmit = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      if (!validateForm()) {
        await Swal.fire({
          icon: "warning",
          title: "Incomplete or Invalid Form",
          text: "Please fill in all required fields. Fields with red highlight need your attention.",
          confirmButtonColor: "#f59e0b",
        });
        setIsSaving(false);
        return;
      }

      const response = await API.put("/lgu_profiling/api/update_lgu", form);
      await Swal.fire({
        icon: "success",
        title: "Saved successfully!",
        text: "LGU details have been updated.",
        confirmButtonColor: "#6d28d9",
      });

      if (typeof onSaved === "function") await onSaved();
      closeModal();
    } catch (e: any) {
      Swal.fire({
        icon: "error",
        title: "Update failed!",
        text:
          e?.response?.data?.message ??
          "Something went wrong while saving. Please try again.",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleContactChange = (key: keyof LGUOut, val: string) => {
    // Allow digits, parentheses, plus sign
    const cleaned = val.replace(/[^\d()+]/g, "");

    // Philippine mobile or landline pattern
    const validPattern =
      /^(?:\+639\d{9}|09\d{9}|0\d{1,2}\d{7}|\(\d{2,3}\)\d{7})$/;

    setForm((prev) => ({ ...prev, [key]: cleaned }));

    // Check validity
    const setIsInvalid =
      key === "lgu_contact" ? setLguContactInvalid : setDrrmContactInvalid;
    if (cleaned === "" || validPattern.test(cleaned)) {
      setIsInvalid(false);
    } else {
      setIsInvalid(true);
    }
  };

  const toggle = (key: keyof LGUOut, val: string) => {
    setForm((prev) => {
      // Convert existing field to a Set (handles undefined/null gracefully)
      const current = Array.isArray(prev[key]) ? (prev[key] as string[]) : [];
      const next = new Set(current);

      // Toggle logic
      if (next.has(val)) {
        next.delete(val);
      } else {
        next.add(val);
      }

      // Return updated form
      return {
        ...prev,
        [key]: Array.from(next),
      };
    });
  };
  const onImage =
    (key: keyof LGUOut) => async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const url = await readAsDataUrl(file); // your existing helper
        setForm((prev) => ({
          ...prev,
          [key]: url as string, // ensure type is string
        }));
      } catch (err) {
        console.error("Failed to read image file:", err);
      }
    };
  const onLocationSelectSubmit = (
    address: string,
    coordinates: [number, number],
  ) => {
    setForm((prev) => ({
      ...prev,
      lat: coordinates[0],
      lng: coordinates[1],
    }));
  };
  return (
    <>
      {locationPickerIsOpen && (
        <MapViewWithSearch
          onClose={closeLocationPicker}
          defaultValue={{
            address: form.lgu_name,
            coordinates: [form.lat ?? -1000000, form.lng ?? -1000000],
          }}
          onSubmit={onLocationSelectSubmit}
          changeAddressOnclik={false}
          autoSearch={
            (form.lat === null && form.lng === null) ||
            (form.lat === -1000000 && form.lng === -1000000)
          }
        ></MapViewWithSearch>
      )}{" "}
      <Modal
        isOpen={true}
        onClose={closeModal}
        zIndex={998}
        width="clamp(560px, 56vw, 840px)"
        height="86vh"
      >
        <div className="modal-container lgu-modal">
          <div className="horizontal-container">
            <span className="details-title">Edit LGU Details</span>
          </div>

          {/* SCROLLABLE BODY */}
          <div className="lgu-scroll">
            <Section title="LGU Information Details">
              {/* Lat/Lng textbox + pin button */}
              <Row label="Location">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    gap: "8px", // optional spacing
                  }}
                >
                  <input
                    type="text"
                    readOnly
                    placeholder="Pick on map"
                    value={
                      form.lat && form.lng ? `${form.lat}, ${form.lng}` : ""
                    }
                    style={{ flex: 1 }}
                  />

                  <button
                    type="button"
                    onClick={openLocationPicker}
                    title="Pick location on map"
                    style={{
                      backgroundColor: "transparent",
                      border: "1px solid #ddd",
                      outline: "none",
                      color: "#3b82f6",
                      width: "44px",
                      height: "44px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    <FontAwesomeIcon icon={faMapMarkerAlt} />
                  </button>
                </div>
              </Row>

              <Row label="Classification">
                <select
                  value={form.lgu_classification}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      lgu_classification: e.target.value,
                    }))
                  }
                  required
                >
                  <option value="" disabled>
                    Select classification
                  </option>
                  <option value="Municipality">Municipality</option>
                  <option value="City">City</option>
                </select>
              </Row>
              <Row label="LGU's Contact">
                <input
                  type="tel"
                  value={form.lgu_contact ?? ""}
                  onChange={(e) =>
                    handleContactChange("lgu_contact", e.target.value)
                  }
                  className={validation.lgu_contact ? "input-invalid" : ""}
                />

                <label>
                  {lguContactInvalid && "Contact number is invalid"}
                </label>
              </Row>
              <Row label="LGU Seal">
                <label className="filelike">
                  <FontAwesomeIcon icon={faImage} />
                  <span>Choose image</span>
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={onImage("lgu_seal")}
                    className={validation.lgu_seal ? "input-invalid" : ""}
                  />
                </label>
                {form.lgu_seal && (
                  <img
                    src={form.lgu_seal}
                    alt="LGU Seal"
                    className="img-thumb"
                  />
                )}
              </Row>

              <Row label="Total Population">
                <input
                  type="number"
                  min={0}
                  value={form.population ?? ""}
                  placeholder="0"
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      population:
                        e.target.value === "" ? null : Number(e.target.value),
                    }))
                  }
                  className={validation.population ? "input-invalid" : ""}
                />
              </Row>

              <Row label="Mayor">
                <input
                  type="text"
                  value={form.mayor ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, mayor: e.target.value }))
                  }
                  className={validation.mayor ? "input-invalid" : ""}
                />
              </Row>
            </Section>

            <Section title="Disaster Risk Profile">
              <Row label="Major Hazard">
                <CheckGroup
                  options={[
                    "Typhoon",
                    "Flood",
                    "Earthquake",
                    "Fire",
                    "Landslide",
                  ]}
                  selected={form.lgu_majorHazard ?? []}
                  onToggle={(v) => toggle("lgu_majorHazard", v)}
                  columns={3}
                  isError={validation.major_hazard ? true : false}
                />
              </Row>

              <Row label="Hazard Picture">
                <label className="filelike">
                  <FontAwesomeIcon icon={faImage} />
                  <span>Choose image</span>
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={onImage("hazard_pic")}
                    className={validation.hazard_pic ? "input-invalid" : ""}
                  />
                </label>
                {form.hazard_pic && (
                  <img
                    src={form.hazard_pic}
                    alt="Hazard"
                    className="img-thumb"
                  />
                )}
              </Row>
            </Section>

            <Section title="Disaster Risk Reduction & Management Office">
              <Row label="DRMM local personnel">
                <input
                  type="text"
                  value={form.DRMMpersonel ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      DRMMpersonel: e.target.value,
                    }))
                  }
                  className={validation.DRMMpersonel ? "input-invalid" : ""}
                />
              </Row>

              <Row label="DRMM contact">
                <input
                  type="tel"
                  value={form.DRMM_contact ?? ""}
                  placeholder="09XXXXXXXXX"
                  onChange={(e) =>
                    handleContactChange("DRMM_contact", e.target.value)
                  }
                  className={validation.DRMM_contact ? "input-invalid" : ""}
                />
                <label>
                  {drrmContactInvalid && "Contact number is invalid"}
                </label>
              </Row>
              <Row label="Critical Facilities">
                <CheckGroup
                  options={[
                    "Municipal Hall",
                    "Barangay Hall",
                    "Hospital/Health Center",
                    "Evacuation Center",
                    "Police Station",
                    "Fire Station",
                    "School",
                  ]}
                  selected={form.lgu_critical_facility ?? []}
                  onToggle={(v) => toggle("lgu_critical_facility", v)}
                  columns={3}
                />
              </Row>
            </Section>

            <Section title="Vulnerable Population">
              <Row label="PWD">
                <input
                  type="number"
                  min={0}
                  value={form.lgu_pwd ?? ""}
                  placeholder="0"
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      lgu_pwd: Number(e.target.value),
                    }))
                  }
                  className={validation.lgu_pwd ? "input-invalid" : ""}
                />
              </Row>

              <Row label="Senior Citizen">
                <input
                  type="number"
                  min={0}
                  value={form.lgu_senior ?? ""}
                  placeholder="0"
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      lgu_senior: Number(e.target.value),
                    }))
                  }
                  className={validation.lgu_senior ? "input-invalid" : ""}
                />
              </Row>

              <Row label="Children">
                <input
                  type="number"
                  min={0}
                  value={form.lgu_children ?? ""}
                  placeholder="0"
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      lgu_children: Number(e.target.value),
                    }))
                  }
                  className={validation.lgu_children ? "input-invalid" : ""}
                />
              </Row>
            </Section>
          </div>

          {/* FOOTER */}
          <div className="action-button">
            <button
              style={{ background: "#749AB6", color: "#fff" }}
              onClick={handleSubmit}
            >
              Save
            </button>
            <button
              style={{ background: "#F84B4D", color: "#fff" }}
              onClick={closeModal}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

/* ========= Presentational helpers ========= */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
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

      {/* content column */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexDirection: "column",
        }}
      >
        {children}
      </div>

      {/* lock column (single source of truth) */}
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

/** NEW: shows image or a tidy placeholder */
function ImgOrPlaceholder({ label, src }: { label: string; src?: string }) {
  const hasImg = !!src;
  return (
    <div className="lgu-media">
      <div className="item-details-identifier" style={{ marginBottom: 6 }}>
        {label}
      </div>
      {hasImg ? (
        <img src={src} alt={label} className="img-thumb" />
      ) : (
        <div className="img-placeholder">No image</div>
      )}
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

function CheckGroup({
  options,
  selected,
  onToggle,
  columns = 3,
  isError = false,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  columns?: number;
  isError?: boolean;
}) {
  return (
    <div
      className={`lgu-checkgrid ${isError ? "input-invalid" : ""}`}
      style={{ "--cols": String(columns) } as React.CSSProperties}
    >
      {options.map((opt) => {
        const id = `chk_${opt.replace(/\s+/g, "_")}`;
        const checked = selected?.includes(opt);
        return (
          <label key={opt} htmlFor={id} className="lgu-check">
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
