import React, { useEffect, useState, useRef } from "react";
import L from "leaflet";
import MapView from "../../../components/MapView/MapView";
import "../css/manage_evacuation_and_shelter.css";
import { useUserContext } from "../../../UserContext";
import { useUserRoleContext } from "../../../UserRoleContext";
import { API } from "../../../API_Handler/Axio_API_Handler";
import LocationPickerModal from "../../../components/Page_Furniture/LocationPickerModal";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { Empty } from "antd";
import type { AxiosError } from "axios";
import { Barangay } from "../LGUofficer/LGUofficer";
import { MapViewWithSearch } from "../../procurement_inventory/procurement_inventory/Tabs/MapViewWithSearch";

/* ---------- helpers ---------- */
const toL = (v?: string | null) => (v ?? "").toLowerCase();

const deriveStatus = (occupied: number, capacity: number, provided?: string) => {
  // prefer provided status if present
  const s = (provided ?? "").trim();
  if (s) return s;

  if (!Number.isFinite(capacity) || capacity <= 0) return "Unknown";
  if (occupied >= capacity) return "Full";
  if (occupied <= 0) return "Empty";
  const pct = Math.round((occupied / capacity) * 100);
  if (pct >= 80) return "High";
  if (pct >= 40) return "Moderate";
  return "Open";
};

