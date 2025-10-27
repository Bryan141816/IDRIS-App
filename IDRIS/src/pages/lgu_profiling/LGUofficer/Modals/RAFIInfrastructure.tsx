// RAFFIModals.tsx (frontend-only; no backend calls)
import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "../../../../components/Page_Furniture/Modals";
import type { BaseModalProps } from "../ModalProps";
import LocationPickerModal from "../../../../components/Page_Furniture/LocationPickerModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage, faLock, faMapMarkerAlt, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import "../../css/LGUModal.css";

/* ========= Types ========= */
export type RAFFIForm = {
  raffi_name: string;
  raffi_description?: string;
  lat?: number;
  lng?: number;
  raffi_picture?: string; // dataUrl preview
};

export type RAFFIRecord = RAFFIForm;

/* ========= Helpers ========= */
const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });

function fmtLL(lat?: number | "" | null, lng?: number | "" | null) {
  if (lat === "" || lng === "" || lat == null || lng == null) return "—";
  const f = (n: number) => Number(n).toFixed(6);
  return `${f(Number(lat))}, ${f(Number(lng))}`;
}

/* =========================================================================
   VIEW
===========================================================================*/
type ViewProps = BaseModalProps & {
  data?: RAFFIRecord | null;
  onOpenEdit?: () => void;
  onOpenDelete?: () => void;
};

