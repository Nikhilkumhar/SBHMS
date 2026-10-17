import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { getSessionUser } from "../../utils/roleHome";
import {
  CATEGORIES,
  SEVERITIES,
  OPEN_STATUSES,
  STATUS_LABEL,
  recipientLabel,
  formatDateTime,
} from "../../utils/complaintMeta";
import {
  StatusBadge,
  SeverityBadge,
  CategoryBadge,
  ComplaintTimeline,
} from "../../components/ComplaintParts";

const SEVERITY_RANK = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };

// What each action needs and how it is described
const ACTIONS = {
  IN_PROGRESS: {
    title: "Start working on this complaint",
    button: "Mark In Progress",
    noteRequired: false,
    notePlaceholder: "Optional: tell the student what you are doing (e.g. plumber called)",
    style: "bg-blue-600 hover:bg-blue-700 text-white",
  },
  RESOLVED: {
    title: "Mark as resolved",
    button: "Mark Resolved",
    noteRequired: true,
    notePlaceholder: "Describe how it was resolved (the student will see this)",
    style: "bg-green-600 hover:bg-green-700 text-white",
  },
  REJECTED: {
    title: "Reject this complaint",
    button: "Reject",
    noteRequired: true,
    notePlaceholder: "Give a reason for rejecting (the student will see this)",
    style: "bg-red-600 hover:bg-red-700 text-white",
  },
  ESCALATE: {
    title: "Escalate to Admin",
    button: "Escalate",
    noteRequired: false,
    notePlaceholder: "Optional: why does the admin need to handle this?",
    style: "bg-purple-600 hover:bg-purple-700 text-white",
  },
};

