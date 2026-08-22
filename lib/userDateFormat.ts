/**
 * Client-side date formatting utility that respects the user's
 * date format preference stored in localStorage (set via Settings > Preferences).
 *
 * Falls back to DD/MM/YYYY if no preference is set.
 */

export type DateFormat = "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";

const DEFAULT_FORMAT: DateFormat = "DD/MM/YYYY";
const STORAGE_KEY = "bpi-date-format";

export function getDateFormat(): DateFormat {
  if (typeof window === "undefined") return DEFAULT_FORMAT;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "DD/MM/YYYY" || stored === "MM/DD/YYYY" || stored === "YYYY-MM-DD") {
    return stored;
  }
  return DEFAULT_FORMAT;
}

export function formatDate(date: Date | string, format?: DateFormat): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const fmt = format ?? getDateFormat();

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  switch (fmt) {
    case "MM/DD/YYYY":
      return `${month}/${day}/${year}`;
    case "YYYY-MM-DD":
      return `${year}-${month}-${day}`;
    case "DD/MM/YYYY":
    default:
      return `${day}/${month}/${year}`;
  }
}

export function formatDateTime(date: Date | string, format?: DateFormat): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const dateStr = formatDate(d, format);
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${dateStr} ${time}`;
}
