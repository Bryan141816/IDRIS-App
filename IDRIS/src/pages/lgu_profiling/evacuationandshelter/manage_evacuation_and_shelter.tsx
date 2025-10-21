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
        lat: 0,
        lng: 0,
    });
    const [editingId, setEditingId] = useState(null);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    type Shelter = {
        id: string | number;
        name: string;
        lat: number;
        lng: number;
        capacity: number;
        occupied: number;
        status: string;
        address?: string;
    };
    const [shelters, setShelters] = useState<Shelter[]>([]);
    const [dropdownOpenId, setDropdownOpenId] = useState<string | number | null>(null);
    type EditModalType = { id: string | number; occupied: number; capacity: number } | null;
    const [editModal, setEditModal] = useState<EditModalType>(null);
    const isLguAdmin =
        userType === "admin" && userRoles.includes("lgu officer") || userRoles.includes("superadmin");
    const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => ref.current?.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });

    const handleFormChange = (e: { target: { name: any; value: any; type: any; }; }) => {
        const { name, value, type } = e.target;
        setCenterForm(prev => ({ ...prev, [name]: type === "number" ? Number(value) : value }));
    };
    const openPicker = () => setIsPickerOpen(true);
    const closePicker = () => setIsPickerOpen(false);
    const handlePickerSubmit = (mapData: { lat: any; lng: any; }) => {
        setCenterForm(prev => ({ ...prev, lat: mapData.lat, lng: mapData.lng }));
        closePicker();
    };

    const handleDropdownToggle = (id: string | number) => setDropdownOpenId(id === dropdownOpenId ? null : id);
    const handleEditClick = (id: string | number, occupied: number, capacity: number) => { setEditModal({ id, occupied, capacity }); setDropdownOpenId(null); };
    const handleEditInput = (e: { target: { value: any; }; }) =>
        setEditModal(modal =>
            modal
                ? { id: modal.id, capacity: modal.capacity, occupied: Number(e.target.value) }
                : modal
        );
    const handleEditModalClose = () => setEditModal(null);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const handleEditSave = async () => {
        if (!editModal) return;

        if (editModal.occupied < 0 || editModal.occupied > editModal.capacity) {
            await Swal.fire({ icon: "error", title: "Invalid Value", text: "Evacuee count must be between 0 and capacity." });
            return;
        }

        // Find the shelter object by id
        const shelterToUpdate = shelters.find(shelter => shelter.id === editModal.id);
        if (!shelterToUpdate) {
            await Swal.fire("Error", "Shelter not found.", "error");
            return;
        }

        try {
            await API.put(`/lgu_profiling/manage_lgu/update_evacuation/${editModal.id}`, {
                name: shelterToUpdate.name,
                lat: shelterToUpdate.lat,
                lng: shelterToUpdate.lng,
                capacity: shelterToUpdate.capacity,
                occupied: editModal.occupied // use updated value
            });
            setEditModal(null);
            await Swal.fire("Success", "Evacuee count updated!", "success");
            fetchShelters();
        } catch (err) {
            await Swal.fire("Error", "Failed to update evacuees.", "error");
        }
    };

    const handleDeleteClick = async (id: string | number) => {
        setDropdownOpenId(null);
        const result = await Swal.fire({
            title: "Delete shelter?",
            text: "This action cannot be undone!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#e64949",
            confirmButtonText: "Delete",
            cancelButtonText: "Cancel"
        });
        if (result.isConfirmed) {
            try {
                await API.delete(`/lgu_profiling/manage_lgu/delete_evacuation/${id}`);
                await Swal.fire("Deleted!", "Shelter removed.", "success");
                fetchShelters();
            } catch (err) {
                await Swal.fire("Error", "Failed to delete shelter.", "error");
            }
        }
    };

    const handleSubmit = async (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        try {
            const payload = { ...centerForm };
            if (!payload.name?.trim()) { await Swal.fire("Required", "Please provide a center name.", "warning"); return; }
            if (!payload.lat || !payload.lng) { await Swal.fire("Required", "Please pick a location on the map.", "warning"); return; }
            if (Number(payload.occupied) < 0 || Number(payload.capacity) < 0) { await Swal.fire("Error", "Capacity and occupied must be non-negative.", "error"); return; }
            if (Number(payload.occupied) > Number(payload.capacity)) { await Swal.fire("Error", "Occupied cannot exceed capacity.", "error"); return; }
            if (editingId) {
                await API.put(`/lgu_profiling/manage_lgu/add_evacuation/${editingId}`, payload);
                await Swal.fire("Updated", "Evacuation center updated.", "success");
            } else {
                await API.post("/lgu_profiling/manage_lgu/add_evacuation", payload);
                setIsRegisterModalOpen(false)
                await Swal.fire("Created", "Evacuation center created.", "success");
            }
            setCenterForm({ name: "", capacity: "", occupied: 0, lat: 0, lng: 0 });
            setEditingId(null);
            fetchShelters();

        } catch {
            await Swal.fire("Failed", "Save failed. Please try again.", "error");
        }
    };

    async function fetchAddress(lat: any, lng: any) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
            const data = await response.json();
            return data.display_name || "";
        } catch { return ""; }
    }

    async function fetchShelters() {
        try {
            const response = await API.get("/lgu_profiling/manage_lgu/get_evacuation");
            const evacData = response.data.table_datas.flatMap((page: { row: any[]; }) =>
                page.row.map(row => {
                    const cells = row.data;
                    return {
                        id: cells[0].text,
                        name: cells[1].text,
                        lat: parseFloat(cells[2].text),
                        lng: parseFloat(cells[3].text),
                        capacity: parseInt(cells[4].text, 10),
                        occupied: parseInt(cells[5].text, 10),
                        status: "Operational",
                    };
                })
            );
            const enriched = await Promise.all(
                evacData.map(async (shelter: { lat: any; lng: any; }) => ({
                    ...shelter,
                    address: await fetchAddress(shelter.lat, shelter.lng),
                }))
            );
            setShelters(enriched);
        } catch { }
    }

    useEffect(() => { fetchShelters(); }, []);

    return (
        <>
            <main className="dashboard-container">
                {/* Status Overview */}
                <section className="status-overview">
                    <div className="status-card success">
                        <div className="status-icon"><i className="fas fa-map"></i></div>
                        <div className="status-content">
                            <h3>Shelters Occupied</h3>
                            <p className="status-number">{shelters.filter((s) => s.occupied > 0).length}/{shelters.length}</p>
                            <span className="status-label">Assigned to shelters</span>
                        </div>
                    </div>
                    <div className="status-card warning">
                        <div className="status-icon"><i className="fas fa-users"></i></div>
                        <div className="status-content">
                            <h3>People in Shelters</h3>
                            <p className="status-number">{shelters.reduce((total, s) => total + s.occupied, 0)}</p>
                            <span className="status-label">Across {shelters.length} locations</span>
                        </div>
                    </div>
                    <div className="status-card info">
                        <div className="status-icon"><i className="fas fa-home"></i></div>
                        <div className="status-content">
                            <h3>Available Capacity</h3>
                            <p className="status-number">
                                {Math.round((shelters.reduce((total, s) => total + (s.capacity - s.occupied), 0) /
                                    shelters.reduce((total, s) => total + s.capacity, 1)) * 100)}%
                            </p>
                            <span className="status-label">
                                {shelters.reduce((total, s) => total + (s.capacity - s.occupied), 0)} available capacity
                            </span>
                        </div>
                    </div>
                </section>
                {/* Quick Actions */}
                {isLguAdmin && (
                    <section className="quick-actions">
                        <h2>Quick Actions</h2>
                        <div className="action-buttons">
                            <button
                                className="action-btn primary"
                                onClick={() => setIsRegisterModalOpen(true)}
                            >
                                <i className="fas fa-plus-circle"></i>&nbsp;Register Evacuation Center
                            </button>
                            <button
                                className="action-btn secondary"
                                onClick={() => scrollToSection(statusSectionRef)}
                            >
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
                                <h2><i className="fas fa-map"></i>&nbsp;Evacuation/Shelter Maps and Occupancy</h2>
                            </div>
                            <div className="map-container">
                                <div className="maps-placeholder">
                                    <MapView
                                        center={[10.313924, 123.887082]}
                                        markers={shelters.map(({ lat, lng, name, capacity }) => ({
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
                        {shelters.length === 0 ? (
                            <Empty description="No shelters added yet" />
                        ) : (
                            shelters.map(({ id, name, address, capacity, occupied, status }) => {
                                const capacityPercent =
                                    capacity === 0 ? 0 : Math.min(100, Math.round((occupied / capacity) * 100));
                                return (
                                    <div className="shelter-item" key={id} style={{ position: "relative" }}>
                                        <div className="shelter-info">
                                            <h4 className="shelter-title-row">
                                                <span>{name}</span>
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
                                                                    onClick={() => handleDeleteClick(id)}
                                                                >
                                                                    <i className="fas fa-trash"></i> Delete
                                                                </button>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </h4>
                                            <p>
                                                <i className="fas fa-map-marker-alt" /> {address}
                                            </p>
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
                                        <span className={`shelter-badge ${status.toLowerCase()}`}>{status}</span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>
                {/* Edit Modal */}
                {editModal && (
                    <div className="modal-backdrop">
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
                                <button onClick={handleEditModalClose} className="modal-btn cancel">Cancel</button>
                                <button onClick={handleEditSave} className="modal-btn save">Save</button>
                            </div>
                        </div>
                    </div>
                )}

                {isRegisterModalOpen && (
                    <div className="modal-backdrop">
                        <div className="modal">
                            <div className="modal-header">
                                <h3><i className="fas fa-edit"></i>&nbsp;Register Evacuation Center</h3>
                                <button
                                    className="modal-close"
                                    onClick={() => setIsRegisterModalOpen(false)}
                                >
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
                                <div className="form-group">
                                    <label>Location (Latitude, Longitude)</label>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <input
                                            type="text"
                                            readOnly
                                            placeholder="Select a location"
                                            value={centerForm.lat ? `${centerForm.lat}, ${centerForm.lng}` : ""}
                                        />
                                        <button
                                            type="button"
                                            className="map-btn"
                                            onClick={openPicker}
                                            title="Pick location on map"
                                        >
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
                                            value={centerForm.capacity}
                                            onChange={handleFormChange}
                                            style={{ width: "210%" }}
                                        />
                                    </div>
                                </div>
                                {editingId && <p style={{ marginTop: 8 }}>Editing record ID: {editingId}</p>}
                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        className="modal-btn cancel"
                                        onClick={() => setIsRegisterModalOpen(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="modal-btn save">
                                        <i className="fas fa-save"></i>{" "}
                                        {editingId ? "Update Evacuation Center" : "Save Evacuation Center"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {isPickerOpen && (
                    <div className="location-picker-modal">
                        <LocationPickerModal
                            isOpenProp={isPickerOpen}
                            onCloseProp={closePicker}
                            onSubmit={handlePickerSubmit}
                            lat={centerForm.lat}
                            lng={centerForm.lng}
                        /></div>
                )}
            </main>
        </>
    );
};


export default EvacuationAndShelter;
