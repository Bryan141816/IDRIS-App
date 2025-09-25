
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