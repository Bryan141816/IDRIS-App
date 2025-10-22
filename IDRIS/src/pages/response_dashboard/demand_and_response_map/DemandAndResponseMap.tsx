import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faEdit,
  faTrash,
  faMapMarkerAlt,
  faSync,
  faExclamationTriangle,
  faSearch,
  faExpand,
  faCompress,
  faHome,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import {
  getMapPins,
  addRecord,
  updateRecord,
  deleteRecord,
} from "../../../API_Handler/response_dashboard_demand_and_response_list";
import "./DemandAndResponseMap.scss";
import axios from "axios";

// Updated interface to match your database schema exactly
interface DemandPin {
  demand_id: string;
  id: string;
  title_label: string;
  address: string;
  lat: number;
  lng: number;
  status: "no response" | "responded" | "completed";
  needs: any; // JSON field for storing needs data
  priority: string;
  submitted_at: string;
  last_updated: string;
}

// Interface for the needs structure (what goes in the JSON field)
interface NeedItem {
  id: number;
  need: string;
  amount: number | "critical";
  fulfilled: boolean;
}

// Interface for form handling (more user-friendly field names)
interface DemandFormData {
  title_label: string;
  address: string;
  status: string;
  priority: string;
  needs: NeedItem[];
  notes?: string;
}

