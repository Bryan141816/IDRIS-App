// BarangayModals.tsx (frontend-only; no backend calls)

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Modal } from "../../../../components/Page_Furniture/Modals";
import type { BaseModalProps } from "../ModalProps";
import LocationPickerModal from "../../../../components/Page_Furniture/LocationPickerModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLock,
  faMapMarkerAlt,
  faTriangleExclamation,
  faImage,
} from "@fortawesome/free-solid-svg-icons";
import "../../css/LGUModal.css"; // reuse same styles
import { Barangay } from "../LGUofficer";
import defaultPicture from "../../../../../public/images/defaultpicture.jpg";
import { MapViewWithSearch } from "../../../procurement_inventory/procurement_inventory/Tabs/MapViewWithSearch";
import { API } from "../../../../API_Handler/Axio_API_Handler";
import Swal from "sweetalert2";

/* ========= Types ========= */
export type BarangayForm = {
  // Barangay Information Details
  barangay_name: string;
  lat?: number;
  lng?: number;
  total_population?: number | "";
  households?: number | "";
  barangay_captain?: string;
  contact?: string; // 11 digits
  barangay_seal?: string; // dataUrl preview

  // Disaster Risk Profile
  common_hazards: Array<
    "Typhoons" | "Flooding" | "Earthquakes" | "Landslides" | "Fire"
  >;
  nearest_evacuation?: string; // prefetch, locked

  // Vulnerable Groups
  pwd?: number | "";
  senior?: number | "";
  children?: number | "";
};

export type MyBarangay = BarangayForm;

/* ========= Helpers ========= */
const is11Digits = (v?: string) => !!v && /^[0-9]{11}$/.test(v);
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
const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });

/* =========================================================================
   VIEW
===========================================================================*/
type ViewProps = {
  closeModal: () => void;
  data: Barangay;
};

