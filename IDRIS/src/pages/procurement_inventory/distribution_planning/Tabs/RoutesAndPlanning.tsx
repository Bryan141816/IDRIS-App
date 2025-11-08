import { useEffect, useState } from "react";

import { API } from "../../../../API_Handler/Axio_API_Handler";
import { FinalizeRouteSetup } from "./Modals/FinalizeRoute/FinalizeRoute";
import { EditRoute } from "./Modals/EditRoute/EditRoute";
import { ViewRoute } from "./Modals/ViewRoute/ViewRoute";
// Helpers
export type ISODate = string;
export type Maybe<T> = T | null;

// --- Assigned team & members ---
export interface VolunteerRef {
  volunteer_id: number;
  first_name: string;
  middle_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone_number: string;
  address: string;
  gender: string;
  age: number;
}

export interface TeamMember {
  members_id: number;
  member: number;
  role: string;
  status: string;
  volunteer: VolunteerRef;
}

export interface AssignedTeam {
  team_id: number;
  team_name: string;
  isActive: boolean;
  status: string;
  team_members: TeamMember[];
}

// --- Warehouse / Inventory via assigned storage ---
export interface Warehouse {
  warehouse_id: number;
  address: string;
  lat: number;
  long: number;
  status: string;
  zone_name: string;
  zone_type: string;
  capacity: number;
  manager: string;
}

export interface InventoryItem {
  inventory_id: number;
  item_name: string;
  quantity: number;
  category: string;
  batch: string;
  expiry: Maybe<ISODate>;
  status: string;
}

export interface AssignedStorageRec {
  assigned_id: number;
  quantity: number;
  warehouse: Maybe<Warehouse>;
  inventory_item: Maybe<InventoryItem>;
}

// --- Distributed items ---
export interface ReliefItemRef {
  item_id: number;
  request_id: number;
  item_name: string;
  category: string;
  quantity: number;
}

export interface ProcurementItemRef {
  item_id: number;
  request_id: number;
  item_name: string;
  quantity: number;
  unit: string;
}

export interface DistributedItem {
  item_id: number;
  assigned_storage: Maybe<number>;
  relief_id: Maybe<number>;
  procurement_request_id: Maybe<number>;
  route: number;
  quantity: number;
  assigned_storage_rec: Maybe<AssignedStorageRec>;
  relief_item: Maybe<ReliefItemRef>;
  procurement_item: Maybe<ProcurementItemRef>;
}

// --- Logs ---
export interface RouteLog {
  log_id: number;
  route_id: number;
  log_message: Maybe<string>;
  date: Maybe<ISODate>;
}

// --- Request origin: LGU / Barangay / Evacuation ---
export interface LGURef {
  id: number;
  name: string;
  lat: Maybe<number>;
  lng: Maybe<number>;
}

export interface BarangayRef {
  id: number;
  name: string;
  lat: Maybe<number>;
  lng: Maybe<number>;
}

export interface EvacuationCenterRef {
  evacuation_id: number;
  name: string;
  lat: number;
  lng: number;
}

// --- Request with line items ---
export interface RequestBlock {
  request_id: number;
  lgu_id: number;
  request_type: Maybe<string>;
  request_ref_num: string;
  request_title: string;
  request_description: string;
  use_different_end: boolean;
  different_end_type: Maybe<string>;
  status: string;
  end_barangay: Maybe<number>;
  end_evac: Maybe<number>;
  end_address: Maybe<string>;
  end_lat: Maybe<number>;
  end_long: Maybe<number>;
  priority: Maybe<string>;
  date_requested: Maybe<ISODate>;
  disaster_type: string;
  date_needed: Maybe<ISODate>;

  lgu: Maybe<LGURef>;
  barangay: Maybe<BarangayRef>;
  evacuation_center: Maybe<EvacuationCenterRef>;

  relief_items: ReliefItemRef[];
  procurement_items: ProcurementItemRef[];
}

// --- The main route object ---
export interface DistributionRouteDTO {
  route_id: number;
  route_name: string;
  gathering_area: Maybe<string>;
  gathering_lat: Maybe<number>;
  gathering_lng: Maybe<number>;
  request_id: number;
  status: string;
  start_schedule: Maybe<ISODate>;
  end_schedule: Maybe<ISODate>;
  team_id: Maybe<number>;
  date_added: Maybe<ISODate>;

  assigned_team: Maybe<AssignedTeam>;
  distributed_items: DistributedItem[];
  logs: RouteLog[];
  request: Maybe<RequestBlock>;
}

function formatDateTime(dateString: string): string {
  if (!dateString) return "";

  const date = new Date(dateString);

  return date.toLocaleString("en-US", {
    month: "long", // "October"
    day: "numeric", // "16"
    year: "numeric", // "2025"
  });
}

export const RoutesAndPlanning = () => {
  const [routeList, setRouteList] = useState<DistributionRouteDTO[]>([]);
  const [selectedRoute, setSelectedRoute] =
    useState<DistributionRouteDTO | null>(null);
  const [activeModal, setActiveModal] = useState("");

  const openModal = (
    type: string,
    route: DistributionRouteDTO | null = null,
  ) => {
    setActiveModal(type);
    setSelectedRoute(route);
  };
  const closeModal = () => {
    setActiveModal("");
    setSelectedRoute(null);
  };
  const fetchData = () => {
    const fetch = async () => {
      try {
        const response = await API.get("/distribution_planning/get_routes");
        setRouteList(response.data);
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
      {activeModal === "finalize" && selectedRoute && (
        <FinalizeRouteSetup
          onClose={closeModal}
          refreshData={fetchData}
          route_id={selectedRoute.route_id}
          selectedRoute={selectedRoute}
        ></FinalizeRouteSetup>
      )}
      {activeModal === "update" && selectedRoute && (
        <EditRoute
          onClose={closeModal}
          refreshData={fetchData}
          selectedRoute={selectedRoute}
        ></EditRoute>
      )}
      {activeModal === "view" && selectedRoute && (
        <ViewRoute
          onClose={closeModal}
          selectedRoute={selectedRoute}
        ></ViewRoute>
      )}
      <div className="routes-content">
        <div className="section-header">
          <h2>Distribution Routes & Schedules</h2>
        </div>

        <div className="routes-grid">
          {routeList.map((route) => (
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
                  {route.gathering_area} -{" "}
                  {route.request?.use_different_end &&
                  route.request.different_end_type === "barangay"
                    ? route.request.barangay?.name
                    : route.request?.evacuation_center?.name}{" "}
                  {route.request?.lgu?.name}, Cebu
                </p>
                <p>
                  <strong>Team: </strong>
                  {route.assigned_team
                    ? route.assigned_team.team_name
                    : "No team have been assigned yet"}
                </p>
                <p>
                  <strong>Schedule: </strong>
                  {route.start_schedule && route.end_schedule
                    ? `${formatDateTime(route.start_schedule)} - ${formatDateTime(route.end_schedule)}`
                    : "No Schedule Yet"}
                </p>
                <div className="route-actions">
                  {!route.gathering_area && (
                    <button
                      className="secondary-btn"
                      onClick={() => openModal("finalize", route)}
                    >
                      Finalize Route Setup
                    </button>
                  )}
                  {(route.status.toLowerCase() === "active" ||
                    route.status.toLowerCase() === "in transit") && (
                    <button
                      className="secondary-btn"
                      onClick={() => openModal("update", route)}
                    >
                      Update
                    </button>
                  )}
                  <button
                    className="primary-btn"
                    onClick={() => openModal("view", route)}
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