export const RAFFIViewModal: React.FC<ViewProps> = ({
  isModalOpen,
  closeModal,
  data,
  onOpenDelete,
  onOpenEdit,
}) => {
  if (!isModalOpen) return null;
  const d = data ?? null;

  return (
    <Modal isOpen={isModalOpen} onClose={closeModal} zIndex={998} width="clamp(560px,56vw,840px)" height="80vh">
      <div className="modal-container lgu-modal">
        <div className="horizontal-container">
          <span className="title-modal-text">RAFFI Details</span>
        </div>

        <div className="lgu-scroll">
          {!d ? (
            <div style={{ padding: 12, color: "#6b7280" }}>
              No data yet. Click <b>Edit</b> or <b>Create</b> to fill this in.
            </div>
          ) : (
            <>
              <Section title="Core Information">
                <DL label="RAFFI Name" value={d.raffi_name || "—"} />
                <DL label="RAFFI Description" value={d.raffi_description || "—"} />
              </Section>

              <Section title="Location">
                <DL label="Coordinates (Lat, Lng)" value={fmtLL(d.lat, d.lng)} />
              </Section>

              <Section title="Attachments">
                <div className="lgu-media-row">
                  <ImgOrPlaceholder label="RAFFI Picture" src={d.raffi_picture} />
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
type CreateProps = BaseModalProps & {
  onCreate?: (data: RAFFIRecord | null) => void;
  prefill?: {
    lat?: number;
    lng?: number;
  };
};

export const RAFFICreateModal: React.FC<CreateProps> = ({
  isModalOpen,
  closeModal,
  setMessageBox,
  onCreate,
  prefill,
}) => {
  const [form, setForm] = useState<RAFFIForm>({
    raffi_name: "",
    raffi_description: "",
    lat: prefill?.lat,
    lng: prefill?.lng,
    raffi_picture: "",
  });

  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!isModalOpen) return;
    setForm((p) => ({
      ...p,
      lat: prefill?.lat ?? p.lat,
      lng: prefill?.lng ?? p.lng,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen]);

  const invalids = useMemo(
    () => ({
      name: !form.raffi_name?.trim(),
    }),
    [form.raffi_name]
  );

  const onText =
    (key: keyof RAFFIForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value }));

  const onImage =
    (key: keyof RAFFIForm) =>
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const url = await readAsDataUrl(f);
      setForm((p) => ({ ...p, [key]: url }));
    };

  const save = () => {
    if (invalids.name) {
      setMessageBox?.((p: any) => ({
        ...p,
        isOpen: true,
        type: "message",
        message: "RAFFI Name is required.",
      }));
      return;
    }
    if ((form.lat == null) !== (form.lng == null)) {
      setMessageBox?.((p: any) => ({
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
    <Modal isOpen={isModalOpen} onClose={closeModal} zIndex={998} width="clamp(560px,56vw,840px)" height="80vh">
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
          <span className="details-title">Create RAFFI</span>
        </div>

        <div className="lgu-scroll">
          <Section title="Core Information">
            <Row label="RAFFI Name">
              <input
                type="text"
                value={form.raffi_name}
                onChange={onText("raffi_name")}
                placeholder="Enter name"
              />
            </Row>
            <Row label="RAFFI Description">
              <textarea
                value={form.raffi_description}
                onChange={onText("raffi_description")}
                placeholder="Short description"
                rows={3}
                style={{ width: "100%", resize: "vertical" }}
              />
            </Row>
          </Section>

          <Section title="Location">
            <Row label="Coordinates">
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
          </Section>

          <Section title="Attachment">
            <Row label="RAFFI Picture">
              <label className="filelike">
                <FontAwesomeIcon icon={faImage} />
                <span>Choose image</span>
                <input type="file" accept="image/*" onChange={onImage("raffi_picture")} hidden />
              </label>
              {!!form.raffi_picture && (
                <img src={form.raffi_picture} alt="RAFFI" className="img-thumb" />
              )}
            </Row>
          </Section>
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
  data: RAFFIRecord;
  onSaved?: (data: RAFFIRecord | null) => void;
};

export const RAFFIEditModal: React.FC<EditProps> = ({
  isModalOpen,
  closeModal,
  setMessageBox,
  data,
  onSaved,
}) => {
  const [form, setForm] = useState<RAFFIForm>({ ...data });
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!isModalOpen) return;
    setForm({ ...data });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen]);

  const invalids = useMemo(
    () => ({
      name: !form.raffi_name?.trim(),
    }),
    [form.raffi_name]
  );

  const onText =
    (key: keyof RAFFIForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value }));

  const onImage =
    (key: keyof RAFFIForm) =>
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const url = await readAsDataUrl(f);
      setForm((p) => ({ ...p, [key]: url }));
    };

  const save = () => {
    if (invalids.name) {
      setMessageBox?.((p: any) => ({
        ...p,
        isOpen: true,
        type: "message",
        message: "RAFFI Name is required.",
      }));
      return;
    }
    if ((form.lat == null) !== (form.lng == null)) {
      setMessageBox?.((p: any) => ({
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
    <Modal isOpen={isModalOpen} onClose={closeModal} zIndex={998} width="clamp(560px,56vw,840px)" height="80vh">
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
          <span className="details-title">Edit RAFFI</span>
        </div>

        <div className="lgu-scroll">
          <Section title="Core Information">
            <Row label="RAFFI Name">
              <input type="text" value={form.raffi_name} onChange={onText("raffi_name")} />
            </Row>
            <Row label="RAFFI Description">
              <textarea
                value={form.raffi_description}
                onChange={onText("raffi_description")}
                rows={3}
                style={{ width: "100%", resize: "vertical" }}
              />
            </Row>
          </Section>

          <Section title="Location">
            <Row label="Coordinates">
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
          </Section>

          <Section title="Attachment">
            <Row label="RAFFI Picture">
              <label className="filelike">
                <FontAwesomeIcon icon={faImage} />
                <span>Choose image</span>
                <input type="file" accept="image/*" onChange={onImage("raffi_picture")} hidden />
              </label>
              {!!form.raffi_picture && (
                <img src={form.raffi_picture} alt="RAFFI" className="img-thumb" />
              )}
            </Row>
          </Section>
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
   DELETE (frontend-only)
===========================================================================*/
type DeleteProps = BaseModalProps & {
  targetName?: string;
  onConfirm?: () => void;
};

export const RAFFIDeleteModal: React.FC<DeleteProps> = ({
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
          <span className="details-title">Delete RAFFI</span>
        </div>
        <p style={{ color: "#374151", marginBottom: 16 }}>
          Are you sure you want to delete <b>{targetName ?? "this RAFFI record"}</b>? This action cannot be undone.
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

function LockIcon() {
  return (
    <span title="Prefetched and locked">
      <FontAwesomeIcon icon={faLock} style={{ color: "#64748b" }} />
    </span>
  );
}

/* Small inline style for the pin/map button */
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
