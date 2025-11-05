// Modals/RAFIInfrastructure.tsx
// - Pure frontend modals (no API calls here)
// - Emits onCreated / onSaved / onDeleted to parent
// - Uses SweetAlert2 for validation + confirmations

import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "../../../../components/Page_Furniture/Modals";
import { MapViewWithSearch } from "../../../procurement_inventory/procurement_inventory/Tabs/MapViewWithSearch";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage, faLock, faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";
import "../../css/LGUModal.css";
import defaultpicture from "../../../../../public/images/defaultpicture.jpg";
import Swal from "sweetalert2";

/* ===============================================================
   Types (frontend only)
================================================================*/
// RAFIInfrastructure.tsx

export type RAFFIEditForm = {
  rafi_name: string;
  lat?: number | null;
  lng?: number | null;
  rafi_desc?: string | null;   // allow null
  rafi_pic?: string | null;    // allow null
};

export type RAFFIRow = RAFFIEditForm & { rafi_id?: number; lgu_id?: number };

export type LGUMin = {
  id: number;
  lgu_name: string;
  lat?: number | null;
  lng?: number | null;
};

/* ===============================================================
   Helpers
================================================================*/
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

const CEBU_FALLBACK: [number, number] = [10.3157, 123.8854];

/* ===============================================================
   VIEW MODAL
================================================================*/
export const RAFFIViewModal: React.FC<{
  isOpen?: boolean;
  onClose: () => void;
  data?: RAFFIRow | null;
}> = ({ isOpen = true, onClose, data }) => {
  const norm: RAFFIRow = {
    rafi_id: data?.rafi_id,
    lgu_id: data?.lgu_id,
    rafi_name: data?.rafi_name || "",
    rafi_desc: data?.rafi_desc || "",
    rafi_pic: data?.rafi_pic || null,
    lat: data?.lat ?? null,
    lng: data?.lng ?? null,
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} zIndex={998} width="clamp(560px, 56vw, 840px)" height="86vh">
      <div className="modal-container lgu-modal">
        <div className="horizontal-container">
          <span className="title-modal-text">RAFFI Infrastructure</span>
        </div>

        <div className="lgu-scroll">
          {!data ? (
            <div style={{ padding: 12, color: "#6b7280" }}>No data.</div>
          ) : (
            <>
              <Section title="RAFFI Details">
                <DL label="Name" value={norm.rafi_name || "—"} />
                <DL label="Description" value={norm.rafi_desc || "—"} />
                <DL label="Location" value={fmtLL(norm.lat, norm.lng)} />
              </Section>

              <Section title="Image">
                <div className="lgu-media-row">
                  <ImgOrPlaceholder label="RAFFI Picture" src={norm.rafi_pic || defaultpicture} />
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
   CREATE MODAL
================================================================*/
export const RAFFICreateModal: React.FC<{
  isOpen?: boolean;
  onClose: () => void;
  onCreated?: (created: RAFFIRow) => void;
  lgu?: LGUMin | null;                     // pass LGU for center
  lguCoordinate?: [number, number] | null; // or a tuple
}> = ({ isOpen = true, onClose, onCreated, lgu, lguCoordinate }) => {
  const [form, setForm] = useState<RAFFIEditForm>({
    rafi_name: "",
    lat: null,
    lng: null,
    rafi_desc: "",
    rafi_pic: null,
  });
  const [locationPickerIsOpen, setLocationPickerIsOpen] = useState(false);

  const lguCenter = useMemo<[number, number]>(() => {
    const fromTuple = toTuple(lguCoordinate);
    const lat = Number(lgu?.lat);
    const lng = Number(lgu?.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng];
    if (fromTuple) return fromTuple;
    return CEBU_FALLBACK;
  }, [lgu, lguCoordinate]);

  useEffect(() => {
    setForm((p) => ({ ...p, lat: lguCenter[0], lng: lguCenter[1] }));
  }, [lguCenter]);
const onImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const url = await readAsDataUrl(file);
  setForm((prev) => ({ ...prev, rafi_pic: url }));  // ✅ correct key
};


  const onLocationSelectSubmit = (_addr: string, coords: [number, number]) => {
    setForm((prev) => ({ ...prev, lat: coords[0], lng: coords[1] }));
  };

  const validate = () => {
    const errors: string[] = [];
    if (!form.rafi_name?.trim()) errors.push("• Name is required");
    if (form.lat == null || form.lng == null) errors.push("• Location is required");
    if (errors.length) {
      Swal.fire({
        icon: "warning",
        title: "Please complete the form",
        html: errors.join("<br/>"),
        confirmButtonText: "OK",
      });
      return false;
    }
    return true;
  };

  const handleCreate = () => {
    if (!validate()) return;
    const created: RAFFIRow = {
      rafi_id: undefined, // parent will set from API response
      rafi_name: form.rafi_name.trim(),
      rafi_desc: form.rafi_desc || "",
      rafi_pic: form.rafi_pic || null,
      lat: form.lat ?? null,
      lng: form.lng ?? null,
    };
    onCreated?.(created);
    onClose();
  };

  return (
    <>
      {locationPickerIsOpen && (
        <MapViewWithSearch
          onClose={() => setLocationPickerIsOpen(false)}
          defaultValue={{
            address: form.rafi_name || lgu?.lgu_name || "RAFFI (LGU center)",
            coordinates: lguCenter,
          }}
          onSubmit={onLocationSelectSubmit}
          changeAddressOnclik={false}
          autoSearch={false}
        />
      )}

      <Modal isOpen={isOpen} onClose={onClose} zIndex={998} width="clamp(560px, 56vw, 840px)" height="86vh">
        <div className="modal-container lgu-modal">
          <div className="horizontal-container">
            <span className="details-title">Create RAFFI</span>
          </div>

          <div className="lgu-scroll">
            <Section title="Basic Information">
              <Row label="Name">
                <input
                  type="text"
                  value={form.rafi_name}
                  onChange={(e) => setForm((p) => ({ ...p, rafi_name: e.target.value }))}
                  placeholder="Enter RAFFI name"
                  required
                />
              </Row>

              <Row label="Description">
                <textarea
                  value={form.rafi_desc ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, rafi_desc: e.target.value }))}
                  placeholder="Short description"
                  rows={3}
                />
              </Row>

              <Row label="Location">
                <div style={{ display: "flex", alignItems: "center", width: "100%", gap: 8 }}>
                  <input type="text" readOnly value={fmtLL(form.lat, form.lng)} style={{ flex: 1 }} />
                  <button
                    type="button"
                    onClick={() => setLocationPickerIsOpen(true)}
                    title="Pick location on map"
                    style={pinBtnStyle}
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
                {form.rafi_pic && <img src={form.rafi_pic} alt="RAFFI" className="img-thumb" />}
              </Row>
            </Section>
          </div>

          <div className="action-button">
            <button style={{ background: "#749AB6", color: "#fff" }} onClick={handleCreate}>ADD</button>
            <button style={{ background: "rgb(248, 75, 77)", color: "rgb(255, 255, 255)" }} onClick={onClose}>Cancel</button>
          </div>
        </div>
      </Modal>
    </>
  );
};

