// LGUofficerSuperAdmin.tsx
import { useEffect, useState } from "react";
import "../css/LGUofficerSuperAdmin.css";
import "../../response_dashboard/DefaultListViewStyle.scss";
import { API } from "../../../API_Handler/Axio_API_Handler";
import { MessageBox } from "../../../components/Page_Furniture/MessageBox";
import {
  SuperAdminLGU,
  type BarangaySummary,
} from "../../../API_Handler/lguprofiling/SuperAdminLGU";

import Swal from "sweetalert2";
import { Link } from "react-router-dom";

// ✅ LGU modals
import { MyLGUViewModal, MyLGUEditModal } from "./Modals/LGUModals";

// ✅ Barangay modals
import { BarangayEditModal, BarangayViewModal } from "./Modals/BarangayModal";

// ✅ RAFFI modals + types (type-only import for safety)
import {
  RAFFIViewModal,
  RAFFICreateModal,
  RAFFIEditModal,
} from "./Modals/RAFIInfrastructure";
import type { RAFFIRow as RAFIModalRow } from "./Modals/RAFIInfrastructure";

/* ========================= PAGINATION ========================= */
const PAGE_SIZE = 10;

type PaginationProps = {
  page: number;
  pageSize?: number;
  total: number;
  onPageChange: (p: number) => void;
};