export const BarangayViewModal: React.FC<ViewProps> = ({
  closeModal,
  data,
}) => {
  return (
    <Modal
      isOpen={true}
      onClose={closeModal}
      zIndex={998}
      width="clamp(560px,56vw,840px)"
      height="86vh"
    >
      <div className="modal-container lgu-modal">
        <div className="horizontal-container">
          <span className="title-modal-text">Barangay Information</span>
        </div>

        <div className="lgu-scroll">
          <Section title="Barangay Information Details">
            <DL label="Barangay Name" value={data?.name} />
            <DL label="Location (Lat, Lng)" value={fmtLL(data.lat, data.lng)} />
            <DL
              label="Total Population"
              value={fmtNum(data.total_population)}
            />
            <DL
              label="Number of Households"
              value={fmtNum(data?.household_count)}
            />
            <DL
              label="Barangay Captain"
              value={data?.barangay_captain || "—"}
            />
            <DL
              label="Contact Number"
              value={data?.contact_info || "—"}
              invalid={!!data?.contact_info && !is11Digits(data.contact_info)}
            />
          </Section>

          <Section title="Disaster Risk Profile">
            <DL
              label="Common Hazards"
              value={data?.common_hazards?.join(", ") || "—"}
            />
            <DL
              label="Nearest Evacuation"
              value={data?.evacucation_center?.name || "—"}
              locked
            />
          </Section>

          <Section title="Vulnerable Groups">
            <DL label="PWD" value={fmtNum(data?.barangay_pwd)} />
            <DL label="Senior" value={fmtNum(data?.barangay_senior)} />
            <DL label="Children" value={fmtNum(data?.barangay_children)} />
          </Section>

          {/* Dedicated, read-only Barangay Seal section */}
          <Section title="Barangay Seal">
            <div className="lgu-media-row">
              <ImgOrPlaceholder
                label="Barangay Seal"
                src={data?.baranggay_pic || defaultPicture}
              />
            </div>
          </Section>
        </div>

        <div className="action-button">
          <button
            style={{ backgroundColor: "#9CA3AF", color: "#fff" }}
            onClick={closeModal}
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
/* =========================================================================
   CREATE (frontend-only)
===========================================================================*/

async function updateBarangay(id: number, payload: any) {
  // If your backend expects PUT/PATCH, keep it consistent here.
  const { data } = await API.put(`/lgu_profiling/barangays/${id}`, payload);
  return data; // assume API returns the updated barangay
}
type EditProps = {
  closeModal: () => void;
  data: Barangay;
  lgu_name: string;
  lgu_coordinate: [number, number];
  onSaved?: (updated: Barangay) => void; // ⬅️ pass the updated row back
};



export const BarangayEditModal: React.FC<EditProps> = ({
  closeModal,
  data,
  lgu_name,
  lgu_coordinate,
  onSaved, // ✅ include in destructure
}) => {


  const [form, setForm] = useState<Barangay>(data);

  const [locationPickerIsOpen, setLocationPickerIsOpen] = useState(false);
  const openLocationPicker = () => setLocationPickerIsOpen(true);
  const closeLocationPicker = () => setLocationPickerIsOpen(false);
  const onImage =
    (key: keyof Barangay) => async (e: React.ChangeEvent<HTMLInputElement>) => {
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
  const toggle = (key: keyof Barangay, val: string) => {
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
  const handleContactChange = (key: keyof Barangay, val: string) => {
    // Allow digits, parentheses, plus sign
    const cleaned = val.replace(/[^\d()+]/g, "");

    // Philippine mobile or landline pattern
    const validPattern =
      /^(?:\+639\d{9}|09\d{9}|0\d{1,2}\d{7}|\(\d{2,3}\)\d{7})$/;

    setForm((prev) => ({ ...prev, [key]: cleaned }));
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
  const [validation, setValidation] = useState<{ [key: string]: boolean }>({});
const validateForm = () => {
  const v: { [key: string]: boolean } = {};
  v.name = !form.name?.trim();
  v.lat = !form.lat || form.lat === -1000000;
  v.lng = !form.lng || form.lng === -1000000;
  v.total_population = !form.total_population && form.total_population !== 0;
  v.household_count = !form.household_count && form.household_count !== 0;
  v.barangay_captain = !form.barangay_captain?.trim();
  v.contact_info = !form.contact_info?.trim() || !is11Digits(form.contact_info);
  v.common_hazards = !Array.isArray(form.common_hazards) || form.common_hazards.length === 0;
  v.barangay_pwd = !form.barangay_pwd && form.barangay_pwd !== 0;
  v.barangay_senior = !form.barangay_senior && form.barangay_senior !== 0;
  v.barangay_children = !form.barangay_children && form.barangay_children !== 0;
  setValidation(v);
  return !Object.values(v).some(Boolean);
};

  const handleUpdate = async () => {
  if (!validateForm()) {
    await Swal.fire({
      icon: "warning",
      title: "Incomplete or Invalid Form",
      text: "Please fill in all required fields. Fields with red highlight need your attention.",
      confirmButtonColor: "#f59e0b",
    });
    return;
  }

  Swal.fire({
    title: "Saving...",
    text: "Please wait while we save the barangay record.",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  try {
    const response = await API.put("/lgu_profiling/api/update_barangay", form);

    await Swal.fire({
      icon: "success",
      title: "Successfully Saved!",
      text: "Barangay details have been updated.",
      confirmButtonColor: "#3085d6",
      confirmButtonText: "OK",
    });

    onSaved?.(form);
    closeModal();
  } catch (e: any) {
    console.error("Error updating barangay: " + e.message);
    Swal.fire({
      icon: "error",
      title: "Save Failed",
      text:
        e?.response?.data?.detail ||
        "Something went wrong while saving the barangay.",
      confirmButtonColor: "#d33",
      confirmButtonText: "Try Again",
    });
  }
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
        ></MapViewWithSearch>
      )}
      <Modal
        isOpen={true}
        onClose={closeModal}
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
                <input type="text" value={form.name} />
              </Row>

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

              {/* Edit: keep attachment, remove preview */}
              <Row label="Barangay Seal">
                <label className="filelike">
                  <FontAwesomeIcon icon={faImage} />
                  <span>Choose image</span>
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={onImage("baranggay_pic")}
                    className={validation.barangay_seal ? "input-invalid" : ""}
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
                  onChange={(e) => {
                    const val =
                      e.target.value === "" ? null : Number(e.target.value);
                    setForm((prev) => ({
                      ...prev,
                      total_population: val, // now number | null, not string
                    }));
                  }}
                  className={validation.total_population ? "input-invalid" : ""}
                />
              </Row>

              <Row label="Number of Households">
                <input
                  type="number"
                  min={0}
                  value={form.household_count ?? ""}
                  onChange={(e) => {
                    const val =
                      e.target.value === "" ? null : Number(e.target.value);
                    setForm((prev) => ({
                      ...prev,
                      household_count: val, // now number | null, not string
                    }));
                  }}
                  className={validation.household_count ? "input-invalid" : ""}
                />
              </Row>

              <Row label="Barangay Captain">
                <input
                  type="text"
                  value={form.barangay_captain ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      barangay_captain: val, // now number | null, not string
                    }));
                  }}
                  className={validation.barangay_captain ? "input-invalid" : ""}
                />
              </Row>

              <Row label="Contact Number" hint="11 digits">
                <input
                  type="tel"
                  value={form.contact_info ?? ""}
                  placeholder="09XXXXXXXXX"
                  onChange={(e) =>
                    handleContactChange("contact_info", e.target.value)
                  }
                  className={validation.contact_info ? "input-invalid" : ""}
                />
              </Row>
            </Section>

            <Section title="Disaster Risk Profile">
              <Row label="Common Hazards">
                <CheckGroup
                  options={[
                    "Typhoon",
                    "Flood",
                    "Earthquake",
                    "Fire",
                    "Landslide",
                  ]}
                  selected={form.common_hazards ?? []}
                  onToggle={(v) => toggle("common_hazards", v)}
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
                  onChange={(e) => {
                    const val =
                      e.target.value === "" ? null : Number(e.target.value);
                    setForm((prev) => ({
                      ...prev,
                      barangay_pwd: val, // now number | null, not string
                    }));
                  }}
                  className={validation.barangay_pwd ? "input-invalid" : ""}
                />
              </Row>
              <Row label="Senior">
                <input
                  type="number"
                  min={0}
                  value={form.barangay_senior ?? ""}
                  placeholder="0"
                  onChange={(e) => {
                    const val =
                      e.target.value === "" ? null : Number(e.target.value);
                    setForm((prev) => ({
                      ...prev,
                      barangay_senior: val, // now number | null, not string
                    }));
                  }}
                  className={validation.barangay_senior ? "input-invalid" : ""}
                />
              </Row>
              <Row label="Children">
                <input
                  type="number"
                  min={0}
                  value={form.barangay_children ?? ""}
                  placeholder="0"
                  onChange={(e) => {
                    const val =
                      e.target.value === "" ? null : Number(e.target.value);
                    setForm((prev) => ({
                      ...prev,
                      barangay_children: val, // now number | null, not string
                    }));
                  }}
                  className={validation.barangay_children ? "input-invalid" : ""}
                />
              </Row>
            </Section>

            {/* (Removed the bottom Images preview section for Edit) */}
          </div>

          <div className="action-button">
            <button
              style={{ background: "#749AB6", color: "#fff" }}
              onClick={handleUpdate}
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
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {children}
      </div>
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

/** shows image or a tidy placeholder (matches your LGU modal pattern) */
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

/* Small inline style for the pin/map button (matches LGU modals) */
const pinBtnStyle: React.CSSProperties = {
  backgroundColor: "transparent",
  border: "1px solid  #ddd",
  outline: "none",
  color: "#3b82f6",
  width: 35,
  height: 32,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 6,
  cursor: "pointer",
};
