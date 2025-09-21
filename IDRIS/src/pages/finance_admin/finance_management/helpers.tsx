import { FinanceRecordType } from "./types";

export const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const formatCurrency = (value: string | number | null | undefined) => {
  const num = Number.parseFloat(String(value ?? "0"));
  const safe = Number.isFinite(num) ? num : 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(safe);
};

export const getActionRequired = (data: FinanceRecordType): string => {
  const pendingOut = parseFloat(data.kpis.pending_outflow || "0");
  const pendingIn = parseFloat(data.kpis.pending_inflow || "0");
  const denied = parseFloat(data.kpis.denied_total || "0");

  if (pendingOut > 0) {
    return `${formatCurrency(pendingOut)} in pending outflows require immediate review.`;
  }
  if (pendingIn > 0) {
    return `${formatCurrency(pendingIn)} in pending inflows require confirmation.`;
  }
  if (denied > 0) {
    return `${formatCurrency(denied)} in denied transactions need reconciliation.`;
  }

  return "No immediate action required.";
};

export const getTotalPendingTransactions = (data: FinanceRecordType): number => {
  const pendingOut = parseFloat(data.kpis.pending_outflow || "0");
  const pendingIn = parseFloat(data.kpis.pending_inflow || "0");
  return pendingOut + pendingIn;
};