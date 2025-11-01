// LGUofficerSuperAdmin.tsx
import { useEffect, useState } from "react";
import "../css/LGUofficerSuperAdmin.css";
import "../../response_dashboard/DefaultListViewStyle.scss";
import { API } from "../../../API_Handler/Axio_API_Handler";
import { MessageBox } from "../../../components/Page_Furniture/MessageBox";
import { Link } from "react-router-dom";

// ✅ LGU modals
import {
  MyLGUViewModal,
  MyLGUEditModal,
  type LGUEditForm,
} from "./Modals/LGUModals";

// ✅ Barangay modals
import {
  BarangayViewModal,
  BarangayEditModal,
  BarangayCreateModal,
  BarangayDeleteModal,
  type MyBarangay,
} from "./Modals/BarangayModal";

// ✅ RAFFI modals
import {
  RAFFIViewModal,
  RAFFIEditModal,
  RAFFICreateModal,
  RAFFIDeleteModal,
  type RAFFIRecord,
} from "./Modals/RAFIInfrastructure";

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
        <button
          className="action-btn"
          onClick={() => go(page + 1)}
          disabled={page === totalPages}
        >
          Next
        </button>
        <button
          className="action-btn"
          onClick={() => go(totalPages)}
          disabled={page === totalPages}
        >
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
  common_hazards?: string[] | null;
  barangay_pwd?: number | null;
  barangay_senior?: number | null;
  barangay_children?: number | null;
};

type RAFFIRow = {
  rafi_id: number;
  lgu_id: number;
  raffi_name: string;
  lat: number;
  lng: number;
  raffi_desc?: string | null;
  raffi_pic?: string | null;
};

const LGUofficerSuperAdmin: React.FC = () => {
  const [selectedData, setSelectedData] = useState<any>(null);
  const [activeModal, setActiveModal] = useState("");

  // === LGU state ===
  const [lguList, setLguList] = useState<LGURow[]>([]);
  const [loadingLGUs, setLoadingLGUs] = useState(true);
  const [lguError, setLguError] = useState<string | null>(null);
  const [selectedLGUId, setSelectedLGUId] = useState<number | null>(null);

  // === Barangay state (depends on selected LGU) ===
  const [barangays, setBarangays] = useState<BarangayRow[]>([]);
  const [loadingBarangays, setLoadingBarangays] = useState(false);
  const [barangayError, setBarangayError] = useState<string | null>(null);

  // === RAFFI state (depends on selected LGU) ===
  const [raffi, setRaffi] = useState<RAFFIRow[]>([]);
  const [loadingRaffi, setLoadingRaffi] = useState(false);
  const [raffiError, setRaffiError] = useState<string | null>(null);

  // === Pagination state ===
  const [lguPage, setLguPage] = useState(1);
  const [brgyPage, setBrgyPage] = useState(1);
  const [raffiPage, setRaffiPage] = useState(1);

  // reset pages when data/selection changes
  useEffect(() => { setLguPage(1); }, [lguList]);
  useEffect(() => { setBrgyPage(1); }, [barangays, selectedLGUId]);
  useEffect(() => { setRaffiPage(1); }, [raffi, selectedLGUId]);

  const lguPaged = lguList.slice((lguPage - 1) * PAGE_SIZE, lguPage * PAGE_SIZE);
  const barangaysPaged = barangays.slice((brgyPage - 1) * PAGE_SIZE, brgyPage * PAGE_SIZE);
  const raffiPaged = raffi.slice((raffiPage - 1) * PAGE_SIZE, raffiPage * PAGE_SIZE);

  const openModal = (type: string, selected: any = null) => {
    setActiveModal(type);
    if (selected) setSelectedData(selected);
  };
  const closeModal = () => {
    setActiveModal("");
    setSelectedData(null);
  };

  const fmt = (v: any) => (v === null || v === undefined || v === "" ? "—" : String(v));

  /* ========================= FETCHERS ========================= */
  const fetchLGUs = async () => {
    try {
      setLoadingLGUs(true);
      setLguError(null);
      const { data } = await API.get<LGURow[]>("/lgu_profiling/lgus");
      setLguList(data);
      // Auto-select first LGU if none selected
      if (data.length && selectedLGUId == null) {
        setSelectedLGUId(data[0].id);
      }
    } catch (e: any) {
      setLguError(e?.response?.data?.detail ?? e?.message ?? "Failed to load LGUs.");
    } finally {
      setLoadingLGUs(false);
    }
  };

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
      const { data } = await API.get<any[]>(`/lgu_profiling/lgus/${lguId}/raffi`);
      const normalized = data.map((d) => ({
        ...d,
        raffi_name: d.raffi_name ?? d.rafi_name ?? "—",
        raffi_desc: d.raffi_desc ?? d.rafi_desc ?? "—",
      }));
      setRaffi(normalized);
    } catch (e: any) {
      setRaffiError(e?.response?.data?.detail ?? e?.message ?? "Failed to load RAFFI entries.");
      setRaffi([]);
    } finally {
      setLoadingRaffi(false);
    }
  };

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
            // refetch list after edit
            fetchLGUs();
          }}
          data={selectedData}
        />
      )}

      <div className="app-container">
        {/* === LGU TABLE === */}
        <section className="lgu-table-section" style={{ marginBottom: "2rem" }}>
          <div className="lgu-header" style={{ padding:"1rem"}}>
            <h1><b>LGU Records</b></h1>
            {selectedLGU && (
              <span style={{ marginLeft: "auto", fontSize: ".9rem", opacity: 0.8 }}>
                Selected: <strong>{selectedLGU.lgu_name}</strong>
              </span>
            )}
          </div>
          <div className="lgu-table-wrap">
            <table className="barangay-table">
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
                      <Pagination
                        page={lguPage}
                        total={lguList.length}
                        onPageChange={setLguPage}
                      />
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
                      <td>
                        {b.lat && b.lng ? `${b.lat.toFixed(5)}, ${b.lng.toFixed(5)}` : "—"}
                      </td>
                      <td>{fmt(b.barangay_captain)}</td>
                      <td>{fmt(b.evacucation_center_id)}</td>
                      <td className="col-action">
                        <button
                          className="action-btn view"
                          onClick={() => openModal("view-barangay", b)}
                        >
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
                      <Pagination
                        page={brgyPage}
                        total={barangays.length}
                        onPageChange={setBrgyPage}
                      />
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
            <button className="add-raffi">Add</button>
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
                      <td>{fmt(r.raffi_name)}</td>
                      <td>{`${r.lat.toFixed(5)}, ${r.lng.toFixed(5)}`}</td>
                      <td>{fmt(r.raffi_desc)}</td>
                      <td className="col-action">
                        <button
                          className="action-btn view"
                          onClick={() => openModal("view-raffi", r)}
                        >
                          View
                        </button>
                        <button
                          className="action-btn edit"
                          style={{ marginLeft: ".5rem" }}
                          onClick={() => openModal("edit-raffi", r)}
                        >
                          Edit
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
                      <Pagination
                        page={raffiPage}
                        total={raffi.length}
                        onPageChange={setRaffiPage}
                      />
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