const Pagination: React.FC<PaginationProps> = ({
  page,
  pageSize = PAGE_SIZE,
  total,
  onPageChange,
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const go = (p: number) => onPageChange(Math.min(Math.max(1, p), totalPages));

  return (
    <div
      className="table-pagination"
      style={{
        display: "flex",
        alignItems: "center",
        gap: ".5rem",
        justifyContent: "space-between",
        padding: ".75rem 0",
      }}
    >
      <span style={{ fontSize: ".9rem", opacity: 0.85 }}>
        Showing <strong>{from}-{to}</strong> of <strong>{total}</strong>
      </span>
      <div style={{ display: "flex", gap: ".5rem" }}>
        <button className="action-btn" onClick={() => go(1)} disabled={page === 1}>
          First
        </button>
        <button className="action-btn" onClick={() => go(page - 1)} disabled={page === 1}>
          Prev
        </button>
        <span style={{ padding: ".25rem .5rem" }}>
          Page {page} / {totalPages}
        </span>
        <button className="action-btn" onClick={() => go(page + 1)} disabled={page === totalPages}>
          Next
        </button>
        <button className="action-btn" onClick={() => go(totalPages)} disabled={page === totalPages}>
          Last
        </button>
      </div>
    </div>
  );
};

/* ========================= TYPES ========================= */
type LGURow = {
  id: number;
  lgu_name: string;
  lgu_classification: string;
  mayor?: string | null;
  lgu_contact?: string | null;
  population?: number | null;
  lat?: number | null;
  lng?: number | null;
};

type BarangayRow = {
  id: number | string;
  name: string;
  lat?: number | null;
  lng?: number | null;
  baranggay_pic?: string | null;
  contact_info?: string | null;
  barangay_captain?: string | null;
  household_count?: number | null;
  total_population?: number | null;
  lgu_id: number;
  evacucation_center_id?: number | null;
  evacucation_center_name?: string | null;
  common_hazards?: string[] | null;
  barangay_pwd?: number | null;
  barangay_senior?: number | null;
  barangay_children?: number | null;
};

/**
 * RAFFI type used in THIS page:
 * - extend the modal type to include lgu_id (useful for table/filtering)
 * - keep rafi_desc / rafi_pic nullable (matches backend + modal)
 */
type RAFFIRow = RAFIModalRow & {
  lgu_id?: number | null;
};

const LGUofficerSuperAdmin: React.FC = () => {
  const [selectedData, setSelectedData] = useState<any>(null);
  const [activeModal, setActiveModal] = useState<
    "" | "view-lgu" | "edit-modal" | "view-barangay" | "edit-barangay" | "view-raffi" | "edit-raffi"
  >("");

  // === LGU state ===
  const [lguList, setLguList] = useState<LGURow[]>([]);
  const [loadingLGUs, setLoadingLGUs] = useState(true);
  const [lguError, setLguError] = useState<string | null>(null);
  const [selectedLGUId, setSelectedLGUId] = useState<number | null>(null);

  // Barangay view modal state
  const [viewBrgyOpen, setViewBrgyOpen] = useState(false);
  const [viewBrgyLoading, setViewBrgyLoading] = useState(false);
  const [viewBrgyError, setViewBrgyError] = useState<string | null>(null);
  const [viewBrgyData, setViewBrgyData] = useState<BarangaySummary | null>(null);

  // === Barangay list state ===
  const [barangays, setBarangays] = useState<BarangayRow[]>([]);
  const [loadingBarangays, setLoadingBarangays] = useState(false);
  const [barangayError, setBarangayError] = useState<string | null>(null);

  // === RAFFI state ===
  const [raffi, setRaffi] = useState<RAFFIRow[]>([]);
  const [loadingRaffi, setLoadingRaffi] = useState(false);
  const [raffiError, setRaffiError] = useState<string | null>(null);

  // RAFFI modal states (✅ fix: boolean for create)
  const [createRaffiOpen, setCreateRaffiOpen] = useState(false);
  const [viewRaffiData, setViewRaffiData] = useState<RAFIModalRow | null>(null);
  const [editRaffiData, setEditRaffiData] = useState<RAFIModalRow | null>(null);

  // === Pagination ===
  const [lguPage, setLguPage] = useState(1);
  const [brgyPage, setBrgyPage] = useState(1);
  const [raffiPage, setRaffiPage] = useState(1);

  useEffect(() => {
    setLguPage(1);
  }, [lguList]);
  useEffect(() => {
    setBrgyPage(1);
  }, [barangays, selectedLGUId]);
  useEffect(() => {
    setRaffiPage(1);
  }, [raffi, selectedLGUId]);

  const lguPaged = lguList.slice((lguPage - 1) * PAGE_SIZE, lguPage * PAGE_SIZE);
  const barangaysPaged = barangays.slice((brgyPage - 1) * PAGE_SIZE, brgyPage * PAGE_SIZE);
  const raffiPaged = raffi.slice((raffiPage - 1) * PAGE_SIZE, raffiPage * PAGE_SIZE);

  const openModal = (type: typeof activeModal, selected: any = null) => {
    setSelectedData(selected ?? null);
    setActiveModal(type);
  };

  const closeModal = () => {
    setActiveModal("");
    setSelectedData(null);
  };

  const fmt = (v: any) => (v === null || v === undefined || v === "" ? "—" : String(v));

  /* ========================= RAFFI OPEN/CLOSE HELPERS ========================= */
  function openCreateRaffi() {
    if (!selectedLGUId) {
      Swal.fire({ icon: "info", title: "Pick an LGU first" });
      return;
    }
    setCreateRaffiOpen(true);
  }
  function openViewRaffi(row: RAFFIRow) {
    setViewRaffiData(row);
    setActiveModal("view-raffi");
  }
  function openEditRaffi(row: RAFFIRow) {
    setEditRaffiData(row);
    setActiveModal("edit-raffi");
  }

  /* ========================= FETCHERS ========================= */
  const fetchLGUs = async () => {
    try {
      setLoadingLGUs(true);
      setLguError(null);
      const { data } = await API.get<LGURow[]>("/lgu_profiling/lgus");
      setLguList(data);
      if (data.length && selectedLGUId == null) setSelectedLGUId(data[0].id);
    } catch (e: any) {
      setLguError(e?.response?.data?.detail ?? e?.message ?? "Failed to load LGUs.");
    } finally {
      setLoadingLGUs(false);
    }
  };

  async function openViewBarangay(row: BarangayRow) {
    setViewBrgyOpen(true);
    setViewBrgyLoading(true);
    setViewBrgyError(null);
    setViewBrgyData(null);
    try {
      const full = await SuperAdminLGU.getOneBarangay(Number(row.id));
      setViewBrgyData(full);
    } catch (e: any) {
      setViewBrgyError(e?.response?.data?.detail ?? e?.message ?? "Failed to load barangay.");
    } finally {
      setViewBrgyLoading(false);
    }
  }

  async function handleCreateRaffi(draft: {
    rafi_name: string;
    lat: number | null;
    lng: number | null;
    rafi_desc?: string | null;
    rafi_pic?: string | null;
  }) {
    if (!selectedLGUId) return;
    try {
     const saved = await SuperAdminLGU.createRAFFI(selectedLGUId, {
  rafi_name: draft.rafi_name,
  lat: Number(draft.lat),
  lng: Number(draft.lng),
  rafi_desc: draft.rafi_desc ?? null,
  rafi_pic: draft.rafi_pic ?? null,
});

// normalize response before inserting
const row: RAFFIRow = {
  rafi_id:  saved.rafi_id,
  lgu_id:   saved.lgu_id,
  rafi_name: saved.rafi_name ?? saved.raffi_name,
  rafi_desc: saved.rafi_desc ?? saved.raffi_desc,
  rafi_pic:  saved.rafi_pic  ?? saved.raffi_pic,
  lat:       Number(saved.lat),
  lng:       Number(saved.lng),
};
      setRaffi((prev) => [row, ...prev]);
      Swal.fire({ icon: "success", title: "RAFFI created" });
    } 
    catch (e: any) {
  const serverDetail =
    e?.response?.data?.detail ??
    JSON.stringify(e?.response?.data ?? e?.message ?? "Unknown error");

  Swal.fire({
    icon: "error",
    title: "Create failed",
    text: String(serverDetail),
  });
}

  }

 async function handleSaveRaffi(updated: RAFFIRow) {
  if (!updated.rafi_id) {
    Swal.fire({ icon: "error", title: "Update failed", text: "Missing RAFFI ID." });
    return;
  }
  try {
    const saved = await SuperAdminLGU.updateRAFFI(updated.rafi_id, {
      rafi_name: updated.rafi_name,
      lat: Number(updated.lat),
      lng: Number(updated.lng),
      rafi_desc: updated.rafi_desc ?? null,
      rafi_pic: updated.rafi_pic ?? null,
    });

    const row = normalizeRaffi(saved);
    setRaffi((prev) => prev.map((r) => (r.rafi_id === row.rafi_id ? row : r)));

    Swal.fire({ icon: "success", title: "Changes saved" });
  } catch (e: any) {
    Swal.fire({
      icon: "error",
      title: "Update failed",
      text: e?.response?.data?.detail ?? e?.message ?? "Unknown error",
    });
  }
}

  async function handleDeleteRaffi(rafiId: number) {
    try {
      const res = await Swal.fire({
        icon: "question",
        title: "Delete this RAFFI?",
        text: "This action cannot be undone.",
        showCancelButton: true,
        confirmButtonText: "Delete",
        confirmButtonColor: "#F84B4D",
      });
      if (!res.isConfirmed) return;

      await SuperAdminLGU.deleteRAFFI(rafiId);
      setRaffi((prev) => prev.filter((r) => r.rafi_id !== rafiId));
      Swal.fire({ icon: "success", title: "Deleted" });
    } catch (e: any) {
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: e?.response?.data?.detail ?? e?.message ?? "Unknown error",
      });
    }
  }

  const fetchBarangays = async (lguId: number) => {
    try {
      setLoadingBarangays(true);
      setBarangayError(null);
      const { data } = await API.get<BarangayRow[]>(
        `/lgu_profiling/lgus/${lguId}/barangays`
      );
      setBarangays(data);
    } catch (e: any) {
      setBarangayError(e?.response?.data?.detail ?? e?.message ?? "Failed to load barangays.");
      setBarangays([]);
    } finally {
      setLoadingBarangays(false);
    }
  };

  const fetchRaffi = async (lguId: number) => {
    try {
      setLoadingRaffi(true);
      setRaffiError(null);
      // LGUofficerSuperAdmin.tsx
const { data } = await API.get<any[]>(`/lgu_profiling/lgus/${lguId}/raffi`);
const normalized = data.map(d => ({
  ...d,
  rafi_name:  d.rafi_name  ?? d.raffi_name ?? "—",  // accept either
  rafi_desc:  d.rafi_desc  ?? d.raffi_desc ?? "—",
  rafi_pic:   d.rafi_pic   ?? d.raffi_pic  ?? null,
}));
setRaffi(normalized);

    } catch (e: any) {
      setRaffiError(e?.response?.data?.detail ?? e?.message ?? "Failed to load RAFFI entries.");
      setRaffi([]);
    } finally {
      setLoadingRaffi(false);
    }
  };

  /* ========================= HELPERS ========================= */
  function normalizeRaffi(api: any): RAFFIRow {
  return {
    rafi_id: Number(api.rafi_id),
    lgu_id: Number(api.lgu_id),
    rafi_name: api.rafi_name ?? api.raffi_name ?? "",
    rafi_desc: (api.rafi_desc ?? api.raffi_desc) ?? null,
    rafi_pic:  (api.rafi_pic  ?? api.raffi_pic)  ?? null,
    lat: Number(api.lat),
    lng: Number(api.lng),
  };
}

  function computeBrgyPatch(oldB: BarangaySummary, nextB: Partial<BarangaySummary>) {
    const patch: Partial<BarangaySummary> = {};
    ([
      "name",
      "lat",
      "lng",
      "baranggay_pic",
      "contact_info",
      "barangay_captain",
      "household_count",
      "total_population",
      "evacucation_center_id",
      "evacucation_center_name",
      "common_hazards",
      "barangay_pwd",
      "barangay_senior",
      "barangay_children",
      "lgu_id",
    ] as const).forEach((k) => {
      if (JSON.stringify(oldB[k]) !== JSON.stringify(nextB[k])) {
        // @ts-expect-error index type ok here
        patch[k] = nextB[k];
      }
    });
    return patch;
  }

  /* ========================= EFFECTS ========================= */
  useEffect(() => {
    fetchLGUs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedLGUId != null) {
      fetchBarangays(selectedLGUId);
      fetchRaffi(selectedLGUId);
    } else {
      setBarangays([]);
      setRaffi([]);
    }
  }, [selectedLGUId]);

  /* ========================= RENDER ========================= */
  const selectedLGU = selectedLGUId
    ? lguList.find((l) => l.id === selectedLGUId) ?? null
    : null;

  return (
    <>
      {/* ✅ LGU MODALS */}
      {activeModal === "view-lgu" && selectedData && (
        <MyLGUViewModal
          closeModal={closeModal}
          onOpenEdit={() => openModal("edit-modal", selectedData)}
          data={selectedData}
        />
      )}
      {activeModal === "edit-modal" && selectedData && (
        <MyLGUEditModal
          closeModal={() => {
            closeModal();
            fetchLGUs();
          }}
          data={selectedData}
        />
      )}

      {/* ✅ BARANGAY MODALS */}
      {viewBrgyOpen && (
        <BarangayViewModal
          isOpen
          onClose={() => setViewBrgyOpen(false)}
          data={viewBrgyData}
          loading={viewBrgyLoading}
          error={viewBrgyError}
        />
      )}

      {activeModal === "edit-barangay" && selectedData && (
        <BarangayEditModal
          onClose={closeModal}
          data={selectedData}
          lgu_name={selectedLGU?.lgu_name ?? ""}
          lgu_coordinate={[selectedLGU?.lat ?? 0, selectedLGU?.lng ?? 0]}
          onSaved={(updated) => {
            setBarangays((prev) =>
              prev.map((x) => (x.id === updated.id ? { ...x, ...updated } : x))
            );
          }}
        />
      )}

      {/* ✅ RAFFI MODALS */}
      {/* Create */}
      {createRaffiOpen && selectedLGU && (
        <RAFFICreateModal
          isOpen
          onClose={() => setCreateRaffiOpen(false)}
          lgu={{
            id: selectedLGU.id,
            lgu_name: selectedLGU.lgu_name,
            lat: selectedLGU.lat,
            lng: selectedLGU.lng,
          }}
          lguCoordinate={[selectedLGU?.lat ?? 0, selectedLGU?.lng ?? 0]}
          onCreated={(draft) => {
            handleCreateRaffi({
              rafi_name: draft.rafi_name,
              lat: draft.lat ?? null,
              lng: draft.lng ?? null,
              rafi_desc: draft.rafi_desc ?? null,
              rafi_pic: draft.rafi_pic ?? null,
            });
            setCreateRaffiOpen(false);
          }}
        />
      )}

      {/* View */}
      {activeModal === "view-raffi" && viewRaffiData && (
        <RAFFIViewModal
          isOpen
          onClose={() => {
            setViewRaffiData(null);
            setActiveModal("");
          }}
          data={viewRaffiData}
        />
      )}

      {/* Edit */}
      {activeModal === "edit-raffi" && editRaffiData && selectedLGU && (
        <RAFFIEditModal
          isOpen
          onClose={() => {
            setEditRaffiData(null);
            setActiveModal("");
          }}
          data={editRaffiData}
          lgu={{
            id: selectedLGU.id,
            lgu_name: selectedLGU.lgu_name,
            lat: selectedLGU.lat,
            lng: selectedLGU.lng,
          }}
          lguCoordinate={[selectedLGU?.lat ?? 0, selectedLGU?.lng ?? 0]}
          onSaved={(u) => handleSaveRaffi(u as RAFFIRow)}
          onDeleted={(id) => handleDeleteRaffi(id)}
        />
      )}

      <div className="app-container">
        {/* === LGU TABLE === */}
        <section className="lgu-table-section" style={{ marginBottom: "2rem" }}>
          <div className="lgu-header" style={{ padding: "1rem" }}>
            <h1>
              <b>LGU Records</b>
            </h1>
            {selectedLGU && (
              <span style={{ marginLeft: "auto", fontSize: ".9rem", opacity: 0.8 }}>
                Selected: <strong>{selectedLGU.lgu_name}</strong>
              </span>
            )}
          </div>
          <div className="lgu-table-wrap">
            <table className="barangay-table" id="lgu-specific">
              <thead>
                <tr>
                  <th>LGU Name</th>
                  <th>Classification</th>
                  <th>Mayor</th>
                  <th>Contact</th>
                  <th className="col-action">Action</th>
                </tr>
              </thead>
              <tbody>
                {loadingLGUs ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "1rem" }}>
                      Loading LGUs…
                    </td>
                  </tr>
                ) : lguError ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "1rem", color: "#c62828" }}>
                      {lguError}
                    </td>
                  </tr>
                ) : lguList.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "1rem" }}>
                      No LGUs to display.
                    </td>
                  </tr>
                ) : (
                  lguPaged.map((row) => (
                    <tr
                      key={row.id}
                      className={row.id === selectedLGUId ? "is-selected" : ""}
                      onClick={() => setSelectedLGUId(row.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>{fmt(row.lgu_name)}</td>
                      <td>{fmt(row.lgu_classification)}</td>
                      <td>{fmt(row.mayor)}</td>
                      <td>{fmt(row.lgu_contact)}</td>
                      <td className="col-action">
                        <button
                          className="action-btn view"
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal("view-lgu", row);
                          }}
                        >
                          View
                        </button>
                        <button
                          className="action-btn edit"
                          style={{ marginLeft: ".5rem" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal("edit-modal", row);
                          }}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {!loadingLGUs && !lguError && lguList.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan={5}>
                      <Pagination page={lguPage} total={lguList.length} onPageChange={setLguPage} />
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>

        {/* === BARANGAY TABLE === */}
        <section className="barangay-section">
          <div className="barangay-header">
            <h2>
              <b>Barangay Records</b> {selectedLGU ? `>  ${selectedLGU.lgu_name}` : "  "}
            </h2>
          </div>
          <div className="barangay-table-wrap">
            <table className="barangay-table">
              <thead>
                <tr>
                  <th>Barangay</th>
                  <th>Location</th>
                  <th>Captain</th>
                  <th>Evacuation</th>
                  <th className="col-action">Action</th>
                </tr>
              </thead>
              <tbody>
                {selectedLGUId == null ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "1rem" }}>
                      Select an LGU above to load barangays.
                    </td>
                  </tr>
                ) : loadingBarangays ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "1rem" }}>
                      Loading barangays…
                    </td>
                  </tr>
                ) : barangayError ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "1rem", color: "#c62828" }}>
                      {barangayError}
                    </td>
                  </tr>
                ) : barangays.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "1rem" }}>
                      No barangays to display.
                    </td>
                  </tr>
                ) : (
                  barangaysPaged.map((b) => (
                    <tr key={b.id}>
                      <td>{fmt(b.name)}</td>
                      <td>{b.lat && b.lng ? `${b.lat.toFixed(5)}, ${b.lng.toFixed(5)}` : "—"}</td>
                      <td>{fmt(b.barangay_captain)}</td>
                      <td>{b.evacucation_center_name ?? (b.evacucation_center_id ?? "—")}</td>
                      <td className="col-action">
                        <button className="action-btn view" onClick={() => openViewBarangay(b)}>
                          View
                        </button>
                        <button
                          className="action-btn edit"
                          style={{ marginLeft: ".5rem" }}
                          onClick={() => openModal("edit-barangay", b)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {!loadingBarangays && !barangayError && barangays.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan={5}>
                      <Pagination page={brgyPage} total={barangays.length} onPageChange={setBrgyPage} />
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>

        {/* === RAFFI TABLE === */}
        <section className="raffi-section" style={{ marginTop: "2rem" }}>
          <div className="raffi-header">
            <h2>
              <b>RAFFI Records </b> {selectedLGU ? `> ${selectedLGU.lgu_name}` : ""}
            </h2>
            <button className="add-raffi" onClick={openCreateRaffi}>
              Add
            </button>
          </div>
          <div className="raffi-table-wrap">
            <table className="barangay-table">
              <thead>
                <tr>
                  <th>RAFFI Name</th>
                  <th>Location</th>
                  <th>Description</th>
                  <th className="col-action">Action</th>
                </tr>
              </thead>
              <tbody>
                {selectedLGUId == null ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "1rem" }}>
                      Select an LGU above to load RAFFI entries.
                    </td>
                  </tr>
                ) : loadingRaffi ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "1rem" }}>
                      Loading RAFFI…
                    </td>
                  </tr>
                ) : raffiError ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "1rem", color: "#c62828" }}>
                      {raffiError}
                    </td>
                  </tr>
                ) : raffi.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "1rem" }}>
                      No RAFFI entries to display.
                    </td>
                  </tr>
                ) : (
                  raffiPaged.map((r) => (
                    <tr key={r.rafi_id}>
                      <td>{fmt(r.rafi_name)}</td>
                      <td>
                        {r.lat != null && r.lng != null
                          ? `${Number(r.lat).toFixed(5)}, ${Number(r.lng).toFixed(5)}`
                          : "—"}
                      </td>
                      <td>{fmt(r.rafi_desc)}</td>
                      <td className="col-action">
                        <button className="action-btn view" onClick={() => openViewRaffi(r)}>
                          View
                        </button>
                        <button
                          className="action-btn edit"
                          style={{ marginLeft: ".5rem" }}
                          onClick={() => openEditRaffi(r)}
                        >
                          Edit
                        </button>
                        <button className="action-btn delete" onClick={() => handleDeleteRaffi(Number(r.rafi_id))}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {!loadingRaffi && !raffiError && raffi.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan={4}>
                      <Pagination page={raffiPage} total={raffi.length} onPageChange={setRaffiPage} />
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>
      </div>
    </>
  );
};

export default LGUofficerSuperAdmin;
