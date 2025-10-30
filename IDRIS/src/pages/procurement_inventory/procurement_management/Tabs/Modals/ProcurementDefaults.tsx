export type ModalType =
  | "submit"
  | "view"
  | "approve"
  | "reject"
  | "update"
  | null;

export type User = {
  user_id: number;
  username: string;
};

export interface ProcurementRequest {
  request_id: number;
  lgu: {
    id: number;
    name: string;
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
