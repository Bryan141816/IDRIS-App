// RAFFIModals.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "../../../../components/Page_Furniture/Modals";
import { MapViewWithSearch } from "../../../procurement_inventory/procurement_inventory/Tabs/MapViewWithSearch";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage, faLock, faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";
import "../../css/LGUModal.css";
import Swal from "sweetalert2";
import defaultpicture from "../../../../../public/images/defaultpicture.jpg";
import type { LGUOut } from "./LGUModals";
import { deleteRAFFI, createRAFFI, updateRAFFI, type RAFIOut as RAFIServerOut } from  "../../../../API_Handler/lguprofiling/RAFFI";

/* =========================
   Local Types (UI)
========================= */
export type RAFFIOut = RAFIServerOut;

export type RAFFIEditForm = {
  raffi_name: string;
  lat?: number | null;
  lng?: number | null;
  raffi_desc?: string | "";
  raffi_pic?: string; // dataURL for preview or raw URL
};

export type MyRAFFI = RAFFIEditForm;

/* =========================
   Tiny helpers
========================= */
const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });

function fmtLL(lat?: number | null, lng?: number | null) {
  if (lat == null || lng == null) return "—";
  const f = (n: number) => Number(n).toFixed(6);
  return `${f(Number(lat))}, ${f(Number(lng))}`;
}

function toTuple(v?: [number, number] | null): [number, number] | null {
  if (!Array.isArray(v) || v.length !== 2) return null;
  const a = Number(v[0]);
  const b = Number(v[1]);
  return Number.isFinite(a) && Number.isFinite(b) ? [a, b] : null;
}

function lguToTuple(lgu?: LGUOut | null): [number, number] | null {
  if (!lgu) return null;
  const lat = parseFloat(String(lgu.lat));
  const lng = parseFloat(String(lgu.lng));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) < 0.1 && Math.abs(lng) < 0.1) return null; // reject near 0,0
  return [lat, lng];
}

// Keep Cebu fallback ONLY for view/edit (not for create gating)
const CEBU_FALLBACK: [number, number] = [10.3157, 123.8854];

/* =========================================================================
   VIEW (RAFFI)
===========================================================================*/
type ViewProps = {
  closeModal: () => void;
  data: RAFIServerOut;
  onOpenEdit?: () => void;
  onDeleted?: (id: number) => void;
};

