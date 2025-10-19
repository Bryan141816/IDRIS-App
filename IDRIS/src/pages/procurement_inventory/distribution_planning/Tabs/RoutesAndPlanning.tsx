import { useEffect, useState } from "react";
import { WarehouseZone } from "../../procurement_inventory/Tabs/Modals/ModalDefault";
import { AddRouteModal } from "./Modals/AddRoute/AddRoute";
import { API } from "../../../../API_Handler/Axio_API_Handler";
import { EditRoute } from "./Modals/EditRoute/EditRoute";
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
  schedule: string | null;
  start_location: string | null;
  assigned_team: AssignedTeam;
  end_location: string;
  distributed_items: DistributedItem[];
};
function formatDateTime(dateString: string): string {
  if (!dateString) return "";

  const date = new Date(dateString);

  return date.toLocaleString("en-US", {
    month: "long", // "October"
    day: "numeric", // "16"
    year: "numeric", // "2025"
    hour: "numeric", // "2"
    minute: "2-digit", // "03"
    hour12: true, // 12-hour format
  });
}

export const RoutesAndPlanning = () => {
  const [activeModal, setActiveModal] = useState("");
  const [routesData, setRoutes] = useState<DistributionRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<DistributionRoute | null>(
    null,
  );
  const openModal = (
    type: string,
    selectedItem: DistributionRoute | null = null,
  ) => {
    setActiveModal(type);
    setSelectedRoute(selectedItem);
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
        <AddRouteModal
          onClose={closeModal}
          refreshTable={fetchData}
        ></AddRouteModal>
      )}
      {activeModal === "update" && selectedRoute && (
        <EditRoute
          onClose={closeModal}
          refreshData={fetchData}
          selectedRoute={selectedRoute}
        ></EditRoute>
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
                <p>
                  <strong>Schedule: </strong>
                  {route.schedule
                    ? formatDateTime(route.schedule)
                    : "No Schedule Yet"}
                </p>
                <div className="route-actions">
                  <button
                    className="secondary-btn"
                    onClick={() => openModal("update", route)}
                  >
                    Update
                  </button>
                  <button className="primary-btn">View</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
