// LGUModals.tsx (frontend-only modal; no backend calls)
import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "../../../../components/Page_Furniture/Modals";
import type { BaseModalProps } from "../ModalProps";
import LocationPickerModal from "../../../../components/Page_Furniture/LocationPickerModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage, faLock, faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";
import "../../css/LGUModal.css";

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
  major_hazard: Array<"Typhoon" | "Flood" | "Earthquake" | "Fire" | "Landslide">;
  hazard_picture?: string; // dataUrl preview

  // DRRMO
  drmm_personnel?: string;
  drmm_contact?: string; // 11 digits
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
type ViewProps = BaseModalProps & {
  data?: LGUEditForm | null;
  onOpenEdit?: () => void;
};

export const MyLGUViewModal: React.FC<ViewProps> = ({
  isModalOpen,
  closeModal,
  setMessageBox, // kept for parity; not used here
  onOpenEdit,
  data,
}) => {
  if (!isModalOpen) return null;
  const d = data ?? null;

  return (
    <Modal
      isOpen={isModalOpen}
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
                <DL label="Classification" value={d.classification || "—"} />
                <DL label="Total Population" value={fmtNum(d.population)} />
                <DL label="No. of Barangay" value={fmtNum(d.barangay_count)} locked />
                <DL label="Mayor" value={d.mayor || "—"} />
                <DL
                  label="Mayor's Contact"
                  value={d.contact || "—"}
                  invalid={!!d.contact && !is11Digits(d.contact)}
                />
                <DL label="Coordinates" value={fmtLL(d.lat, d.lng)} />
                {/* moved images out of this section */}
              </Section>

              <Section title="Disaster Risk Profile">
                <DL label="Major Hazard" value={d.major_hazard?.join(", ") || "—"} />
                {/* moved image out of this section */}
              </Section>

              <Section title="Disaster Risk Reduction & Management Office">
                <DL label="DRMM local personnel" value={d.drmm_personnel || "—"} />
                <DL
                  label="DRMM contact"
                  value={d.drmm_contact || "—"}
                  invalid={!!d.drmm_contact && !is11Digits(d.drmm_contact)}
                />
                <DL label="Evacuation Center" value={d.evacuation_center || "—"} locked />
                <DL
                  label="Critical Facilities"
                  value={d.critical_facilities?.join(", ") || "—"}
                />
              </Section>

              <Section title="Vulnerable Population">
                <DL label="PWD" value={fmtNum(d.pwd)} />
                <DL label="Senior Citizen" value={fmtNum(d.senior)} />
                <DL label="Children" value={fmtNum(d.children)} />
              </Section>

              {/* --- NEW: Images at the very bottom --- */}
              <Section title="Images">
                <div className="lgu-media-row">
                  <ImgOrPlaceholder label="LGU Seal" src={d.lgu_seal} />
                  <ImgOrPlaceholder label="Hazard Picture" src={d.hazard_picture} />
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

/* =========================================================================
   EDIT (frontend only)
===========================================================================*/
type EditProps = BaseModalProps & {
  onSaved?: (data: MyLGU | null) => void;
  prefetch?: {
    lgu_name?: string;
    barangay_count?: number;
    evacuation_center?: string;
    lat?: number;
    lng?: number;
  };
};

export const MyLGUEditModal: React.FC<EditProps> = ({
  isModalOpen,
  closeModal,
  setMessageBox,
  onSaved,
  prefetch,
}) => {
  // ===== state =====
  const [form, setForm] = useState<LGUEditForm>({
    lgu_name: prefetch?.lgu_name || "",
    classification: "",
    lgu_seal: "",
    population: "",
    barangay_count: prefetch?.barangay_count ?? "",
    mayor: "",
    contact: "",

    lat: prefetch?.lat,
    lng: prefetch?.lng,

    major_hazard: [],
    hazard_picture: "",

    drmm_personnel: "",
    drmm_contact: "",
    evacuation_center: prefetch?.evacuation_center || "",

    critical_facilities: [],

    pwd: "",
    senior: "",
    children: "",
  });

  const [locationPickerIsOpen, setLocationPickerIsOpen] = useState(false);
  const openLocationPicker = () => setLocationPickerIsOpen(true);
  const closeLocationPicker = () => setLocationPickerIsOpen(false);

  // keep prefetch-locked fields (and lat/lng) in sync when the modal opens
  useEffect(() => {
    if (!isModalOpen) return;
    setForm((p) => ({
      ...p,
      lgu_name: prefetch?.lgu_name || p.lgu_name || "",
      barangay_count: (prefetch?.barangay_count ?? p.barangay_count) as number | "",
      evacuation_center: prefetch?.evacuation_center || p.evacuation_center || "",
      lat: prefetch?.lat ?? p.lat,
      lng: prefetch?.lng ?? p.lng,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen]);

  // simple validations
  const invalids = useMemo(
    () => ({
      contact: !!form.contact && !is11Digits(form.contact),
      drmm_contact: !!form.drmm_contact && !is11Digits(form.drmm_contact),
    }),
    [form.contact, form.drmm_contact]
  );

  // ===== handlers =====
  const onText =
    (key: keyof LGUEditForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value }));

  const onNum =
    (key: keyof LGUEditForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setForm((p) => ({ ...p, [key]: v === "" ? "" : Number(v) }));
    };

  const onSelect =
    (key: keyof LGUEditForm) =>
    (e: React.ChangeEvent<HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value as any }));

  const onImage =
    (key: keyof LGUEditForm) =>
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const url = await readAsDataUrl(f);
      setForm((p) => ({ ...p, [key]: url }));
    };

  const toggle = (key: keyof LGUEditForm, val: string) =>
    setForm((prev) => {
      const set = new Set((prev[key] as unknown as string[]) ?? []);
      set.has(val) ? set.delete(val) : set.add(val);
      return { ...prev, [key]: Array.from(set) as any };
    });

  const save = () => {
    if (invalids.contact || invalids.drmm_contact) {
      setMessageBox((p: any) => ({
        ...p,
        isOpen: true,
        type: "message",
        message: "Phone numbers must be exactly 11 digits.",
      }));
      return;
    }
    if ((form.lat == null) !== (form.lng == null)) {
      setMessageBox((p: any) => ({
        ...p,
        isOpen: true,
        type: "message",
        message: "Please pick a valid location (both latitude and longitude).",
      }));
      return;
    }
    onSaved?.(form);
    closeModal();
  };

  if (!isModalOpen) return null;

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={closeModal}
      zIndex={998}
      width="clamp(560px, 56vw, 840px)"
      height="86vh"
    >
      {/* Map picker */}
      {locationPickerIsOpen && (
        <LocationPickerModal
          isOpenProp={locationPickerIsOpen}
          onCloseProp={closeLocationPicker}
          onSubmit={(mapData: { lat: number; lng: number }) =>
            setForm((prev) => ({ ...prev, lat: mapData.lat, lng: mapData.lng }))
          }
          lat={Number(form.lat) || 0}
          lng={Number(form.lng) || 0}
        />
      )}

      <div className="modal-container lgu-modal">
        <div className="horizontal-container">
          <span className="details-title">Edit LGU Details</span>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="lgu-scroll">
          <Section title="LGU information Details">
            <Row label="LGU Name" locked>
              <input type="text" value={form.lgu_name} readOnly disabled placeholder="(prefetch)" />
            </Row>

            {/* Lat/Lng textbox + pin button */}
            <Row label="Location">
              <input
                type="text"
                readOnly
                placeholder="Pick on map"
                value={form.lat != null && form.lng != null ? fmtLL(form.lat, form.lng) : ""}
                style={{ width: 260 }}
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
                  width: 35,
                  height: 32,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                <FontAwesomeIcon icon={faMapMarkerAlt} />
              </button>
            </Row>

            <Row label="Classification">
              <select value={form.classification} onChange={onSelect("classification")} required>
                <option value="" disabled>
                  Select classification
                </option>
                <option value="Municipality">Municipality</option>
                <option value="City">City</option>
              </select>
            </Row>

            <Row label="LGU Seal">
              <label className="filelike">
                <FontAwesomeIcon icon={faImage} />
                <span>Choose image</span>
                <input type="file" accept="image/*" onChange={onImage("lgu_seal")} hidden />
              </label>
              {!!form.lgu_seal && <img src={form.lgu_seal} alt="LGU Seal" className="img-thumb" />}
            </Row>

            <Row label="Total Population">
              <input
                type="number"
                value={form.population ?? ""}
                min={0}
                onChange={onNum("population")}
                placeholder="0"
              />
            </Row>

            <Row label="No. of Barangay" locked>
              <input
                type="number"
                value={form.barangay_count ?? ""}
                readOnly
                disabled
                placeholder="(prefetch)"
              />
            </Row>

            <Row label="Mayor">
              <input type="text" value={form.mayor ?? ""} onChange={onText("mayor")} />
            </Row>

            <Row label="Mayor's Contact" hint="11 digits">
              <input
                type="tel"
                value={form.contact ?? ""}
                onChange={onText("contact")}
                placeholder="09XXXXXXXXX"
                className={invalids.contact ? "input-invalid" : undefined}
                maxLength={11}
              />
            </Row>
          </Section>

          <Section title="Disaster Risk Profile">
            <Row label="Major Hazard">
              <CheckGroup
                options={["Typhoon", "Flood", "Earthquake", "Fire", "Landslide"]}
                selected={form.major_hazard}
                onToggle={(v) => toggle("major_hazard", v)}
                columns={3}
              />
            </Row>

            <Row label="Hazard Picture">
              <label className="filelike">
                <FontAwesomeIcon icon={faImage} />
                <span>Choose image</span>
                <input type="file" accept="image/*" onChange={onImage("hazard_picture")} hidden />
              </label>
              {!!form.hazard_picture && (
                <img src={form.hazard_picture} alt="Hazard" className="img-thumb" />
              )}
            </Row>
          </Section>

          <Section title="Disaster Risk Reduction & Management Office">
            <Row label="DRMM local personnel">
              <input
                type="text"
                value={form.drmm_personnel ?? ""}
                onChange={onText("drmm_personnel")}
              />
            </Row>

            <Row label="DRMM contact" hint="11 digits">
              <input
                type="tel"
                value={form.drmm_contact ?? ""}
                onChange={onText("drmm_contact")}
                placeholder="09XXXXXXXXX"
                className={invalids.drmm_contact ? "input-invalid" : undefined}
                maxLength={11}
              />
            </Row>

            <Row label="Evacuation Center" locked>
              <input
                type="text"
                value={form.evacuation_center || ""}
                readOnly
                disabled
                placeholder="(prefetch)"
              />
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
                selected={form.critical_facilities}
                onToggle={(v) => toggle("critical_facilities", v)}
                columns={3}
              />
            </Row>
          </Section>

          <Section title="Vulnerable Population">
            <Row label="PWD">
              <input
                type="number"
                min={0}
                value={form.pwd ?? ""}
                onChange={onNum("pwd")}
                placeholder="0"
              />
            </Row>
            <Row label="Senior Citizen">
              <input
                type="number"
                min={0}
                value={form.senior ?? ""}
                onChange={onNum("senior")}
                placeholder="0"
              />
            </Row>
            <Row label="Children">
              <input
                type="number"
                min={0}
                value={form.children ?? ""}
                onChange={onNum("children")}
                placeholder="0"
              />
            </Row>
          </Section>
        </div>

        {/* FOOTER */}
        <div className="action-button">
          <button style={{ background: "#749AB6", color: "#fff" }} onClick={save}>
            Save
          </button>
          <button style={{ background: "#F84B4D", color: "#fff" }} onClick={closeModal}>
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};

