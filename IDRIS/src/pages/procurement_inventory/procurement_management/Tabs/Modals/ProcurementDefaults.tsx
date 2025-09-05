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

export type RequestItem = {
  item_id: number;
  item_name: string;
  quantity: number;
  price_p_each: number;
};

export type RequestData = {
  request_id: number;
  requester: User; // ✅ instead of requester_id, now has username
  title: string;
  lgu_name: string;
  priority: "low" | "medium" | "high";
  status: "pending approval" | "approved" | "rejected" | "in progress";
  description: string;
  justification: string;
  date: string; // ISO string from backend
  comment?: string;
  reason_or_code?: string;
  request_items: RequestItem[];
};
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
export const calculateTotal = (items?: RequestItem[] | null): number =>
  items?.reduce((sum, item) => sum + item.quantity * item.price_p_each, 0) ?? 0;