/* ===============================================================
   EDIT MODAL
================================================================*/
export const RAFFIEditModal: React.FC<{
  isOpen?: boolean;
  onClose: () => void;
  data?: RAFFIRow | null;
  onSaved?: (updated: RAFFIRow) => void;
  onDeleted?: (id: number) => void;
  lgu?: LGUMin | null;
  lguCoordinate?: [number, number] | null;
}> = ({ isOpen = true, onClose, data, onSaved, onDeleted, lgu, lguCoordinate }) => {
  const defaults: RAFFIRow = {
    rafi_id: undefined,
    lgu_id: lgu?.id,
    rafi_name: "",
    lat: null,
    lng: null,
    rafi_desc: "",
    rafi_pic: null,
  };

  const [form, setForm] = useState<RAFFIRow>({ ...defaults, ...(data || {}) });
  const [locationPickerIsOpen, setLocationPickerIsOpen] = useState(false);

  useEffect(() => {
    setForm({ ...defaults, ...(data || {}) });
  }, [data]);

  const center = useMemo<[number, number]>(() => {
    if (form.lat != null && form.lng != null && Number.isFinite(+form.lat) && Number.isFinite(+form.lng)) {
      return [Number(form.lat), Number(form.lng)];
    }
    const lat = Number(lgu?.lat);
    const lng = Number(lgu?.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng];
    return toTuple(lguCoordinate) ?? CEBU_FALLBACK;
  }, [form.lat, form.lng, lgu, lguCoordinate]);

  const onLocationSelectSubmit = (_addr: string, coords: [number, number]) => {
    setForm((prev) => ({ ...prev, lat: coords[0], lng: coords[1] }));
  };

 
const onImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const url = await readAsDataUrl(file);
  setForm(prev => ({ ...prev, rafi_pic: url }));  // <-- use rafi_pic (not 'pic')
};


  const validate = () => {
    const errors: string[] = [];
    if (!form.rafi_name?.trim()) errors.push("• Name is required");
    if (form.lat == null || form.lng == null) errors.push("• Location is required");
    if (errors.length) {
      Swal.fire({
        icon: "warning",
        title: "Please complete the form",
        html: errors.join("<br/>"),
        confirmButtonText: "OK",
      });
      return false;
    }
    return true;
  };

  const handleSave = () => {
    if (!validate()) return;
    const updated: RAFFIRow = {
      rafi_id: form.rafi_id ?? data?.rafi_id,
      lgu_id: form.lgu_id ?? data?.lgu_id ?? lgu?.id,
      rafi_name: form.rafi_name.trim(),
      rafi_desc: form.rafi_desc || "",
      rafi_pic: form.rafi_pic || null,
      lat: form.lat ?? null,
      lng: form.lng ?? null,
    };
    onSaved?.(updated);
    onClose();
  };

  const handleDelete = async () => {
    const id = Number(form.rafi_id || data?.rafi_id);
    if (!id) return onClose();
    const res = await Swal.fire({
      icon: "question",
      title: "Delete this RAFFI?",
      text: "This action cannot be undone.",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#F84B4D",
    });
    if (res.isConfirmed) {
      onDeleted?.(id);
      onClose();
    }
  };

  return (
    <>
      {locationPickerIsOpen && (
        <MapViewWithSearch
          onClose={() => setLocationPickerIsOpen(false)}
          defaultValue={{ address: form.rafi_name || lgu?.lgu_name || "RAFFI Location", coordinates: center }}
          onSubmit={onLocationSelectSubmit}
          changeAddressOnclik={false}
          autoSearch={false}
        />
      )}

      <Modal isOpen={isOpen} onClose={onClose} zIndex={998} width="clamp(560px, 56vw, 840px)" height="86vh">
        <div className="modal-container lgu-modal">
          <div className="horizontal-container">
            <span className="details-title">Edit RAFFI Details</span>
          </div>

          <div className="lgu-scroll">
            <Section title="Basic Information">
              <Row label="Name">
                <input
                  type="text"
                  value={form.rafi_name}
                  onChange={(e) => setForm((p) => ({ ...p, rafi_name: e.target.value }))}
                  placeholder="Enter RAFFI name"
                  required
                />
              </Row>

              <Row label="Description">
                <textarea
                  value={form.rafi_desc ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, rafi_desc: e.target.value }))}
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
                    onClick={() => setLocationPickerIsOpen(true)}
                    title="Pick location on map"
                    style={pinBtnStyle}
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
                {form.rafi_pic && <img src={form.rafi_pic} alt="RAFFI" className="img-thumb" />}
              </Row>
            </Section>
          </div>

          <div className="action-button">
            <button style={{ background: "#749AB6", color: "#fff" }} onClick={handleSave}>Save</button>
            <button style={{ background: "#F84B4D", color: "#fff" }} onClick={handleDelete}>Delete</button>
            <button style={{ background: "rgb(248, 75, 77)", color: "rgb(255, 255, 255)" }} onClick={onClose}>Cancel</button>
          </div>
        </div>
      </Modal>
    </>
  );
};

/* ===============================================================
   Presentational helpers
================================================================*/
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="section-block" style={{ marginTop: 12 }}>
      <h3 className="section-title" style={{ marginBottom: 8 }}>{title}</h3>
      <div className="lgu-modal-form">{children}</div>
    </div>
  );
}

function Row({ label, children, locked, hint }: { label: string; children: React.ReactNode; locked?: boolean; hint?: string }) {
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

function DL({ label, value, locked, invalid }: { label: string; value: React.ReactNode; locked?: boolean; invalid?: boolean }) {
  return (
    <div className="lgu-row" style={{ padding: "4px 0" }}>
      <div className="item-details-identifier" style={{ fontWeight: 700 }}>{label}</div>
      <div style={{ color: invalid ? "#b91c1c" : "#111827" }}>{value}</div>
      {locked ? <LockIcon /> : <span />}
    </div>
  );
}

function ImgOrPlaceholder({ label, src }: { label: string; src?: string | null }) {
  const hasImg = !!src;
  return (
    <div className="lgu-media">
      <div className="item-details-identifier" style={{ marginBottom: 6 }}>{label}</div>
      {hasImg ? <img src={src as string} alt={label} className="img-thumb" /> : <div className="img-placeholder">No image</div>}
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