/* ========= Presentational helpers ========= */
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

      {/* content column */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{children}</div>

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

/** Keep if needed elsewhere */
function ImgBlock({ label, src }: { label: string; src: string }) {
  return (
    <div style={{ marginTop: 8 }}>
      <div className="item-details-identifier">{label}</div>
      <img src={src} alt={label} className="img-thumb" />
    </div>
  );
}

/** NEW: shows image or a tidy placeholder */
function ImgOrPlaceholder({ label, src }: { label: string; src?: string }) {
  const hasImg = !!src;
  return (
    <div className="lgu-media">
      <div className="item-details-identifier" style={{ marginBottom: 6 }}>{label}</div>
      {hasImg ? (
        <img src={src} alt={label} className="img-thumb" />
      ) : (
        <div className="img-placeholder">No image</div>
      )}
    </div>
  );
}

function CheckGroup({
  options,
  selected,
  onToggle,
  columns = 3,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  columns?: number;
}) {
  return (
    <div
      className="lgu-checkgrid"
      style={{ "--cols": String(columns) } as React.CSSProperties}
    >
      {options.map((opt) => {
        const id = `chk_${opt.replace(/\s+/g, "_")}`;
        const checked = selected?.includes(opt);
        return (
          <label key={opt} htmlFor={id} className="lgu-check">
            <input id={id} type="checkbox" checked={!!checked} onChange={() => onToggle(opt)} />
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
