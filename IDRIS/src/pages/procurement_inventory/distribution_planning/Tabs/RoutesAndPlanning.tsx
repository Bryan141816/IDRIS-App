import { useEffect, useState } from "react";
import { WarehouseZone } from "../../procurement_inventory/Tabs/Modals/ModalDefault";
import { AddRouteModal } from "./Modals/AddRoute/AddRoute";
import { API } from "../../../../API_Handler/Axio_API_Handler";
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

type DistributedItem = {
  item_id: number;
  inventory_id: number;
  item_name: string;
  quantity: number;
};

type AssignedTeam = {
  team_id: number | null;
  team_name: string | null;
};

type DistributionRoute = {
  route_id: number;
  route_name: string;
  status: string;
  schedule: string | null; // ISO datetime string
  start_location: string | null;
  assigned_team: AssignedTeam;
  end_location: string;
  distributed_items: DistributedItem[];
};
export const RoutesAndPlanning = () => {
  const [activeModal, setActiveModal] = useState("");
  const [routesData, setRoutes] = useState<DistributionRoute[]>([]);
  const openModal = (type: string, selectedItem: route | null = null) => {
    setActiveModal(type);
  };
  const closeModal = () => {
    setActiveModal("");
  };
  const fetchData = () => {
    const fetch = async () => {
      try {
        const response = await API.get("/distribution_planning/get_routes");
        setRoutes(response.data);
      } catch (e: any) {
        console.error("Error fetching routes: " + e);
      }
    };
    fetch();
  };
  useEffect(() => {
    fetchData();
  }, []);
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
          {routesData.map((route) => (
            <div key={route.route_id} className="route-card">
              <div className="route-header">
                <h3>{route.route_name}</h3>
                <span className={`status-badge ${route.status.toLowerCase()}`}>
                  {route.status}
                </span>
              </div>
              <div className="route-details">
                <p>
                  <strong>Route: </strong>
                  {route.start_location} - {route.end_location}
                </p>
                <p>
                  <strong>Assigned to:</strong>{" "}
                  {route.assigned_team.team_id
                    ? route.assigned_team.team_name
                    : "Not yet assigned "}
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
