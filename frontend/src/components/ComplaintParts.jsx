import {
  STATUS_LABEL,
  STATUS_STYLE,
  SEVERITY_STYLE,
  SEVERITIES,
  categoryInfo,
  formatDateTime,
} from "../utils/complaintMeta";

/* ================= BADGES ================= */

export function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold ${
        STATUS_STYLE[status] || STATUS_STYLE.PENDING
      }`}
    >
      {STATUS_LABEL[status] || status}
    </span>
  );
}

export function SeverityBadge({ severity }) {
  const label = SEVERITIES.find((s) => s.value === severity)?.label || severity;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold ${
        SEVERITY_STYLE[severity] || SEVERITY_STYLE.MEDIUM
      }`}
    >
      {label}
    </span>
  );
}

export function CategoryBadge({ category }) {
  const info = categoryInfo(category);
  const isRagging = category === "RAGGING";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${
        isRagging
          ? "bg-red-50 text-red-700 border-red-200"
          : "bg-indigo-50 text-indigo-700 border-indigo-100"
      }`}
    >
      <span>{info.icon}</span>
      {info.label}
    </span>
  );
}

/* ================= PROGRESS TRACKER =================
   Received -> In Progress -> Resolved / Rejected */

export function ProgressTracker({ status }) {
  const rejected = status === "REJECTED";

  const steps = [
    { label: "Received", done: true },
    { label: "In Progress", done: status !== "PENDING" },
    {
      label: rejected ? "Rejected" : "Resolved",
      done: status === "RESOLVED" || rejected,
    },
  ];

  return (
    <div className="flex items-center">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const dotColor = step.done
          ? isLast && rejected
            ? "bg-red-500 text-white"
            : "bg-green-500 text-white"
          : "bg-slate-200 text-slate-500";

        return (
          <div key={step.label} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${dotColor}`}
              >
                {step.done ? (isLast && rejected ? "✕" : "✓") : index + 1}
              </div>

              <span className="text-[11px] font-medium text-slate-600 whitespace-nowrap">
                {step.label}
              </span>
            </div>

            {!isLast && (
              <div
                className={`flex-1 h-0.5 mx-2 mb-5 ${
                  steps[index + 1].done ? "bg-green-400" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ================= TIMELINE ================= */

const ROLE_LABEL = {
  STUDENT: "You",
  WARDEN: "Warden",
  ADMIN: "Admin",
  SYSTEM: "System",
};

const ACTION_LABEL = {
  CREATED: "Complaint submitted",
  STATUS_CHANGED: "Status updated",
  ESCALATED: "Escalated",
  DSW_EMAILED: "Emailed to DSW",
  DSW_EMAIL_FAILED: "DSW email failed",
};

export function ComplaintTimeline({ timeline = [], viewerRole = "STUDENT" }) {
  const entries = [...timeline].reverse();

  return (
    <ol className="space-y-4">
      {entries.map((entry, index) => {
        const failed = entry.action === "DSW_EMAIL_FAILED";
        const who =
          entry.byRole === viewerRole && viewerRole !== "STUDENT"
            ? "You"
            : ROLE_LABEL[entry.byRole] || entry.byRole;

        return (
          <li key={`${entry.at}-${index}`} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`w-2.5 h-2.5 rounded-full mt-1.5 ${
                  failed ? "bg-red-500" : index === 0 ? "bg-blue-600" : "bg-slate-300"
                }`}
              />
              {index !== entries.length - 1 && <span className="w-px flex-1 bg-slate-200 mt-1" />}
            </div>

            <div className="pb-1">
              <p className="text-sm font-semibold text-slate-800">
                {ACTION_LABEL[entry.action] || entry.action}
                {entry.action === "STATUS_CHANGED" && (
                  <span className="ml-2">
                    <StatusBadge status={entry.status} />
                  </span>
                )}
              </p>

              {entry.note && (
                <p className="mt-1 text-sm text-slate-600 leading-6 break-words">{entry.note}</p>
              )}

              <p className="mt-0.5 text-xs text-slate-400">
                {who} • {formatDateTime(entry.at)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}