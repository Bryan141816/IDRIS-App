
export const formatCurrency = (value: string | number | null | undefined) => {
  const num = Number.parseFloat(String(value ?? "0"));
  const safe = Number.isFinite(num) ? num : 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(safe);
};

export const computePercentage = (part: number, whole: number): string => {
  if (!whole || whole === 0) return "0.00";
  console.log("Percentage: ", ((part / whole) * 100).toFixed(2));
  return ((part / whole) * 100).toFixed(2);
}

export const normalizeDonationFrequency = (type: string | null) => {
  if (type === "One-time") return "ONE_TIME";
  if (type === "Monthly") return "MONTHLY";
  if (type === "Quarterly") return "QUARTERLY"; 2
  if (type === "Yearly") return "YEARLY";
  return "ONE_TIME"; // fallback
};

export const normalizeDonationType = (type: string | null) => {
  if (type == "In-Kind" || type?.includes("In-Kind")) return "INKIND";
  if (type == "Cash") return "CASH";
  return type?.toUpperCase();
}