export const RAFFIViewModal: React.FC<ViewProps> = ({ closeModal, onOpenEdit, data, onDeleted }) => {
  const id = Number((data as any).rafi_id ?? (data as any).raffi_id);

  // normalize both spellings from backend
  const norm = {
    name: (data as any).rafi_name ?? (data as any).raffi_name ?? "",
    desc: (data as any).rafi_desc ?? (data as any).raffi_desc ?? "",
    pic:  (data as any).rafi_pic  ?? (data as any).raffi_pic  ?? null,
    lat:  Number((data as any).lat),
    lng:  Number((data as any).lng),
  };

  const doDelete = async () => {
    const c = await Swal.fire({
      title: "Delete RAFFI?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });
    if (!c.isConfirmed) return;

    try {
      await deleteRAFFI(id);
      Swal.fire("Deleted!", "RAFFI has been removed.", "success");
      onDeleted?.(id);
      closeModal();
    } catch (e) {
      console.error(e);
      Swal.fire("Error", "Failed to delete the record.", "error");
    }
  };

  return (
    <Modal isOpen={true} onClose={closeModal} zIndex={998} width="clamp(560px, 56vw, 840px)" height="86vh">
      <div className="modal-container lgu-modal">
        <div className="horizontal-container">
          <span className="title-modal-text">RAFFI Infrastructure</span>
        </div>

        <div className="lgu-scroll">
          {!data ? (
            <div style={{ padding: 12, color: "#6b7280" }}>
              No data yet. Click <b>Edit</b> to fill this in.
            </div>
          ) : (
            <>
              <Section title="RAFFI Details">
                <DL label="Name" value={norm.name || "—"} />
                <DL label="Description" value={norm.desc || "—"} />
                <DL label="Location" value={fmtLL(norm.lat, norm.lng)} />
              </Section>

              <Section title="Image">
                <div className="lgu-media-row">
                  <ImgOrPlaceholder
                    label="RAFFI Picture"
                    src={norm.pic ? norm.pic : defaultpicture}
                  />
                </div>
              </Section>
            </>
          )}
        </div>

        <div className="action-button">
          <button style={{ backgroundColor: "#F84B4D", color: "#fff" }} onClick={closeModal}>Close</button>
        </div>
      </div>
    </Modal>
  );
};

/* =========================================================================
   CREATE (RAFFI) — only if LGU has valid lat/lng; coords locked to LGU
===========================================================================*/
export const RAFFICreateModal: React.FC<{
  closeModal: () => void;
  onCreated?: (created: RAFIServerOut | RAFFIEditForm) => void;
  lgu?: LGUOut | null;                        // pass the whole LGU (preferred)
  lguCoordinate?: [number, number] | null;    // or just a tuple
}> = ({ closeModal, onCreated, lgu, lguCoordinate }) => {
  const defaults: RAFFIEditForm = {
    raffi_name: "",
    lat: null,
    lng: null,
    raffi_desc: "",
    raffi_pic: "",
  };

  const [form, setForm] = useState<RAFFIEditForm>(defaults);
  const [locationPickerIsOpen, setLocationPickerIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const openLocationPicker = () => setLocationPickerIsOpen(true);
  const closeLocationPicker = () => setLocationPickerIsOpen(false);

  // No Cebu fallback here: parent must gate this so lguCenter is non-null
  const lguCenter = useMemo<[number, number] | null>(() => {
    return lguToTuple(lgu) ?? toTuple(lguCoordinate) ?? null;
  }, [lgu, lguCoordinate]);

  // If somehow mounted without coords, don't render anything (defensive)
  if (!lguCenter) {
    console.warn("RAFFICreateModal opened without LGU coordinates.");
    return null;
  }

  // Seed/lock form coords to LGU center
  useEffect(() => {
    setForm((p) => ({ ...p, lat: lguCenter[0], lng: lguCenter[1] }));
  }, [lguCenter]);

  // Ignore picker-chosen coords; always keep LGU center
  const onLocationSelectSubmit = (_address: string, _coordinates: [number, number]) => {
    setForm((prev) => ({ ...prev, lat: lguCenter[0], lng: lguCenter[1] }));
  };

  const onImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await readAsDataUrl(file);
      setForm((prev) => ({ ...prev, raffi_pic: url }));
    } catch (err) {
      console.error("Failed to read image:", err);
    }
  };
const [validation, setValidation] = useState<{[key: string]: boolean}>({});

const validateForm = () => {
  const v: { [key: string]: boolean } = {};
  v.raffi_name = !form.raffi_name?.trim();
  v.raffi_desc = !form.raffi_desc?.trim();
  v.lat = form.lat == null;
  v.lng = form.lng == null;
  setValidation(v);
  return !Object.values(v).some(Boolean);
};

  const handleCreate = async () => {
    if (!validateForm()) {
    await Swal.fire({
      icon: "warning",
      title: "Incomplete or Invalid Form",
      text: "Please fill in all required fields. Fields with red highlight need your attention.",
      confirmButtonColor: "#f59e0b",
    });
    return;
  }
    if (!form.raffi_name.trim()) {
      Swal.fire({ icon: "warning", title: "Please enter a name" });
      return;
    }

    setIsSaving(true);
    try {
      const saved = await createRAFFI({
        raffi_name: form.raffi_name.trim(),
        lat: lguCenter[0],
        lng: lguCenter[1],
        raffi_desc: form.raffi_desc || undefined,
        raffi_pic: form.raffi_pic || undefined, // can be data URL
      });

      Swal.fire({
        icon: "success",
        title: "RAFFI created",
        confirmButtonColor: "#6d28d9",
      }).then(() => {
        onCreated?.(saved);
        closeModal();
      });
    } catch (e: any) {
      console.error("RAFFI create failed:", e?.response ?? e);
      Swal.fire({
        icon: "error",
        title: "Create failed",
        text:
          e?.response?.data?.detail ||
          e?.message ||
          "Something went wrong while saving. Please try again.",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {locationPickerIsOpen && (
        <MapViewWithSearch
          key={`map-${lguCenter[0].toFixed(6)}-${lguCenter[1].toFixed(6)}`} // force re-center
          onClose={closeLocationPicker}
          defaultValue={{
            address: form.raffi_name || lgu?.lgu_name || "RAFFI (LGU Center)",
            coordinates: lguCenter,
          }}
          onSubmit={onLocationSelectSubmit}
          changeAddressOnclik={false}
          autoSearch={false}
        />
      )}

      <Modal isOpen={true} onClose={closeModal} zIndex={998} width="clamp(560px, 56vw, 840px)" height="86vh">
        <div className="modal-container lgu-modal">
          <div className="horizontal-container">
            <span className="details-title">Create RAFFI</span>
          </div>

          <div className="lgu-scroll">
            <Section title="Basic Information">
              <Row label="Name">
                <input
                  type="text"
                  value={form.raffi_name}
                  onChange={(e) => setForm((p) => ({ ...p, raffi_name: e.target.value }))}
                  placeholder="Enter RAFFI name"
                  required
                  className={validation.raffi_name ? "input-invalid" : ""}
                />
              </Row>

              <Row label="Description">
                <textarea
                  value={form.raffi_desc ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, raffi_desc: e.target.value }))}
                  placeholder="Short description"
                  rows={3}
                  className={validation.raffi_desc ? "input-invalid" : ""}
                />
              </Row>

              <Row label="Location">
                <div style={{ display: "flex", alignItems: "center", width: "100%", gap: 8 }}>
                  <input type="text" readOnly value={fmtLL(form.lat, form.lng)} style={{ flex: 1 }} />
                  <button
                    type="button"
                    onClick={openLocationPicker}
                    title="View on map (centered to LGU)"
                    style={{
                      backgroundColor: "transparent",
                      border: "1px solid #ddd",
                      outline: "none",
                      color: "#3b82f6",
                      width: 44,
                      height: 44,
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

              <Row label="RAFFI Picture">
                <label className="filelike">
                  <FontAwesomeIcon icon={faImage} />
                  <span>Choose image</span>
                  <input type="file" accept="image/*" hidden onChange={onImage} />
                </label>
                {form.raffi_pic && <img src={form.raffi_pic} alt="RAFFI" className="img-thumb" />}
              </Row>
            </Section>
          </div>

          <div className="action-button">
            <button style={{ background: "#749AB6", color: "#fff" }} onClick={handleCreate} disabled={isSaving}>
              {isSaving ? "Adding..." : "ADD"}
            </button>
            <button style={{ background: "#F84B4D", color: "#fff" }} onClick={closeModal} disabled={isSaving}>
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

/* =========================================================================
   EDIT (RAFFI)
===========================================================================*/
export const RAFFIEditModal: React.FC<{
  closeModal: () => void;
  data?: RAFIServerOut;
  onSaved?: (updated: RAFIServerOut | RAFFIEditForm) => void;
  onDeleted?: (id: number) => void;
  lgu?: LGUOut | null;
  lguCoordinate?: [number, number] | null;
}> = ({ closeModal, data, onSaved, onDeleted, lgu, lguCoordinate }) => {

  // Normalize both spellings from backend into a single shape
  const normalize = (row?: RAFIServerOut) => {
    const r: any = row ?? {};
    return {
      rafi_id: r.rafi_id ?? r.raffi_id ?? undefined,
      raffi_name: r.raffi_name ?? r.rafi_name ?? "",
      raffi_desc: r.raffi_desc ?? r.rafi_desc ?? "",
      raffi_pic: r.raffi_pic ?? r.rafi_pic ?? "",
      lat: r.lat != null ? Number(r.lat) : null,
      lng: r.lng != null ? Number(r.lng) : null,
    } as RAFFIEditForm & { rafi_id?: number };
  };

  const normalized = normalize(data);

  const defaults: RAFFIEditForm = {
    raffi_name: "",
    lat: null,
    lng: null,
    raffi_desc: "",
    raffi_pic: "",
  };

  const [form, setForm] = useState<RAFFIEditForm>({ ...defaults, ...normalized });
  const [locationPickerIsOpen, setLocationPickerIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const openLocationPicker = () => setLocationPickerIsOpen(true);
  const closeLocationPicker = () => setLocationPickerIsOpen(false);

  useEffect(() => {
    setForm({ ...defaults, ...normalize(data) });
  }, [data]);

  const center = useMemo<[number, number]>(() => {
    if (form.lat != null && form.lng != null && Number.isFinite(+form.lat) && Number.isFinite(+form.lng)) {
      return [Number(form.lat), Number(form.lng)];
    }
    const fromLGU =
      (lgu?.lat != null && lgu?.lng != null)
        ? [Number(lgu.lat), Number(lgu.lng)]
        : null;
    return fromLGU ?? (lguCoordinate ?? CEBU_FALLBACK);
  }, [form.lat, form.lng, lgu, lguCoordinate]);

  useEffect(() => {
    if (locationPickerIsOpen && (form.lat == null || form.lng == null)) {
      setForm((p) => ({ ...p, lat: center[0], lng: center[1] }));
    }
  }, [locationPickerIsOpen, center, form.lat, form.lng]);

  const onLocationSelectSubmit = (_address: string, coordinates: [number, number]) => {
    setForm((prev) => ({ ...prev, lat: coordinates[0], lng: coordinates[1] }));
  };

  const onImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => setForm((prev) => ({ ...prev, raffi_pic: String(r.result) }));
    r.readAsDataURL(file);
  };

  const handleDeleteClick = async () => {
    const id = Number((data as any)?.rafi_id ?? (data as any)?.raffi_id);
    if (!id) return;

    const confirm = await Swal.fire({
      title: "Delete RAFFI?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });
    if (!confirm.isConfirmed) return;

    try {
      await deleteRAFFI(id);
      Swal.fire("Deleted!", "RAFFI has been removed.", "success");
      onDeleted?.(id);
      closeModal();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to delete the record.", "error");
    }
  };

  const handleSubmit = async () => {
    const id = (data as any)?.rafi_id ?? (data as any)?.raffi_id;
    if (!id) {
      console.error("RAFFIEditModal: missing rafi_id/raffi_id");
      return;
    }
    if (!form.raffi_name.trim()) {
      Swal.fire({ icon: "warning", title: "Please enter a name" });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        raffi_name: form.raffi_name.trim(),
        lat: form.lat == null ? undefined : Number(form.lat),
        lng: form.lng == null ? undefined : Number(form.lng),
        raffi_desc: form.raffi_desc || undefined,
        raffi_pic: form.raffi_pic || undefined,
      };

      const saved = await updateRAFFI(id, payload as any);

      Swal.fire({
        icon: "success",
        title: "RAFFI saved",
        confirmButtonColor: "#6d28d9",
      }).then(() => {
        onSaved?.(saved);
        closeModal();
      });
    } catch (e: any) {
      console.error("RAFFI save failed:", e?.response ?? e);
      Swal.fire({
        icon: "error",
        title: "Save failed",
        text:
          e?.response?.data?.detail ||
          e?.message ||
          "Something went wrong while saving. Please try again.",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {locationPickerIsOpen && (
        <MapViewWithSearch
          onClose={closeLocationPicker}
          defaultValue={{
            address: form.raffi_name || lgu?.lgu_name || "RAFFI Location",
            coordinates: center,
          }}
          onSubmit={onLocationSelectSubmit}
          changeAddressOnclik={false}
          autoSearch={false}
        />
      )}

      <Modal isOpen={true} onClose={closeModal} zIndex={998} width="clamp(560px, 56vw, 840px)" height="86vh">
        <div className="modal-container lgu-modal">
          <div className="horizontal-container">
            <span className="details-title">Edit RAFFI Details</span>
          </div>

          <div className="lgu-scroll">
            <Section title="Basic Information">
              <Row label="Name">
                <input
                  type="text"
                  value={form.raffi_name}
                  onChange={(e) => setForm((p) => ({ ...p, raffi_name: e.target.value }))}
                  placeholder="Enter RAFFI name"
                  required
                />
              </Row>

              <Row label="Description">
                <textarea
                  value={form.raffi_desc ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, raffi_desc: e.target.value }))}
                  placeholder="Short description"
                  rows={3}
                />
              </Row>

              <Row label="Location">
                <div style={{ display: "flex", alignItems: "center", width: "100%", gap: 8 }}>
                  <input
                    type="text"
                    readOnly
                    placeholder="Pick on map"
                    value={form.lat != null && form.lng != null ? `${form.lat}, ${form.lng}` : ""}
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
                      width: 44,
                      height: 44,
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

              <Row label="RAFFI Picture">
                <label className="filelike">
                  <FontAwesomeIcon icon={faImage} />
                  <span>Choose image</span>
                  <input type="file" accept="image/*" hidden onChange={onImage} />
                </label>
                {form.raffi_pic && <img src={form.raffi_pic} alt="RAFFI" className="img-thumb" />}
              </Row>
            </Section>
          </div>

          <div className="action-button">
            <button style={{ background: "#749AB6", color: "#fff" }} onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </button>
           
            <button style={{ background: "#F84B4D", color: "#fff" }} onClick={closeModal} disabled={isSaving}>
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

/* =========================
   Presentational helpers
========================= */
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

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexDirection: "column" }}>
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

function ImgOrPlaceholder({ label, src }: { label: string; src?: string | null }) {
  const hasImg = !!src;
  return (
    <div className="lgu-media">
      <div className="item-details-identifier" style={{ marginBottom: 6 }}>
        {label}
      </div>
      {hasImg ? (
        <img src={src as string} alt={label} className="img-thumb" />
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
