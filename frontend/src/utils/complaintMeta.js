// Shared constants for the complaint feature (student + warden + admin pages)

export const ANTI_RAGGING_HELPLINE = "1800-180-5522";

export const CATEGORIES = [
  { value: "ROOM", label: "Room", icon: "🛏️", hint: "Bed, fan, light, door, window, cleaning" },
  { value: "BATHROOM", label: "Bathroom", icon: "🚿", hint: "Cleanliness, taps, flush, drainage" },
  { value: "WATER", label: "Water", icon: "💧", hint: "Drinking water, supply, leakage" },
  { value: "LAUNDRY", label: "Laundry", icon: "🧺", hint: "Washing, delays, lost clothes" },
  { value: "RAGGING", label: "Ragging", icon: "🚨", hint: "Harassment or bullying by seniors" },
  { value: "OTHER", label: "Other", icon: "📝", hint: "Anything else about hostel services" },
];

export const SEVERITIES = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

export const RECIPIENTS = [
  { value: "WARDEN", label: "Warden", hint: "Sees it on the website" },
  { value: "ADMIN", label: "Admin", hint: "Sees it on the website" },
  { value: "DSW", label: "DSW", hint: "Receives it by email" },
];

// Same rule as the backend: DSW is only for ragging or serious complaints
export const isSerious = (category, severity) =>
  category === "RAGGING" || ["HIGH", "CRITICAL"].includes(severity);

export const OPEN_STATUSES = ["PENDING", "IN_PROGRESS"];

export const STATUS_LABEL = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  REJECTED: "Rejected",
};

export const STATUS_STYLE = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
  RESOLVED: "bg-green-50 text-green-700 border-green-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
};

export const SEVERITY_STYLE = {
  LOW: "bg-slate-100 text-slate-600 border-slate-200",
  MEDIUM: "bg-yellow-50 text-yellow-700 border-yellow-200",
  HIGH: "bg-orange-50 text-orange-700 border-orange-200",
  CRITICAL: "bg-red-600 text-white border-red-600",
};

export const categoryInfo = (value) =>
  CATEGORIES.find((c) => c.value === value) || CATEGORIES[CATEGORIES.length - 1];

export const recipientLabel = (value) =>
  RECIPIENTS.find((r) => r.value === value)?.label || value;

export const formatDateTime = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};