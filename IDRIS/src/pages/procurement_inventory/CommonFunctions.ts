export function formatDateTime(dateString: string): string {
  if (!dateString) return "";

  const date = new Date(dateString);

  return date.toLocaleString("en-US", {
    month: "long", // "October"
    day: "numeric", // "16"
    year: "numeric", // "2025"
  });
}

export function formatDateShort(dateString: string): string {
  if (!dateString) return "";

  const date = new Date(dateString);

  return date.toLocaleString("en-US", {
    month: "short",  // "Jan", "Feb", "Mar", etc.
    day: "numeric",  // "1", "16", etc.
    year: "numeric", // "2025"
  });
}
