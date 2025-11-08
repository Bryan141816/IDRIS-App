export type ModalType =
  | "submit"
  | "view"
  | "review"
  | "approve"
  | "reject"
  | "update"
  | "track"
  | null;

export type User = {
  user_id: number;
  username: string;
};
type Volunteer = {
  volunteer_id: number;
  first_name: string;
  middle_name: string;
  full_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  gender: string;
  age: number;
};

type TeamMember = {
  members_id: number;
  member: number;
  role: string;
  status: string;
  volunteer: Volunteer;
};

type AssignedTeam = {
  team_id: number;
  team_name: string;
  isActive: boolean;
  status: string;
  team_members: TeamMember[];
};

type Warehouse = {
  warehouse_id: number;
  address: string;
  lat: number;
  long: number;
  status: string;
  zone_name: string;
  zone_type: string;
  capacity: number;
  manager: string;
};

type InventoryItem = {
  inventory_id: number;
  item_name: string;
  quantity: number;
  category: string;
  batch: string;
  expiry: string;
  status: string;
};

type AssignedStorageRecord = {
  assigned_id: number;
  quantity: number;
  warehouse: Warehouse;
  inventory_item: InventoryItem;
};

type ReliefItemRoute = {
  item_id: number;
  request_id: number;
  item_name: string;
  category: string;
  quantity: number;
};

type DistributedItem = {
  item_id: number;
  assigned_storage: number;
  relief_id: number;
  procurement_request_id: number | null;
  route: number;
  quantity: number;
  assigned_storage_rec: AssignedStorageRecord;
  relief_item: ReliefItemRoute;
  procurement_item: any | null;
};

type Log = {
  log_id: number;
  route_id: number;
  log_message: string;
  date: string | null;
};

type Route = {
  route_id: number;
  route_name: string;
  gathering_area: string;
  gathering_lat: number;
  gathering_lng: number;
  request_id: number;
  status: string;
  start_schedule: string;
  end_schedule: string;
  team_id: number;
  date_added: string;
  assigned_team: AssignedTeam;
  distributed_items: DistributedItem[];
  logs: Log[];
};

export interface ProcurementRequest {
  request_id: number;
  lgu: {
    id: number;
    name: string;
    lat: number;
    lng: number;
  };
  request_type: "relief" | "procurement" | string; // Allow flexibility
  request_ref_num: string;
  request_title: string;
  request_description: string;
  status: string;
  priority: string | null;
  date_requested: string; // ISO date (e.g., "2025-10-30")
  disaster_type: string;
  date_needed: string;
  use_different_end: boolean;
  different_end_type: "barangay" | "evacuation" | null;

  // Conditional destination target
  end_target: EndTarget | null;

  // fallback end info (manual entry)
  fallback_end: {
    end_address: string | null;
    end_lat: number | null;
    end_long: number | null;
  };

  // Which table the items were pulled from
  items_source: "relief" | "procurement";

  // Items themselves
  items: (ReliefItem | ProcurementItem)[];

  route: Route;
}

export interface EndTarget {
  type: "barangay" | "evacuation" | null;
  id: number;
  name: string;
  lat: number;
  lng: number;
  capacity?: number; // only for evacuation centers
  occupied?: number; // only for evacuation centers
}

export interface ReliefItem {
  item_id: number;
  name: string;
  category: string;
  quantity: number;
}

export interface ProcurementItem {
  item_id: number;
  name: string;
  quantity: number;
  unit?: string;
}

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
  }).format(amount);
};
export const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case "high":
      return "high";
    case "medium":
      return "medium";
    case "low":
      return "low";
    default:
      return "medium";
  }
};
export const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "pending approval":
      return "pending";
    case "approved":
      return "approved";
    case "rejected":
      return "rejected";
    case "in progress":
      return "in-progress";
    default:
      return "pending";
  }
};
