// BarangayModals.tsx (frontend-only; no backend calls)
import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "../../../../components/Page_Furniture/Modals";
import type { BaseModalProps } from "../ModalProps";
import LocationPickerModal from "../../../../components/Page_Furniture/LocationPickerModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faMapMarkerAlt, faTriangleExclamation, faImage } from "@fortawesome/free-solid-svg-icons";
import "../../css/LGUModal.css"; // reuse same styles

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
  common_hazards: Array<"Typhoons" | "Flooding" | "Earthquakes" | "Landslides" | "Fire">;
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
type ViewProps = BaseModalProps & {
  data?: MyBarangay | null;
  onOpenEdit?: () => void;
  onOpenDelete?: () => void;
};

export const BarangayViewModal: React.FC<ViewProps> = ({
  isModalOpen,
  closeModal,
  setMessageBox, // parity (kept for BaseModalProps)
  onOpenDelete,
  onOpenEdit,
  data,
}) => {
  if (!isModalOpen) return null;
  const d = data ?? null;

  return (
    <Modal isOpen={isModalOpen} onClose={closeModal} zIndex={998} width="clamp(560px,56vw,840px)" height="86vh">
      <div className="modal-container lgu-modal">
        <div className="horizontal-container">
          <span className="title-modal-text">Barangay Information</span>
        </div>

        <div className="lgu-scroll">
          {!d ? (
            <div style={{ padding: 12, color: "#6b7280" }}>
              No data yet. Click <b>Edit</b> or <b>Create</b> to fill this in.
            </div>
          ) : (
            <>
              <Section title="Barangay Information Details">
                <DL label="Barangay Name" value={d.barangay_name || "—"} />
                <DL label="Location (Lat, Lng)" value={fmtLL(d.lat, d.lng)} />
                <DL label="Total Population" value={fmtNum(d.total_population)} />
                <DL label="Number of Households" value={fmtNum(d.households)} />
                <DL label="Barangay Captain" value={d.barangay_captain || "—"} />
                <DL
                  label="Contact Number"
                  value={d.contact || "—"}
                  invalid={!!d.contact && !is11Digits(d.contact)}
                />
              </Section>

              <Section title="Disaster Risk Profile">
                <DL label="Common Hazards" value={d.common_hazards?.join(", ") || "—"} />
                <DL label="Nearest Evacuation" value={d.nearest_evacuation || "—"} locked />
              </Section>

              <Section title="Vulnerable Groups">
                <DL label="PWD" value={fmtNum(d.pwd)} />
                <DL label="Senior" value={fmtNum(d.senior)} />
                <DL label="Children" value={fmtNum(d.children)} />
              </Section>

              {/* Dedicated, read-only Barangay Seal section */}
              <Section title="Barangay Seal">
                <div className="lgu-media-row">
                  <ImgOrPlaceholder label="Barangay Seal" src={d.barangay_seal} />
                </div>
              </Section>
            </>
          )}
        </div>

        <div className="action-button">
          <button style={{ backgroundColor: "#F84B4D", color: "#fff" }} onClick={onOpenDelete}>
            Delete
          </button>
          <button style={{ backgroundColor: "#749AB6", color: "#fff" }} onClick={onOpenEdit}>
            Edit
          </button>
          <button style={{ backgroundColor: "#9CA3AF", color: "#fff" }} onClick={closeModal}>
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};

/* =========================================================================
   CREATE (frontend-only)
===========================================================================*/
type CreateProps = BaseModalProps & {
  onCreate?: (data: MyBarangay | null) => void;
  prefetch?: {
    nearest_evacuation?: string; // locked
    lat?: number;
    lng?: number;
  };
};

export const BarangayCreateModal: React.FC<CreateProps> = ({
  isModalOpen,
  closeModal,
  setMessageBox,
  onCreate,
  prefetch,
}) => {
  const [form, setForm] = useState<MyBarangay>({
    barangay_name: "",
    lat: prefetch?.lat,
    lng: prefetch?.lng,
    total_population: "",
    households: "",
    barangay_captain: "",
    contact: "",
    barangay_seal: "",
    common_hazards: [],
    nearest_evacuation: prefetch?.nearest_evacuation || "",
    pwd: "",
    senior: "",
    children: "",
  });

  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!isModalOpen) return;
    setForm((p) => ({
      ...p,
      nearest_evacuation: prefetch?.nearest_evacuation ?? p.nearest_evacuation,
      lat: prefetch?.lat ?? p.lat,
      lng: prefetch?.lng ?? p.lng,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen]);

  const invalids = useMemo(
    () => ({
      contact: !!form.contact && !is11Digits(form.contact),
      name: !form.barangay_name?.trim(),
    }),
    [form.contact, form.barangay_name]
  );

  const onText =
    (key: keyof MyBarangay) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value }));

  const onNum =
    (key: keyof MyBarangay) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setForm((p) => ({ ...p, [key]: v === "" ? "" : Number(v) }));
    };

  const onImage =
    (key: keyof MyBarangay) =>
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const url = await readAsDataUrl(f);
      setForm((p) => ({ ...p, [key]: url }));
    };

  const toggle = (val: MyBarangay["common_hazards"][number]) =>
    setForm((prev) => {
      const s = new Set(prev.common_hazards ?? []);
      s.has(val) ? s.delete(val) : s.add(val);
      return { ...prev, common_hazards: Array.from(s) as MyBarangay["common_hazards"] };
    });

  const save = () => {
    if (invalids.name) {
      setMessageBox((p: any) => ({
        ...p,
        isOpen: true,
        type: "message",
        message: "Barangay Name is required.",
      }));
      return;
    }
    if (invalids.contact) {
      setMessageBox((p: any) => ({
        ...p,
        isOpen: true,
        type: "message",
        message: "Contact Number must be exactly 11 digits.",
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
    onCreate?.(form);
    closeModal();
  };

  if (!isModalOpen) return null;

  return (
    <Modal isOpen={isModalOpen} onClose={closeModal} zIndex={998} width="clamp(560px,56vw,840px)" height="86vh">
      {pickerOpen && (
        <LocationPickerModal
          isOpenProp={pickerOpen}
          onCloseProp={() => setPickerOpen(false)}
          onSubmit={({ lat, lng }: { lat: number; lng: number }) =>
            setForm((p) => ({ ...p, lat, lng }))
          }
          lat={Number(form.lat) || 0}
          lng={Number(form.lng) || 0}
        />
      )}

      <div className="modal-container lgu-modal">
        <div className="horizontal-container">
          <span className="details-title">Create Barangay</span>
        </div>

        <div className="lgu-scroll">
          <Section title="Barangay Information Details">
            <Row label="Barangay Name">
              <input
                type="text"
                value={form.barangay_name}
                onChange={onText("barangay_name")}
                placeholder="Enter barangay name"
              />
            </Row>

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
                onClick={() => setPickerOpen(true)}
                title="Pick location on map"
                style={pinBtnStyle}
              >
                <FontAwesomeIcon icon={faMapMarkerAlt} />
              </button>
            </Row>

            {/* Barangay Seal upload with small preview */}
            <Row label="Barangay Seal">
              <label className="filelike">
                <FontAwesomeIcon icon={faImage} />
                <span>Choose image</span>
                <input type="file" accept="image/*" onChange={onImage("barangay_seal")} hidden />
              </label>
              {!!form.barangay_seal && (
                <img src={form.barangay_seal} alt="Barangay Seal" className="img-thumb" />
              )}
            </Row>

            <Row label="Total Population">
              <input type="number" min={0} value={form.total_population ?? ""} onChange={onNum("total_population")} />
            </Row>

            <Row label="Number of Households">
              <input type="number" min={0} value={form.households ?? ""} onChange={onNum("households")} />
            </Row>

            <Row label="Barangay Captain">
              <input type="text" value={form.barangay_captain ?? ""} onChange={onText("barangay_captain")} />
            </Row>

            <Row label="Contact Number" hint="11 digits">
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
            <Row label="Common Hazards">
              <CheckGroup
                options={["Typhoons", "Flooding", "Earthquakes", "Landslides", "Fire"] as const}
                selected={form.common_hazards}
                onToggle={toggle}
                columns={3}
              />
            </Row>

            <Row label="Nearest Evacuation" locked>
              <input type="text" value={form.nearest_evacuation || ""} readOnly disabled placeholder="(prefetch)" />
            </Row>
          </Section>

          <Section title="Vulnerable Groups">
            <Row label="PWD">
              <input type="number" min={0} value={form.pwd ?? ""} onChange={onNum("pwd")} placeholder="0" />
            </Row>
            <Row label="Senior">
              <input type="number" min={0} value={form.senior ?? ""} onChange={onNum("senior")} placeholder="0" />
            </Row>
            <Row label="Children">
              <input type="number" min={0} value={form.children ?? ""} onChange={onNum("children")} placeholder="0" />
            </Row>
          </Section>

          {/* (Removed the bottom preview section for Create; preview is inline with the upload row) */}
        </div>

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

/* =========================================================================
   EDIT (frontend-only)
===========================================================================*/
type EditProps = BaseModalProps & {
  data: MyBarangay;
  onSaved?: (data: MyBarangay | null) => void;
  prefetch?: {
    nearest_evacuation?: string; // locked
    lat?: number;
    lng?: number;
  };
};

export const BarangayEditModal: React.FC<EditProps> = ({
  isModalOpen,
  closeModal,
  setMessageBox,
  data,
  onSaved,
  prefetch,
}) => {
  const [form, setForm] = useState<MyBarangay>({ ...data });
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!isModalOpen) return;
    setForm((p) => ({
      ...p,
      nearest_evacuation: prefetch?.nearest_evacuation ?? p.nearest_evacuation,
      lat: prefetch?.lat ?? p.lat,
      lng: prefetch?.lng ?? p.lng,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen]);

  const invalids = useMemo(
    () => ({
      contact: !!form.contact && !is11Digits(form.contact),
      name: !form.barangay_name?.trim(),
    }),
    [form.contact, form.barangay_name]
  );

  const onText =
    (key: keyof MyBarangay) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value }));

  const onNum =
    (key: keyof MyBarangay) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setForm((p) => ({ ...p, [key]: v === "" ? "" : Number(v) }));
    };

  const onImage =
    (key: keyof MyBarangay) =>
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const url = await readAsDataUrl(f);
      setForm((p) => ({ ...p, [key]: url }));
    };

  const toggle = (val: MyBarangay["common_hazards"][number]) =>
    setForm((prev) => {
      const s = new Set(prev.common_hazards ?? []);
      s.has(val) ? s.delete(val) : s.add(val);
      return { ...prev, common_hazards: Array.from(s) as MyBarangay["common_hazards"] };
    });

  const save = () => {
    if (invalids.name) {
      setMessageBox((p: any) => ({
        ...p,
        isOpen: true,
        type: "message",
        message: "Barangay Name is required.",
      }));
      return;
    }
    if (invalids.contact) {
      setMessageBox((p: any) => ({
        ...p,
        isOpen: true,
        type: "message",
        message: "Contact Number must be exactly 11 digits.",
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
    <Modal isOpen={isModalOpen} onClose={closeModal} zIndex={998} width="clamp(560px,56vw,840px)" height="86vh">
      {pickerOpen && (
        <LocationPickerModal
          isOpenProp={pickerOpen}
          onCloseProp={() => setPickerOpen(false)}
          onSubmit={({ lat, lng }: { lat: number; lng: number }) =>
            setForm((p) => ({ ...p, lat, lng }))
          }
          lat={Number(form.lat) || 0}
          lng={Number(form.lng) || 0}
        />
      )}

      <div className="modal-container lgu-modal">
        <div className="horizontal-container">
          <span className="details-title">Edit Barangay</span>
        </div>

        <div className="lgu-scroll">
          <Section title="Barangay Information Details">
            <Row label="Barangay Name">
              <input type="text" value={form.barangay_name} onChange={onText("barangay_name")} />
            </Row>

            <Row label="Location">
              <input
                type="text"
                readOnly
                placeholder="Pick on map"
                value={form.lat != null && form.lng != null ? fmtLL(form.lat, form.lng) : ""}
                style={{ width: 260 }}
              />
              <button type="button" onClick={() => setPickerOpen(true)} title="Pick location on map" style={pinBtnStyle}>
                <FontAwesomeIcon icon={faMapMarkerAlt} />
              </button>
            </Row>

            {/* Edit: keep attachment, remove preview */}
            <Row label="Barangay Seal">
              <label className="filelike">
                <FontAwesomeIcon icon={faImage} />
                <span>Choose image</span>
                <input type="file" accept="image/*" onChange={onImage("barangay_seal")} hidden />
              </label>
            </Row>

            <Row label="Total Population">
              <input type="number" min={0} value={form.total_population ?? ""} onChange={onNum("total_population")} />
            </Row>

            <Row label="Number of Households">
              <input type="number" min={0} value={form.households ?? ""} onChange={onNum("households")} />
            </Row>

            <Row label="Barangay Captain">
              <input type="text" value={form.barangay_captain ?? ""} onChange={onText("barangay_captain")} />
            </Row>

            <Row label="Contact Number" hint="11 digits">
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
            <Row label="Common Hazards">
              <CheckGroup
                options={["Typhoons", "Flooding", "Earthquakes", "Landslides", "Fire"] as const}
                selected={form.common_hazards}
                onToggle={toggle}
                columns={3}
              />
            </Row>

            <Row label="Nearest Evacuation" locked>
              <input type="text" value={form.nearest_evacuation || ""} readOnly disabled placeholder="(prefetch)" />
            </Row>
          </Section>

          <Section title="Vulnerable Groups">
            <Row label="PWD">
              <input type="number" min={0} value={form.pwd ?? ""} onChange={onNum("pwd")} placeholder="0" />
            </Row>
            <Row label="Senior">
              <input type="number" min={0} value={form.senior ?? ""} onChange={onNum("senior")} placeholder="0" />
            </Row>
            <Row label="Children">
              <input type="number" min={0} value={form.children ?? ""} onChange={onNum("children")} placeholder="0" />
            </Row>
          </Section>

          {/* (Removed the bottom Images preview section for Edit) */}
        </div>

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

/* =========================================================================
   DELETE CONFIRMATION (frontend-only)
===========================================================================*/
type DeleteProps = BaseModalProps & {
  targetName?: string;
  onConfirm?: () => void;
};

export const BarangayDeleteModal: React.FC<DeleteProps> = ({
  isModalOpen,
  closeModal,
  targetName,
  onConfirm,
}) => {
  if (!isModalOpen) return null;
  return (
    <Modal isOpen={isModalOpen} onClose={closeModal} zIndex={999} width="min(520px, 92vw)" height="auto">
      <div className="modal-container lgu-modal" style={{ padding: 24 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
          <FontAwesomeIcon icon={faTriangleExclamation} style={{ color: "#b91c1c" }} />
          <span className="details-title">Delete Barangay</span>
        </div>
        <p style={{ color: "#374151", marginBottom: 16 }}>
          Are you sure you want to delete <b>{targetName ?? "this barangay"}</b>? This action cannot be undone.
        </p>
        <div className="action-button">
          <button style={{ background: "#F84B4D", color: "#fff" }} onClick={onConfirm}>
            Delete
          </button>
          <button style={{ background: "#749AB6", color: "#fff" }} onClick={closeModal}>
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

/** shows image or a tidy placeholder (matches your LGU modal pattern) */
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
    <div className="lgu-checkgrid" style={{ "--cols": String(columns) } as React.CSSProperties}>
      {options.map((opt) => {
        const id = `chk_${String(opt).replace(/\s+/g, "_")}`;
        const checked = selected?.includes(opt);
        return (
          <label key={id} htmlFor={id} className="lgu-check">
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
