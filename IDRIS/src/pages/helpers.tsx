export const formatCurrency = (value: string | number | null | undefined) => {
  const num = Number.parseFloat(String(value ?? "0"));
  const safe = Number.isFinite(num) ? num : 0;
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(safe);
};

export const computePercentage = (part: number, whole: number): string => {
  if (!whole || whole === 0) return "0.00";
  return ((part / whole) * 100).toFixed(2); // returns string
}

const nf = new Intl.NumberFormat('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
export const stripToNumber = (s: string) => {
  // keep digits and at most one dot
  const cleaned = s.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
  return cleaned;
};