const greenPinIcon = new L.Icon({
  iconUrl: "/images/icons/evac.png",
  iconSize: [41, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const EvacuationAndShelter = () => {
  const navigate = useNavigate();
  const evacuationCenterRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const statusSectionRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const barangayAssignmentRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const reportsRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const { userRoles } = useUserRoleContext();
  const { userType } = useUserContext();

  const [centerForm, setCenterForm] = useState({
    name: "",
    capacity: "",
    occupied: 0,
    baranggay_id: -1, // use -1 consistently for "no selection"
    lat: 0,
    lng: 0,
  });

  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const isSuperAdmin = userType === "superadmin" || userRoles.includes("superadmin");
  const isLGUOfficer = userType === "lguofficer" || userRoles.includes("lgu officer");

  // We'll keep your existing barangayList, but also store quick lookup IDs
  const [myBarangayIds, setMyBarangayIds] = useState<number[]>([]);

  type barangayminiinfo = {
    id: number;
    name: string;
    lat: number;
    lng: number;
    baranggay_pic: string;
  };

  type Shelter = {
    id: number; // ← numeric and reliable for URLs
    name: string;
    lat: number;
    lng: number;
    capacity: number;
    occupied: number;
    barangay?: barangayminiinfo[] | null;
  };

  const [shelters, setShelters] = useState<Shelter[]>([]);
  const displayedShelters = React.useMemo(() => {
    if (isSuperAdmin) return shelters;

    // LGU Officer: show shelters assigned to *any* of my barangays
    if (isLGUOfficer && myBarangayIds.length > 0) {
      return shelters.filter(
        (s) => Array.isArray(s.barangay) && s.barangay?.some((b) => myBarangayIds.includes(b.id)),
      );
    }

    // Default: if not superadmin and not LGU officer, show none
    return [];
  }, [isSuperAdmin, isLGUOfficer, myBarangayIds, shelters]);

  const [dropdownOpenId, setDropdownOpenId] = useState<string | number | null>(null);

  type EditModalType = {
    id: string | number;
    occupied: number;
    capacity: number;
  } | null;
  const [editModal, setEditModal] = useState<EditModalType>(null);

  const isLguAdmin =
    (userType === "admin" && userRoles.includes("lgu officer")) || userRoles.includes("superadmin");

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) =>
    ref.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
      inline: "nearest",
    });

  const handleFormChange = (e: { target: { name: any; value: any; type: any } }) => {
    const { name, value, type } = e.target;
    setCenterForm((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const openPicker = () => setIsPickerOpen(true);
  const closePicker = () => setIsPickerOpen(false);

  const handlePickerSubmit = (mapData: { lat: any; lng: any }) => {
    setCenterForm((prev) => ({ ...prev, lat: mapData.lat, lng: mapData.lng }));
    closePicker();
  };

  const handleDropdownToggle = (id: string | number) =>
    setDropdownOpenId(id === dropdownOpenId ? null : id);

  const handleEditClick = (id: string | number, occupied: number, capacity: number) => {
    const numId = Number(id);
    if (!Number.isFinite(numId)) {
      console.warn("Invalid shelter id on edit:", id);
      return;
    }
    setEditModal({ id: numId, occupied, capacity });
    setDropdownOpenId(null);
  };

  const handleEditInput = (e: { target: { value: any } }) =>
    setEditModal((modal) =>
      modal
        ? {
            id: modal.id,
            capacity: modal.capacity,
            occupied: Number(e.target.value),
          }
        : modal,
    );

  const handleEditModalClose = () => setEditModal(null);

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [barangayList, setBarangayList] = useState<Barangay[]>([]);

  // Keep your existing effect for when the register modal opens
  useEffect(() => {
    if (isRegisterModalOpen) {
      const fetch = async () => {
        try {
          const response = await API.get("/lgu_profiling/me/barangay_list");
        setBarangayList(response.data);
        } catch (e: any) {
          console.error("Error fetching barangay: " + (e?.message || e));
        }
      };
      fetch();
    }
  }, [isRegisterModalOpen]);

  // NEW: fetch barangays on mount (so filtering works immediately)
  useEffect(() => {
    const fetchMine = async () => {
      try {
        const response = await API.get("/lgu_profiling/me/barangay_list");
        const list: Barangay[] = Array.isArray(response.data) ? response.data : [];
        setBarangayList(list); // keeps UI dropdown happy too
        setMyBarangayIds(list.map((b) => b.id));
      } catch (e: any) {
        console.error("Error fetching my barangays:", e?.message || e);
      }
    };
    fetchMine();
  }, []);

  const handleEditSave = async () => {
    if (!editModal) return;

    if (editModal.occupied < 0 || editModal.occupied > editModal.capacity) {
      await Swal.fire({
        icon: "error",
        title: "Invalid Value",
        text: "Evacuee count must be between 0 and capacity.",
      });
      return;
    }

    const shelterToUpdate = shelters.find((s) => s.id === Number(editModal.id));
    if (!shelterToUpdate) {
      await Swal.fire("Error", "Shelter not found.", "error");
      return;
    }

    try {
      await API.put(`/lgu_profiling/manage_lgu/update_evacuation/${Number(editModal.id)}`, {
        name: shelterToUpdate.name,
        lat: shelterToUpdate.lat,
        lng: shelterToUpdate.lng,
        capacity: shelterToUpdate.capacity,
        occupied: editModal.occupied,
      });
      setEditModal(null);
      await Swal.fire("Success", "Evacuee count updated!", "success");
      fetchShelters();
    } catch (err) {
      await Swal.fire("Error", "Failed to update evacuees.", "error");
    }
  };

  const handleDeleteClick = async (shelter: {
    id: number;
    name: string;
    barangay?: { name: string }[] | null;
  }) => {
    setDropdownOpenId(null);

    const numId = Number(shelter.id);
    const shelterName = shelter.name || "this shelter";
    const barangayName =
      shelter.barangay && shelter.barangay.length > 0 ? shelter.barangay[0].name : "no assigned barangay";

    if (!Number.isFinite(numId)) {
      await Swal.fire("Error", "Invalid shelter ID.", "error");
      return;
    }

    // First confirmation
    const result = await Swal.fire({
      title: `Delete "${shelterName}" ?`,
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e64949",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      // Normal delete first
      await API.delete(`/lgu_profiling/manage_lgu/delete_evacuation/${numId}`);
      await Swal.fire("Deleted!", `"${shelterName}" has been removed.`, "success");
      fetchShelters();
    } catch (e) {
      const err = e as AxiosError<any>;
      const status = err?.response?.status;
      const detail = (err?.response?.data as any)?.detail;

      // If backend returns conflict (linked to barangay)
      if (status === 409) {
        const detachConfirm = await Swal.fire({
          title: `"${shelterName}" is linked to Barangay ${barangayName}`,
          html: `Do you want to <b>detach</b> it from Barangay <b>${barangayName}</b> and delete <b>${shelterName}</b>?`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Detach & Delete",
          cancelButtonText: "Cancel",
          confirmButtonColor: "#2563eb",
        });

        if (!detachConfirm.isConfirmed) return;

        try {
          // Force delete = detach barangay + delete evacuation
          const resp = await API.post(`/lgu_profiling/manage_lgu/evacuation/${numId}/force_delete`);
          const count = resp?.data?.detached_count ?? 0;

          await Swal.fire(
            "Deleted!",
            `"${shelterName}" was successfully deleted and unlinked from Barangay ${barangayName}.`,
            "success",
          );
          fetchShelters();
        } catch (e2) {
          const err2 = e2 as AxiosError<any>;
          const detail2 = (err2?.response?.data as any)?.detail;
          await Swal.fire("Error", detail2 || `Failed to detach and delete "${shelterName}".`, "error");
        }
        return;
      }

      await Swal.fire("Error", detail || "Failed to delete shelter.", "error");
    }
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    try {
      const payload = { ...centerForm };
      if (!payload.name?.trim()) {
        await Swal.fire("Required", "Please provide a center name.", "warning");
        return;
      }
      if (!payload.lat || !payload.lng) {
        await Swal.fire("Required", "Please pick a location on the map.", "warning");
        return;
      }
      if (Number(payload.occupied) < 0 || Number(payload.capacity) < 0) {
        await Swal.fire("Error", "Capacity and occupied must be non-negative.", "error");
        return;
      }
      if (Number(payload.occupied) > Number(payload.capacity)) {
        await Swal.fire("Error", "Occupied cannot exceed capacity.", "error");
        return;
      }

      if (editingId) {
        await API.put(`/lgu_profiling/api/add_evacuation/`, payload);
        await Swal.fire("Updated", "Evacuation center updated.", "success");
      } else {
        await API.post("/lgu_profiling/api/add_evacuation", payload);
        setIsRegisterModalOpen(false);
        await Swal.fire("Created", "Evacuation center created.", "success");
      }

      setCenterForm({
        name: "",
        capacity: "",
        occupied: 0,
        lat: 0,
        lng: 0,
        baranggay_id: -1,
      });
      setEditingId(null);
      fetchShelters();
    } catch {
      await Swal.fire("Failed", "Save failed. Please try again.", "error");
    }
  };

  async function fetchAddress(lat: any, lng: any) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      );
      const data = await response.json();
      return data.display_name || "";
    } catch {
      return "";
    }
  }

  async function fetchShelters() {
    try {
      const response = await API.get("/lgu_profiling/api/get_evacuation");

      const normalized: Shelter[] = (Array.isArray(response.data) ? response.data : []).map((r: any) => {
        // Accept either `evacuation_id` or `id` from the backend
        const rawId = r?.evacuation_id ?? r?.id;
        const id = Number(rawId);

        return {
          id: Number.isFinite(id) ? id : -1, // fallback to -1 so bad IDs are obvious
          name: r?.name ?? "",
          lat: typeof r?.lat === "number" ? r.lat : Number(r?.lat) || 0,
          lng: typeof r?.lng === "number" ? r.lng : Number(r?.lng) || 0,
          capacity: typeof r?.capacity === "number" ? r.capacity : Number(r?.capacity) || 0,
          occupied: typeof r?.occupied === "number" ? r.occupied : Number(r?.occupied) || 0,
          barangay: Array.isArray(r?.barangay) ? r.barangay : null,
        };
      });

      setShelters(normalized);
    } catch (e) {
      console.error("Failed to fetch shelters", e);
      // optional toast
    }
  }

  const getBarangayCoordinate = (id: number): [number, number] | null => {
    const b = barangayList.find((b) => b.id === id);
    return b && b.lat != null && b.lng != null ? [b.lat, b.lng] : null;
  };

  useEffect(() => {
    fetchShelters();
  }, []);

  const onLocationSelectSubmit = (address: string, coordinates: [number, number]) => {
    setCenterForm((prev) => ({
      ...prev,
      lat: coordinates[0],
      lng: coordinates[1],
    }));
  };

  return (
    <>
      <main className="dashboard-container">
        {/* Status Overview */}
        <section className="status-overview">
          <div className="status-card success">
            <div className="status-icon">
              <i className="fas fa-map"></i>
            </div>
            <div className="status-content">
              <h3>Shelters Occupied</h3>
              <p className="status-number">
                {displayedShelters.filter((s) => s.occupied > 0).length}/{displayedShelters.length}
              </p>
              <span className="status-label">Assigned to shelters</span>
            </div>
          </div>
          <div className="status-card warning">
            <div className="status-icon">
              <i className="fas fa-users"></i>
            </div>
            <div className="status-content">
              <h3>People in Shelters</h3>
              <p className="status-number">
                {displayedShelters.reduce((total, s) => total + s.occupied, 0)}
              </p>
              <span className="status-label">Across {displayedShelters.length} locations</span>
            </div>
          </div>
          <div className="status-card info">
            <div className="status-icon">
              <i className="fas fa-home"></i>
            </div>
            <div className="status-content">
              <h3>Available Capacity</h3>
              <p className="status-number">
                {Math.round(
                  (displayedShelters.reduce((total, s) => total + (s.capacity - s.occupied), 0) /
                    Math.max(1, displayedShelters.reduce((total, s) => total + s.capacity, 0))) *
                    100,
                )}
                %
              </p>
              <span className="status-label">
                {displayedShelters.reduce((total, s) => total + (s.capacity - s.occupied), 0)}{" "}
                available capacity
              </span>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        {isLguAdmin && (
          <section className="quick-actions">
            <h2>Quick Actions</h2>
            <div className="action-buttons">
              <button className="action-btn primary" onClick={() => setIsRegisterModalOpen(true)}>
                <i className="fas fa-plus-circle"></i>&nbsp;Register Evacuation Center
              </button>
              <button className="action-btn secondary" onClick={() => scrollToSection(statusSectionRef)}>
                <i className="fas fa-map-marked-alt"></i>View Shelter Status
              </button>
              <button
                className="action-btn secondary"
                onClick={() => navigate("/lgu_profiling/shelter_report_dashboard")}
              >
                <i className="fas fa-file-alt"></i>Generate Reports
              </button>
            </div>
          </section>
        )}

        <div className="content-grid">
          <div className="left-column">
            <section className="map-section">
              <div className="section-header">
                <h2>
                  <i className="fas fa-map"></i>&nbsp;Evacuation/Shelter Maps and Occupancy
                </h2>
              </div>
              <div className="map-container">
                <div className="maps-placeholder">
                  <MapView
                    center={[10.313924, 123.887082]}
                    markers={displayedShelters.map(({ lat, lng, name, capacity }) => ({
                      lat,
                      lng,
                      name,
                      capacity,
                    }))}
                    customIcon={greenPinIcon}
                  />
                </div>
              </div>
            </section>
          </div>
        </div>

        <section className="shelter-status" ref={statusSectionRef}>
          <div className="section-header">
            <h2>
              <i className="fas fa-map-marked-alt"></i> Shelter Status
            </h2>
          </div>

          <div className="shelter-list">
            {displayedShelters.length === 0 ? (
              <Empty description="No shelters added yet" />
            ) : (
              displayedShelters.map(({ id, name, capacity, occupied, lat, lng, barangay }) => {
                const capacityPercent =
                  capacity === 0 ? 0 : Math.min(100, Math.round((occupied / capacity) * 100));
                const statusLabel = deriveStatus(occupied, capacity);

                return (
                  <div className="shelter-item" key={id} style={{ position: "relative" }}>
                    <div className="shelter-info">
                      <h4 className="shelter-title-row">
                        <span>
                          {name} ({lat}, {lng})
                        </span>
                        {isLguAdmin && (
                          <>
                            <button
                              className="kebab-menu-btn"
                              aria-label="Options"
                              onClick={() => handleDropdownToggle(id)}
                              type="button"
                            >
                              <span className="kebab-menu-icon">⋮</span>
                            </button>
                            {dropdownOpenId === id && (
                              <div className="kebab-dropdown">
                                <button
                                  className="kebab-dropdown-item"
                                  onClick={() => handleEditClick(id, occupied, capacity)}
                                >
                                  <i className="fas fa-edit"></i> Edit
                                </button>
                                <button
                                  className="kebab-dropdown-item danger"
                                  onClick={() => handleDeleteClick({ id, name, barangay })}
                                >
                                  <i className="fas fa-trash-alt" /> Delete
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </h4>
                    </div>

                    <div className="shelter-stats">
                      <div className="capacity-bar">
                        <div className="capacity-fill" style={{ width: `${capacityPercent}%` }} />
                      </div>
                      <span className="capacity-text">
                        {occupied}/{capacity} people
                      </span>
                      <span className="capacity-percent">{capacityPercent}%</span>
                    </div>

                    <span className={`shelter-badge ${toL(statusLabel)}`}>Status: {statusLabel}</span>
                    <span>Barangay Assigned: {barangay && String(barangay[0]?.name)}</span>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Edit Modal */}
        {editModal && (
          <div className="modal-backdrop" style={{ zIndex: 900 }}>
            <div className="modal">
              <h3>Edit number of evacuees</h3>
              <p>Max: {editModal.capacity} people.</p>
              <input
                type="number"
                min={0}
                max={editModal.capacity}
                value={editModal.occupied}
                onChange={handleEditInput}
                className="modal-input"
              />
              <div className="modal-actions">
                <button onClick={handleEditModalClose} className="modal-btn cancel">
                  Cancel
                </button>
                <button onClick={handleEditSave} className="modal-btn save">
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {isRegisterModalOpen && (
          <div className="modal-backdrop" style={{ zIndex: 900 }}>
            <div className="modal">
              <div className="modal-header">
                <h3>
                  <i className="fas fa-edit"></i>&nbsp;Register Evacuation Center
                </h3>
                <button className="modal-close" onClick={() => setIsRegisterModalOpen(false)}>
                  &times;
                </button>
              </div>

              <form className="center-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Center Name</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter evacuation center name"
                    value={centerForm.name}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Barangay</label>

                    <select
                      style={{ width: "210%" }}
                      value={centerForm.baranggay_id ?? ""}
                      onChange={(e) =>
                        setCenterForm((prev) => ({
                          ...prev,
                          baranggay_id: Number(e.target.value), // ✅ cast to number if your ID is numeric
                        }))
                      }
                    >
                      {barangayList.length === 0 ? (
                        <option disabled value={-1}>
                          Fetching data...
                        </option>
                      ) : (
                        <>
                          <option value={-1}>Select Barangay</option>

                          {barangayList
                            .filter((item) => !item.evacucation_center_id) // show only barangays without evac center
                            .map((item) => (
                              <option key={item.id} value={item.id} disabled={!(item.lat && item.lng)}>
                                {item.name}
                                {!item.lat || !item.lng ? " (Missing some info)" : ""}
                              </option>
                            ))}
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Location (Latitude, Longitude)</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="text"
                      readOnly
                      placeholder="Select a location"
                      value={centerForm.lat ? `${centerForm.lat}, ${centerForm.lng}` : ""}
                    />
                    <button type="button" className="map-btn" onClick={openPicker} title="Pick location on map">
                      <i className="fas fa-map-marker-alt" />
                    </button>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Capacity</label>
                    <input
                      type="number"
                      name="capacity"
                      placeholder="Max capacity"
                      min={0}
                      value={centerForm.capacity}
                      onChange={handleFormChange}
                      style={{ width: "210%" }}
                    />
                  </div>
                </div>

                {editingId && <p style={{ marginTop: 8 }}>Editing record ID: {editingId}</p>}

                <div className="modal-actions">
                  <button type="button" className="modal-btn cancel" onClick={() => setIsRegisterModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="modal-btn save">
                    <i className="fas fa-save"></i> {editingId ? "Update Evacuation Center" : "Save Evacuation Center"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isPickerOpen && centerForm.baranggay_id != -1 && (
          <MapViewWithSearch
            onClose={() => setIsPickerOpen(false)}
            onSubmit={onLocationSelectSubmit}
            defaultValue={{
              address: ``,
              coordinates: [-1000000, -1000000],
            }}
            customCenter={getBarangayCoordinate(centerForm.baranggay_id) ?? null}
          ></MapViewWithSearch>
        )}
      </main>
    </>
  );
};

export default EvacuationAndShelter;
