import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import {
  ANTI_RAGGING_HELPLINE,
  CATEGORIES,
  SEVERITIES,
  RECIPIENTS,
  isSerious,
  recipientLabel,
  formatDateTime,
} from "../../utils/complaintMeta";
import {
  StatusBadge,
  SeverityBadge,
  CategoryBadge,
  ProgressTracker,
  ComplaintTimeline,
} from "../../components/ComplaintParts";

const EMPTY_FORM = {
  category: "ROOM",
  title: "",
  description: "",
  severity: "MEDIUM",
  sentTo: ["WARDEN", "ADMIN"],
};

function StudentComplaints() {
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const [openId, setOpenId] = useState(null);
  const [retryingId, setRetryingId] = useState(null);

  const isRagging = form.category === "RAGGING";
  const dswAllowed = isSerious(form.category, form.severity);

  /* ================= LOAD ================= */

  const fetchComplaints = useCallback(async () => {
    try {
      setError("");

      const response = await api.get("/api/complaints");

      setComplaints(response.data.complaints || []);
    } catch (err) {
      console.error("Complaints error:", err);

      setError(err.response?.data?.message || "Unable to load your complaints.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  /* ================= FORM ================= */

  // Keeps severity and recipients valid whenever the category/severity changes
  const updateForm = (changes) => {
    setError("");
    setSuccess("");

    setForm((prev) => {
      const next = { ...prev, ...changes };

      if (changes.category && changes.category !== prev.category) {
        if (changes.category === "RAGGING") {
          // Ragging is always critical and can go to everyone
          next.severity = "CRITICAL";
          next.sentTo = ["WARDEN", "ADMIN", "DSW"];
        } else if (prev.category === "RAGGING") {
          next.severity = "MEDIUM";
          next.sentTo = ["WARDEN", "ADMIN"];
        }
      }

      // DSW is only for ragging / serious complaints
      if (!isSerious(next.category, next.severity)) {
        next.sentTo = next.sentTo.filter((r) => r !== "DSW");
      }

      return next;
    });
  };

  const toggleRecipient = (value) => {
    if (value === "DSW" && !dswAllowed) return;

    updateForm({
      sentTo: form.sentTo.includes(value)
        ? form.sentTo.filter((r) => r !== value)
        : [...form.sentTo, value],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (form.title.trim().length < 3) {
      setError("Please enter a short title (at least 3 characters).");
      return;
    }

    if (form.description.trim().length < 10) {
      setError("Please describe the problem in at least 10 characters.");
      return;
    }

    if (form.sentTo.length === 0) {
      setError("Please choose at least one person to send the complaint to.");
      return;
    }

    try {
      setSubmitting(true);

      await api.post("/api/complaints", {
        category: form.category,
        title: form.title.trim(),
        description: form.description.trim(),
        severity: form.severity,
        sentTo: form.sentTo,
      });

      setSuccess("Your complaint was submitted. You can track it below.");
      setForm(EMPTY_FORM);
      setShowForm(false);

      await fetchComplaints();
    } catch (err) {
      console.error("Create complaint error:", err);

      setError(err.response?.data?.message || "Unable to submit your complaint.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetryDsw = async (id) => {
    try {
      setRetryingId(id);
      setError("");

      await api.post(`/api/complaints/${id}/resend-dsw`);

      setSuccess("Retrying the email to the DSW. Refresh in a moment to see the result.");

      await fetchComplaints();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to retry the email.");
    } finally {
      setRetryingId(null);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    navigate("/");
  };

  /* ================= RENDER ================= */

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
      {/* ================= NAVBAR ================= */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/student")}
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
            <button
              type="button"
              onClick={() => navigate("/student")}
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

      <main className="max-w-5xl mx-auto px-6 lg:px-10 py-10">
        {/* ================= HEADER ================= */}
        <section className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-sm font-semibold text-blue-600">Student Portal</p>

            <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Complaints
            </h2>

            <p className="mt-2 text-slate-500">
              Report hostel problems and track them until they are solved.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={fetchComplaints}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Refresh
            </button>

            <button
              type="button"
              onClick={() => {
                setShowForm((value) => !value);
                setError("");
                setSuccess("");
              }}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition"
            >
              {showForm ? "Close" : "+ New Complaint"}
            </button>
          </div>
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

        {/* ================= NEW COMPLAINT FORM ================= */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-10 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6"
          >
            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-3">
                What is the complaint about?
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CATEGORIES.map((category) => {
                  const selected = form.category === category.value;
                  const ragging = category.value === "RAGGING";

                  return (
                    <button
                      key={category.value}
                      type="button"
                      onClick={() => updateForm({ category: category.value })}
                      className={`text-left rounded-xl border p-3 transition ${
                        selected
                          ? ragging
                            ? "border-red-500 bg-red-50 ring-2 ring-red-200"
                            : "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{category.icon}</span>

                        <span className="text-sm font-semibold text-slate-900">
                          {category.label}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-slate-500 leading-5">{category.hint}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ragging notice */}
            {isRagging && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 leading-6">
                <p className="font-semibold">Ragging is a serious offence and you are not alone.</p>

                <p className="mt-1">
                  This complaint is automatically marked <b>Critical</b>. Choose below who should
                  receive it. If you are in immediate danger, call <b>112</b>. National
                  Anti-Ragging Helpline: <b>{ANTI_RAGGING_HELPLINE}</b> (toll free).
                </p>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2" htmlFor="title">
                Title
              </label>

              <input
                id="title"
                type="text"
                maxLength={100}
                value={form.title}
                onChange={(e) => updateForm({ title: e.target.value })}
                placeholder="e.g. No water supply on 2nd floor since morning"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Description */}
            <div>
              <label
                className="block text-sm font-semibold text-slate-800 mb-2"
                htmlFor="description"
              >
                Details
              </label>

              <textarea
                id="description"
                rows={5}
                maxLength={1500}
                value={form.description}
                onChange={(e) => updateForm({ description: e.target.value })}
                placeholder="Describe what happened, where and when. For ragging, include what happened and who was involved if you can."
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <p className="mt-1 text-right text-xs text-slate-400">
                {form.description.length}/1500
              </p>
            </div>

            {/* Severity */}
            {!isRagging && (
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">
                  How serious is it?
                </label>

                <div className="flex flex-wrap gap-2">
                  {SEVERITIES.map((severity) => (
                    <button
                      key={severity.value}
                      type="button"
                      onClick={() => updateForm({ severity: severity.value })}
                      className={`px-4 py-2 rounded-lg border text-sm font-semibold transition ${
                        form.severity === severity.value
                          ? "border-blue-500 bg-blue-600 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {severity.label}
                    </button>
                  ))}
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Choose High or Critical for urgent problems. This also lets you contact the DSW.
                </p>
              </div>
            )}

            {/* Recipients */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-3">
                Send this complaint to
              </label>

              <div className="grid sm:grid-cols-3 gap-3">
                {RECIPIENTS.map((recipient) => {
                  const disabled = recipient.value === "DSW" && !dswAllowed;
                  const checked = form.sentTo.includes(recipient.value);

                  return (
                    <label
                      key={recipient.value}
                      className={`flex items-start gap-3 rounded-xl border p-3 transition ${
                        disabled
                          ? "border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed"
                          : checked
                          ? "border-blue-500 bg-blue-50 cursor-pointer"
                          : "border-slate-200 bg-white hover:border-slate-300 cursor-pointer"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggleRecipient(recipient.value)}
                      />

                      <span>
                        <span className="block text-sm font-semibold text-slate-900">
                          {recipient.label}
                        </span>

                        <span className="block text-xs text-slate-500">
                          {disabled ? "Only for ragging or high / critical" : recipient.hint}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setForm(EMPTY_FORM);
                }}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className={`px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition disabled:opacity-60 ${
                  isRagging ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {submitting ? "Submitting..." : "Submit Complaint"}
              </button>
            </div>
          </form>
        )}

        {/* ================= MY COMPLAINTS ================= */}
        <section>
          <h3 className="text-xl font-bold text-slate-900 mb-4">My Complaints</h3>

          {loading ? (
            <div className="py-16 text-center">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />

              <p className="mt-4 text-sm text-slate-500">Loading your complaints...</p>
            </div>
          ) : complaints.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl py-14 text-center">
              <p className="text-3xl">🛠️</p>

              <p className="mt-3 text-sm font-semibold text-slate-700">No complaints yet</p>

              <p className="mt-1 text-sm text-slate-500">
                Use “New Complaint” if something in the hostel needs attention.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {complaints.map((complaint) => {
                const expanded = openId === complaint._id;
                const sendsToDsw = complaint.sentTo?.includes("DSW");
                const dswStatus = complaint.dswEmail?.status;
                const closed = ["RESOLVED", "REJECTED"].includes(complaint.status);

                return (
                  <article
                    key={complaint._id}
                    className={`bg-white rounded-2xl border shadow-sm p-5 ${
                      complaint.category === "RAGGING" ? "border-red-200" : "border-slate-200"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
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

                    <p className="mt-3 text-sm text-slate-600 leading-6 whitespace-pre-wrap break-words">
                      {complaint.description}
                    </p>

                    {/* Sent to */}
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-slate-500">Sent to:</span>

                      {complaint.sentTo?.map((recipient) => (
                        <span
                          key={recipient}
                          className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium"
                        >
                          {recipientLabel(recipient)}
                        </span>
                      ))}

                      {sendsToDsw && (
                        <span
                          className={`px-2.5 py-1 rounded-full font-medium ${
                            dswStatus === "SENT"
                              ? "bg-green-50 text-green-700"
                              : dswStatus === "FAILED"
                              ? "bg-red-50 text-red-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          DSW email:{" "}
                          {dswStatus === "SENT"
                            ? "sent ✓"
                            : dswStatus === "FAILED"
                            ? "failed"
                            : "sending..."}
                        </span>
                      )}

                      {sendsToDsw && dswStatus === "FAILED" && (
                        <button
                          type="button"
                          onClick={() => handleRetryDsw(complaint._id)}
                          disabled={retryingId === complaint._id}
                          className="px-2.5 py-1 rounded-full border border-red-200 text-red-700 font-semibold hover:bg-red-50 disabled:opacity-60"
                        >
                          {retryingId === complaint._id ? "Retrying..." : "Retry email"}
                        </button>
                      )}
                    </div>

                    {/* Progress */}
                    <div className="mt-5 max-w-md">
                      <ProgressTracker status={complaint.status} />
                    </div>

                    {/* Outcome */}
                    {closed && complaint.resolutionNote && (
                      <div
                        className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                          complaint.status === "RESOLVED"
                            ? "border-green-200 bg-green-50 text-green-800"
                            : "border-red-200 bg-red-50 text-red-800"
                        }`}
                      >
                        <p className="font-semibold">
                          {complaint.status === "RESOLVED" ? "Resolution" : "Reason for rejection"}
                        </p>

                        <p className="mt-1 break-words">{complaint.resolutionNote}</p>
                      </div>
                    )}

                    {/* Track toggle */}
                    <button
                      type="button"
                      onClick={() => setOpenId(expanded ? null : complaint._id)}
                      className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                      {expanded ? "Hide tracking ▲" : "Track complaint ▼"}
                    </button>

                    {expanded && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <ComplaintTimeline timeline={complaint.timeline} viewerRole="STUDENT" />
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default StudentComplaints;