const DemandAndResponseMap: React.FC = () => {
  const [demandPins, setDemandPins] = useState<DemandPin[]>([]);
  const [selectedPin, setSelectedPin] = useState<DemandPin | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPinLocation, setNewPinLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    loadDemandPins();
  }, []);

  const loadDemandPins = async () => {
    setIsLoading(true);
    try {
      const data = await getMapPins();
      setDemandPins(data);
    } catch (error) {
      console.error("Failed to load demand pins:", error);
      setDemandPins([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getIconByStatus = (status: DemandPin["status"]) => {
    let iconUrl = "";
    let iconColor = "#6c757d"; // Default gray

    if (status === "no response") {
      iconColor = "#dc3545"; // Red for urgent/no response
    } else if (status === "responded") {
      iconColor = "#ffc107"; // Yellow for responded
    } else if (status === "completed") {
      iconColor = "#28a745"; // Green for completed
    }

    // Create a custom pin-shaped marker
    const svgIcon = `
      <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Pin shadow -->
        <ellipse cx="16" cy="37" rx="4" ry="2" fill="rgba(0,0,0,0.2)"/>
  
        <!-- Pin body -->
        <path d="M16 1C8.82 1 3 6.82 3 14C3 23 16 38 16 38S29 23 29 14C29 6.82 23.18 1 16 1Z"
              fill="${iconColor}"
              stroke="white"
              stroke-width="2"/>
  
        <!-- Inner circle -->
        <circle cx="16" cy="14" r="6" fill="white"/>
  
        <!-- Status indicator dot -->
        <circle cx="16" cy="14" r="3" fill="${iconColor}"/>
  
        <!-- Small status icon based on status -->
        ${status === "no response"
        ? `<text x="16" y="18" text-anchor="middle" fill="white" font-size="8" font-weight="bold">!</text>`
        : status === "responded"
          ? `<circle cx="16" cy="14" r="1.5" fill="white"/>`
          : `<path d="M13 14L15 16L19 12" stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
      }
      </svg>
    `;

    return L.divIcon({
      html: svgIcon,
      className: "custom-pin-marker",
      iconSize: [32, 40],
      iconAnchor: [16, 38], // Point of the pin
      popupAnchor: [0, -38], // Popup appears above the pin
    });
  };

  const filteredPins = demandPins.filter((pin) => {
    const matchesStatus = filterStatus === "all" || pin.status === filterStatus;
    const matchesPriority =
      filterPriority === "all" || pin.priority === filterPriority;
    const matchesSearch =
      searchTerm === "" ||
      pin.title_label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pin.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pin.id.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesPriority && matchesSearch;
  });

  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        setNewPinLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
        setSelectedPin(null);
        setShowAddModal(true);
      },
    });
    return null;
  };

  const handleSavePin = async (formData: DemandFormData) => {
    const apiNeeds = formData.needs.map((item) => ({
      id: item.id,
      need: item.need,
      amount: String(item.amount),
    }));

    const commonPayload = {
      title_label: formData.title_label,
      address: formData.address,
      status: formData.status,
      priority: formData.priority,
      needs: apiNeeds,
    };

    try {
      if (selectedPin) {
        // Update existing pin
        const payload = {
          ...commonPayload,
          lat: selectedPin.lat,
          lng: selectedPin.lng,
        };
        Swal.fire({
          title: selectedPin ? "Updating..." : "Saving...",
          text: "Please wait.",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });
        await updateRecord(selectedPin.demand_id, payload);
        Swal.fire(
          "Updated!",
          "The demand point has been updated successfully.",
          "success",
        );
      } else {
        // Create new pin
        const payload = {
          ...commonPayload,
          lat: newPinLocation?.lat || 0,
          lng: newPinLocation?.lng || 0,
        };
        await addRecord(payload);
        Swal.fire(
          "Saved!",
          "The new demand point has been added successfully.",
          "success",
        );
      }
      setShowAddModal(false);
      setSelectedPin(null);
      setNewPinLocation(null);
      loadDemandPins(); // Reload pins to show changes
    } catch (error) {
      console.error("Failed to save pin:", error);
      Swal.fire(
        "Failed!",
        "There was an error saving the demand point.",
        "error",
      );
    }
  };

  const handleDeletePin = async (demandId: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      Swal.fire({
        title: "Deleting...",
        text: "Please wait while the demand point is being deleted.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      }); try {
        await deleteRecord(demandId);
        Swal.fire("Deleted!", "The demand point has been deleted.", "success");
        setSelectedPin(null);
        loadDemandPins();
      } catch (error) {
        console.error("Failed to delete pin:", error);
        Swal.fire(
          "Failed!",
          "There was an error deleting the demand point.",
          "error",
        );
      }
    }
  };

  const getDemandStats = () => {
    return {
      total: filteredPins.length,
      no_response: filteredPins.filter((p) => p.status === "no response")
        .length,
      responded: filteredPins.filter((p) => p.status === "responded").length,
      completed: filteredPins.filter((p) => p.status === "completed").length,
      urgent: filteredPins.filter((p) => p.priority === "urgent").length,
      high: filteredPins.filter((p) => p.priority === "high").length,
    };
  };

  const stats = getDemandStats();

  return (
    <div className={`demand-response-map ${isFullscreen ? "fullscreen" : ""}`}>
      {/* Breadcrumb Navigation */}
      <nav className="breadcrumb-nav" aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/response_dashboard" className="breadcrumb-link">
              <FontAwesomeIcon icon={faHome} />
              <span>Response Dashboard</span>
            </Link>
          </li>
          <li className="breadcrumb-separator">
            <FontAwesomeIcon icon={faChevronRight} />
          </li>
          <li className="breadcrumb-item current" aria-current="page">
            <span>Map Points Management</span>
          </li>
        </ol>
      </nav>

      <div className="page-header">
        <h2>Map Points Management</h2>
        <div className="header-actions">
          {/* <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="btn-secondary"
          >
            <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} />
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </button> */}

          <button className="btn-secondary" onClick={loadDemandPins}>
            <FontAwesomeIcon icon={faSync} />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Summary */}
      <div className="demand-stats">
        <div className="stat-item">
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">Total Map Points</span>
        </div>
        <div className="stat-item urgent">
          <span className="stat-value">{stats.urgent}</span>
          <span className="stat-label">Urgent</span>
        </div>
        <div className="stat-item high">
          <span className="stat-value">{stats.high}</span>
          <span className="stat-label">High Priority</span>
        </div>
        <div className="stat-item no-response">
          <span className="stat-value">{stats.no_response}</span>
          <span className="stat-label">No Response</span>
        </div>
      </div>

      {/* Main Content: Map and Sidebar Side by Side */}
      <div className="main-content">
        {/* Map Section */}
        <div className="map-section">
          <div className="map-header">
            <h3>Interactive Map</h3>
            <div className="map-controls">
              {/* <div className="search-box">
                <FontAwesomeIcon icon={faSearch} />
                <input
                  type="text"
                  placeholder="Search demand points..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div> */}
            </div>
          </div>

          <div className="map-container">
            <MapContainer
              center={[10.313924, 123.887082]}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              <MapClickHandler />

              {filteredPins.map((pin) => (
                <Marker
                  key={pin.demand_id}
                  position={[pin.lat, pin.lng]}
                  icon={getIconByStatus(pin.status)}
                  eventHandlers={{
                    click: () => {
                      setSelectedPin(pin);
                    },
                  }}
                >
                  <Popup>
                    <div className="pin-popup">
                      <h4>{pin.title_label}</h4>
                      <p>
                        <strong>ID:</strong> {pin.id}
                      </p>
                      <p>
                        <strong>Status:</strong> {pin.status}
                      </p>
                      <p>
                        <strong>Priority:</strong> {pin.priority}
                      </p>
                      <p>
                        <strong>Address:</strong> {pin.address}
                      </p>
                      <p>
                        <strong>Submitted:</strong>{" "}
                        {new Date(pin.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            <div className="map-instructions">
              <FontAwesomeIcon icon={faMapMarkerAlt} />
              <span>Click anywhere on the map to add a new demand point</span>
            </div>
          </div>
        </div>

        {/* Sidebar: Details and Controls */}
        <div className="details-sidebar">
          <div className="sidebar-header">
            <h3>Demand Points ({filteredPins.length})</h3>
            <div className="filters">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="no response">No Response</option>
                <option value="responded">Responded</option>
                <option value="completed">Completed</option>
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="pins-list">
            {filteredPins.length === 0 ? (
              <div className="empty-state">
                <FontAwesomeIcon icon={faExclamationTriangle} size="2x" />
                <p>No demand points found</p>
                <p>Click on the map to add new points</p>
              </div>
            ) : (
              filteredPins.map((pin) => (
                <div
                  key={pin.demand_id}
                  className={`pin-card ${selectedPin?.demand_id === pin.demand_id ? "selected" : ""}`}
                  onClick={() => setSelectedPin(pin)}
                >
                  <div className="pin-header">
                    <div className="pin-title">
                      <h4>{pin.title_label}</h4>
                      <div className="pin-id">ID: {pin.id}</div>
                      <div className="pin-badges">
                        <span
                          className={`status-badge ${pin.status.replace(" ", "-")}`}
                        >
                          {pin.status}
                        </span>
                        <span className={`priority-badge ${pin.priority}`}>
                          {pin.priority}
                        </span>
                      </div>
                    </div>
                    <div className="pin-actions">
                      <button
                        className="btn-icon edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPin(pin);
                          setShowAddModal(true);
                        }}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        className="btn-icon delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePin(pin.demand_id);
                        }}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>

                  <div className="pin-details">
                    <p className="address">📍 {pin.address}</p>

                    {pin.needs &&
                      Array.isArray(pin.needs) &&
                      pin.needs.length > 0 && (
                        <div className="needs-summary">
                          <strong>Needs ({pin.needs.length}):</strong>
                          <div className="needs-list-small">
                            {pin.needs.slice(0, 3).map((need: NeedItem) => (
                              <span
                                key={need.id}
                                className={`need-tag ${need.fulfilled ? "fulfilled" : "pending"}`}
                              >
                                {need.need}: {need.amount}
                              </span>
                            ))}
                            {pin.needs.length > 3 && (
                              <span className="more-needs">
                                +{pin.needs.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                    <div className="timestamps">
                      <p className="submitted-at">
                        Submitted: {new Date(pin.submitted_at).toLocaleString()}
                      </p>
                      <p className="last-updated">
                        Last updated:{" "}
                        {new Date(pin.last_updated).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Pin Modal */}
      {showAddModal && (
        <PinModal
          pin={selectedPin}
          location={newPinLocation}
          onSave={handleSavePin}
          onClose={() => {
            setShowAddModal(false);
            setSelectedPin(null);
            setNewPinLocation(null);
          }}
        />
      )}
    </div>
  );
};

// Pin Modal Component (Add/Edit) - Same as before
const PinModal: React.FC<{
  pin: DemandPin | null;
  location: { lat: number; lng: number } | null;
  onSave: (data: DemandFormData) => void;
  onClose: () => void;
}> = ({ pin, location, onSave, onClose }) => {
  const [formData, setFormData] = useState<DemandFormData>({
    title_label: pin?.title_label || "",
    address: pin?.address || "",
    status: pin?.status || "no response",
    priority: pin?.priority || "medium",
    needs: pin?.needs || [],
  });
  const [addressPlaceholder, setAddressPlaceholder] = useState(
    "Full address of the demand point",
  );
  const [isSearching, setIsSearching] = useState(false);
  async function reverseGeocode(location: { lat: number; lng: number } | null) {
    if (!location) {
      return null;
    }
    try {
      const response = await axios.get(
        "https://nominatim.openstreetmap.org/reverse",
        {
          params: {
            lat: location.lat,
            lon: location.lng,
            format: "json",
          },
        },
      );

      console.log("Address:", response.data.display_name);
      return response.data;
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
      return null;
    }
  }
  useEffect(() => {
    // Only fetch address if it's a new pin (no existing pin data)
    if (!pin && location) {
      const fetchAddress = async () => {
        setIsSearching(true);
        setAddressPlaceholder("Searching Address...");
        const address = await reverseGeocode(location);
        if (address && address.display_name) {
          setFormData((prev) => ({
            ...prev,
            address: address.display_name,
          }));
        } else {
          setAddressPlaceholder(
            "Failed to search address please manually enter the address",
          );
        }
        setIsSearching(false);
      };
      fetchAddress();
    }
  }, [pin, location]);

  const [newNeed, setNewNeed] = useState({ need: "", amount: 0 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const addNeed = () => {
    if (newNeed.need.trim() && newNeed.amount > 0) {
      const need: NeedItem = {
        id: Date.now(),
        need: newNeed.need,
        amount: newNeed.amount,
        fulfilled: false,
      };
      setFormData({
        ...formData,
        needs: [...formData.needs, need],
      });
      setNewNeed({ need: "", amount: 0 });
    }
  };

  const removeNeed = (id: number) => {
    setFormData({
      ...formData,
      needs: formData.needs.filter((need) => need.id !== id),
    });
  };

  const toggleNeedFulfilled = (id: number) => {
    setFormData({
      ...formData,
      needs: formData.needs.map((need) =>
        need.id === id ? { ...need, fulfilled: !need.fulfilled } : need,
      ),
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>{pin ? "Edit Demand Point" : "Add New Demand Point"}</h3>
          {location && (
            <p className="coordinates">
              Coordinates: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </p>
          )}
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label>Title/Label *</label>
              <input
                type="text"
                required
                value={formData.title_label}
                onChange={(e) =>
                  setFormData({ ...formData, title_label: e.target.value })
                }
                placeholder="e.g., Barangay Relief Center"
              />
            </div>

            <div className="form-group">
              <label>Priority</label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Address *</label>

            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              placeholder={addressPlaceholder}
              disabled={isSearching}
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
            >
              <option value="no response">No Response</option>
              <option value="responded">Responded</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Needs Management Section */}
          <div className="form-section">
            <h4>Needs Management</h4>

            {/* Add New Need */}
            <div className="add-need">
              <div className="form-row">
                <div className="form-group">
                  <label>Need Item</label>
                  <input
                    type="text"
                    value={newNeed.need}
                    onChange={(e) =>
                      setNewNeed({ ...newNeed, need: e.target.value })
                    }
                    placeholder="e.g., Rice, Water, Medicine"
                  />
                </div>
                <div className="form-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    value={newNeed.amount}
                    onChange={(e) =>
                      setNewNeed({
                        ...newNeed,
                        amount: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="Quantity needed"
                  />
                </div>
              </div>
              <button type="button" className="btn-add-need" onClick={addNeed}>
                <FontAwesomeIcon icon={faPlus} /> Add Need
              </button>
            </div>

            {/* Current Needs List */}
            {formData.needs.length > 0 && (
              <div className="needs-list">
                <h5>Current Needs:</h5>
                {formData.needs.map((need) => (
                  <div
                    key={need.id}
                    className={`need-item ${need.fulfilled ? "fulfilled" : "pending"}`}
                  >
                    <div className="need-content">
                      <span className="need-name">{need.need}</span>
                      <span className="need-amount">Quantity: {need.amount}</span>
                      <span
                        className={`need-status ${need.fulfilled ? "fulfilled" : "pending"}`}
                      >
                        {need.fulfilled ? "✓ Fulfilled" : "⏳ Pending"}
                      </span>
                    </div>
                    <div className="need-actions">
                      <button
                        type="button"
                        className="btn-toggle-status"
                        onClick={() => toggleNeedFulfilled(need.id)}
                      >
                        {need.fulfilled ? "Mark Pending" : "Mark Fulfilled"}
                      </button>
                      <button
                        type="button"
                        className="btn-remove"
                        onClick={() => removeNeed(need.id)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {pin ? "Update Demand Point" : "Add Demand Point"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DemandAndResponseMap;
