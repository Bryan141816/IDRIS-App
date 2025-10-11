import { useState } from "react";
import { WarehouseZone } from "../../procurement_inventory/Tabs/Modals/ModalDefault";
import { AddRouteModal } from "./Modals/AddRoute/AddRoute";
type items = {
  item_id: number;
  item_name: string;
  quantity: number;
};
type route = {
  id: number;
  name: string;
  starting: WarehouseZone;
  items: items[];
  destination: string;

  schedule: string;
};

const routes = [
  {
    id: 1,
    name: "Route A - Cebu City North",
    status: "Active",
    assigned: "Team Alpha",
  },
  {
    id: 2,
    name: "Route B - Mandaue Central",
    status: "Active",
    assigned: "Team Beta",
  },
  {
    id: 3,
    name: "Route C - Lapu-Lapu East",
    status: "Pending",
    assigned: "Unassigned",
  },
  {
    id: 4,
    name: "Route D - Talisay West",
    status: "Completed",
    assigned: "Team Gamma",
  },
];

export const RoutesAndPlanning = () => {
  const [activeModal, setActiveModal] = useState("");
  const openModal = (type: string, selectedItem: route | null = null) => {
    setActiveModal(type);
  };
  const closeModal = () => {
    setActiveModal("");
  };
  return (
    <>
      {activeModal === "new" && (
        <AddRouteModal onClose={closeModal}></AddRouteModal>
      )}
      <div className="routes-content">
        <div className="section-header">
          <h2>Distribution Routes & Schedules</h2>
          <button className="primary-btn" onClick={() => openModal("new")}>
            + Create New Route
          </button>
        </div>

        <div className="routes-grid">
          {routes.map((route) => (
            <div key={route.id} className="route-card">
              <div className="route-header">
                <h3>{route.name}</h3>
                <span className={`status-badge ${route.status.toLowerCase()}`}>
                  {route.status}
                </span>
              </div>
              <div className="route-details">
                <p>
                  <strong>Assigned to:</strong> {route.assigned}
                </p>
                <div className="route-actions">
                  <button className="secondary-btn">Edit Schedule</button>
                  <button className="primary-btn">View Details</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