function ComplaintManagement() {
  const navigate = useNavigate();

  const user = getSessionUser();
  const role = user?.role; // WARDEN or ADMIN
  const homePath = role === "WARDEN" ? "/warden" : "/admin";

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [statusFilter, setStatusFilter] = useState("OPEN");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const [openId, setOpenId] = useState(null);
  const [action, setAction] = useState(null); // { id, type }
  const [note, setNote] = useState("");
  const [busyId, setBusyId] = useState(null);

  /* ================= LOAD ================= */

  const fetchComplaints = useCallback(async () => {
    try {
      setError("");

      const response = await api.get("/api/complaints");

      setComplaints(response.data.complaints || []);
    } catch (err) {
      console.error("Complaints error:", err);

      setError(err.response?.data?.message || "Unable to load complaints.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  /* ================= FILTER + SORT ================= */

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();

    return complaints
      .filter((c) => {
        if (statusFilter === "OPEN" && !OPEN_STATUSES.includes(c.status)) return false;
        if (statusFilter !== "OPEN" && statusFilter !== "ALL" && c.status !== statusFilter) {
          return false;
        }
        if (categoryFilter !== "ALL" && c.category !== categoryFilter) return false;
        if (severityFilter !== "ALL" && c.severity !== severityFilter) return false;

        if (term) {
          const student = c.studentId?.userId?.name || "";
          const sbuId = c.studentId?.sbuId || "";

          const haystack = `${c.complaintNo} ${c.title} ${student} ${sbuId}`.toLowerCase();

          if (!haystack.includes(term)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const aOpen = OPEN_STATUSES.includes(a.status) ? 1 : 0;
        const bOpen = OPEN_STATUSES.includes(b.status) ? 1 : 0;

        // Open complaints first, then most serious, then newest
        if (aOpen !== bOpen) return bOpen - aOpen;

        if (aOpen && SEVERITY_RANK[a.severity] !== SEVERITY_RANK[b.severity]) {
          return SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
        }

        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }, [complaints, statusFilter, categoryFilter, severityFilter, search]);

  const stats = useMemo(() => {
    const open = complaints.filter((c) => OPEN_STATUSES.includes(c.status));

    return {
      open: open.length,
      critical: open.filter((c) => c.severity === "CRITICAL").length,
      ragging: open.filter((c) => c.category === "RAGGING").length,
      resolved: complaints.filter((c) => c.status === "RESOLVED").length,
    };
  }, [complaints]);

  /* ================= ACTIONS ================= */

  // Some responses do not include the populated student - keep the one we have
  const mergeComplaint = (updated) => {
    setComplaints((prev) =>
      prev.map((c) =>
        c._id === updated._id
          ? {
              ...c,
              ...updated,
              studentId:
                typeof updated.studentId === "object" && updated.studentId?.userId
                  ? updated.studentId
                  : c.studentId,
            }
          : c
      )
    );
  };

  const startAction = (id, type) => {
    setAction({ id, type });
    setNote("");
    setError("");
    setSuccess("");
  };

  const cancelAction = () => {
    setAction(null);
    setNote("");
  };

  const submitAction = async () => {
    if (!action) return;

    const config = ACTIONS[action.type];

    if (config.noteRequired && note.trim().length < 3) {
      setError("Please write a note before continuing.");
      return;
    }

    try {
      setBusyId(action.id);
      setError("");

      const response =
        action.type === "ESCALATE"
          ? await api.put(`/api/complaints/${action.id}/escalate`, { note: note.trim() })
          : await api.put(`/api/complaints/${action.id}/status`, {
              status: action.type,
              note: note.trim(),
            });

      mergeComplaint(response.data.complaint);
      setSuccess(response.data.message);
      cancelAction();
    } catch (err) {
      console.error("Complaint action error:", err);

      setError(err.response?.data?.message || "Unable to update the complaint.");
    } finally {
      setBusyId(null);
    }
  };

  const retryDswEmail = async (id) => {
    try {
      setBusyId(id);
      setError("");
      setSuccess("");

      const response = await api.post(`/api/complaints/${id}/resend-dsw`);

      mergeComplaint(response.data.complaint);
      setSuccess("Retrying the email to the DSW. Refresh in a moment to see the result.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to retry the email.");
    } finally {
      setBusyId(null);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    navigate(role === "ADMIN" ? "/admin-login" : "/staff-login");
  };

  /* ================= RENDER ================= */

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
      {/* ================= NAVBAR ================= */}
      <nav className="bg-white border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(homePath)}
            className="flex items-center gap-3"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-600/20">
              <span className="text-white text-xl font-bold">S</span>
            </div>

            <div className="text-left">
              <h1 className="text-lg font-bold text-slate-900">SBHMS</h1>

              <p className="text-[10px] text-blue-600 font-semibold tracking-wide">
                SARALA BIRLA HOSTEL
              </p>
            </div>
          </button>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-700">
              {role === "ADMIN" ? "Admin" : "Warden"} Portal
            </span>

            <button
              type="button"
              onClick={() => navigate(homePath)}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              ← Dashboard
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg border border-red-200 bg-red-50 text-sm font-semibold text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
        {/* ================= HEADER ================= */}
        <section className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-600">Student Complaints</p>

            <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Complaint Management
            </h2>

            <p className="mt-2 text-slate-500">
              Most serious complaints are shown first. Ragging cases are always marked critical.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchComplaints}
            className="self-start sm:self-auto px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Refresh
          </button>
        </section>

        {/* ================= STATS ================= */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Open complaints" value={stats.open} style="text-blue-700 bg-blue-50" />
          <StatCard label="Critical (open)" value={stats.critical} style="text-red-700 bg-red-50" />
          <StatCard label="Ragging (open)" value={stats.ragging} style="text-orange-700 bg-orange-50" />
          <StatCard label="Resolved" value={stats.resolved} style="text-green-700 bg-green-50" />
        </section>

        {/* ================= FILTERS ================= */}
        <section className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, SBU ID, number or title"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white outline-none focus:border-blue-500"
          >
            <option value="OPEN">Open (pending + in progress)</option>
            <option value="ALL">All statuses</option>
            {Object.entries(STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white outline-none focus:border-blue-500"
          >
            <option value="ALL">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white outline-none focus:border-blue-500"
          >
            <option value="ALL">All severities</option>
            {SEVERITIES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </section>

        {/* ================= MESSAGES ================= */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* ================= LIST ================= */}
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />

            <p className="mt-4 text-sm text-slate-500">Loading complaints...</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl py-14 text-center">
            <p className="text-3xl">✅</p>

            <p className="mt-3 text-sm font-semibold text-slate-700">No complaints found</p>

            <p className="mt-1 text-sm text-slate-500">Try changing the filters above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {visible.map((complaint) => {
              const student = complaint.studentId;
              const studentUser = student?.userId;
              const isOpen = OPEN_STATUSES.includes(complaint.status);
              const expanded = openId === complaint._id;
              const activeAction = action?.id === complaint._id ? action : null;
              const busy = busyId === complaint._id;

              const canEscalate =
                role === "WARDEN" && isOpen && !complaint.sentTo?.includes("ADMIN");

              const canRetryDsw =
                role === "ADMIN" &&
                complaint.sentTo?.includes("DSW") &&
                complaint.dswEmail?.status === "FAILED";

              const urgent = isOpen && complaint.severity === "CRITICAL";

              return (
                <article
                  key={complaint._id}
                  className={`bg-white rounded-2xl border shadow-sm p-5 ${
                    urgent ? "border-red-300 ring-1 ring-red-100" : "border-slate-200"
                  }`}
                >
                  {/* Top row */}
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-400">
                        {complaint.complaintNo} • {formatDateTime(complaint.createdAt)}
                      </p>

                      <h4 className="mt-1 text-base font-semibold text-slate-900 break-words">
                        {complaint.title}
                      </h4>
                    </div>

                    <div className="flex flex-wrap gap-2 shrink-0">
                      <CategoryBadge category={complaint.category} />
                      <SeverityBadge severity={complaint.severity} />
                      <StatusBadge status={complaint.status} />
                    </div>
                  </div>

                  {/* Student */}
                  <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3 rounded-xl bg-slate-50 border border-slate-100 p-4 text-sm">
                    <Info label="Student" value={studentUser?.name} />
                    <Info label="SBU ID" value={student?.sbuId} />
                    <Info
                      label="Hostel / Room"
                      value={`${student?.hostelId?.name || "—"} / ${student?.roomId?.roomNumber || "—"}`}
                    />
                    <Info label="Phone" value={studentUser?.phone} />
                  </div>

                  <p className="mt-4 text-sm text-slate-700 leading-6 whitespace-pre-wrap break-words">
                    {complaint.description}
                  </p>

                  {/* Sent to */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-500">Sent to:</span>

                    {complaint.sentTo?.map((recipient) => (
                      <span
                        key={recipient}
                        className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium"
                      >
                        {recipientLabel(recipient)}
                      </span>
                    ))}

                    {complaint.sentTo?.includes("DSW") && (
                      <span
                        className={`px-2.5 py-1 rounded-full font-medium ${
                          complaint.dswEmail?.status === "SENT"
                            ? "bg-green-50 text-green-700"
                            : complaint.dswEmail?.status === "FAILED"
                            ? "bg-red-50 text-red-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        DSW email: {complaint.dswEmail?.status?.toLowerCase()}
                      </span>
                    )}
                  </div>

                  {/* Outcome */}
                  {!isOpen && complaint.resolutionNote && (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      <span className="font-semibold">
                        {complaint.status === "RESOLVED" ? "Resolution: " : "Rejected: "}
                      </span>

                      {complaint.resolutionNote}
                    </div>
                  )}

                  {/* Actions */}
                  {(isOpen || canRetryDsw) && !activeAction && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {isOpen && complaint.status === "PENDING" && (
                        <ActionButton
                          label="Mark In Progress"
                          style={ACTIONS.IN_PROGRESS.style}
                          onClick={() => startAction(complaint._id, "IN_PROGRESS")}
                        />
                      )}

                      {isOpen && (
                        <>
                          <ActionButton
                            label="Mark Resolved"
                            style={ACTIONS.RESOLVED.style}
                            onClick={() => startAction(complaint._id, "RESOLVED")}
                          />

                          <ActionButton
                            label="Reject"
                            style="border border-red-200 bg-white text-red-600 hover:bg-red-50"
                            onClick={() => startAction(complaint._id, "REJECTED")}
                          />
                        </>
                      )}

                      {canEscalate && (
                        <ActionButton
                          label="Escalate to Admin"
                          style="border border-purple-200 bg-white text-purple-700 hover:bg-purple-50"
                          onClick={() => startAction(complaint._id, "ESCALATE")}
                        />
                      )}

                      {canRetryDsw && (
                        <ActionButton
                          label={busy ? "Retrying..." : "Retry DSW email"}
                          style="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          disabled={busy}
                          onClick={() => retryDswEmail(complaint._id)}
                        />
                      )}
                    </div>
                  )}

                  {/* Action panel */}
                  {activeAction && (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-800">
                        {ACTIONS[activeAction.type].title}
                      </p>

                      <textarea
                        rows={3}
                        maxLength={500}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder={ACTIONS[activeAction.type].notePlaceholder}
                        className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />

                      <div className="mt-3 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={cancelAction}
                          className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          onClick={submitAction}
                          disabled={busy}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60 ${
                            ACTIONS[activeAction.type].style
                          }`}
                        >
                          {busy ? "Saving..." : ACTIONS[activeAction.type].button}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* History */}
                  <button
                    type="button"
                    onClick={() => setOpenId(expanded ? null : complaint._id)}
                    className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    {expanded ? "Hide history ▲" : "View history ▼"}
                  </button>

                  {expanded && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <ComplaintTimeline timeline={complaint.timeline} viewerRole={role} />
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

/* ================= SMALL PARTS ================= */

function StatCard({ label, value, style }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>

      <p className={`mt-2 inline-block rounded-lg px-3 py-1 text-2xl font-bold ${style}`}>{value}</p>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-slate-400">{label}</p>

      <p className="mt-0.5 font-medium text-slate-800 break-words">{value || "—"}</p>
    </div>
  );
}

function ActionButton({ label, style, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-60 ${style}`}
    >
      {label}
    </button>
  );
}

export default ComplaintManagement;