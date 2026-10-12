import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

const TIME_ZONE = "Asia/Kolkata";

// "2026-10-11" (in India time) for any stored date
const dayKey = (date) =>
  new Date(date).toLocaleDateString("en-CA", { timeZone: TIME_ZONE });

const monthKey = (date) => dayKey(date).slice(0, 7);

const formatMonth = (key) => {
  const [year, month] = key.split("-");

  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(
    "en-IN",
    { month: "long", year: "numeric" }
  );
};

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: TIME_ZONE,
  });

const formatWeekday = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    weekday: "long",
    timeZone: TIME_ZONE,
  });

const getPercentage = (present, total) =>
  total > 0 ? Math.round((present / total) * 100) : 0;

function StudentAttendance() {
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [month, setMonth] = useState("ALL");

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!user.studentId) {
        setError("Student profile not found. Please log in again.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          `/api/attendance/student/${user.studentId}`
        );

        setRecords(response.data.attendance || []);
      } catch (err) {
        console.error("Fetch attendance error:", err);

        setError(
          err.response?.data?.message ||
            "Unable to load your attendance. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Months that have records (newest first)
  const months = useMemo(() => {
    const keys = new Set(records.map((record) => monthKey(record.date)));
    return Array.from(keys).sort().reverse();
  }, [records]);

  // Records for the chosen month
  const visibleRecords = useMemo(() => {
    if (month === "ALL") return records;

    return records.filter((record) => monthKey(record.date) === month);
  }, [records, month]);

  const total = visibleRecords.length;

  const present = visibleRecords.filter(
    (record) => record.status === "PRESENT"
  ).length;

  const absent = total - present;

  const percentage = getPercentage(present, total);

  const percentageColor =
    percentage >= 75
      ? "text-emerald-600"
      : percentage >= 60
      ? "text-amber-600"
      : "text-red-600";

  const barColor =
    percentage >= 75
      ? "bg-emerald-500"
      : percentage >= 60
      ? "bg-amber-500"
      : "bg-red-500";

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
        {/* ================= HEADER ================= */}

        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <Link
            to="/student"
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 transition hover:text-blue-800"
          >
            ← Back to Dashboard
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                My Attendance
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                {user.name ? `${user.name} · ` : ""}
                Hostel attendance marked by your warden.
              </p>
            </div>

            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              disabled={loading || months.length === 0}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-100 sm:w-56"
            >
              <option value="ALL">All time</option>

              {months.map((key) => (
                <option key={key} value={key}>
                  {formatMonth(key)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-14 text-center shadow-sm">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
            <p className="mt-4 text-sm text-slate-500">
              Loading your attendance...
            </p>
          </div>
        ) : (
          <>
            {/* ================= SUMMARY ================= */}

            <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1">
                <p className="text-sm font-medium text-slate-500">
                  Attendance
                </p>

                <p className={`mt-2 text-3xl font-bold ${percentageColor}`}>
                  {percentage}%
                </p>

                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${barColor}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Present</p>
                <p className="mt-2 text-3xl font-bold text-emerald-600">
                  {present}
                </p>
                <p className="mt-1 text-xs text-slate-400">days</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Absent</p>
                <p className="mt-2 text-3xl font-bold text-red-600">
                  {absent}
                </p>
                <p className="mt-1 text-xs text-slate-400">days</p>
              </div>

              <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1">
                <p className="text-sm font-medium text-slate-500">
                  Total Marked
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {total}
                </p>
                <p className="mt-1 text-xs text-slate-400">days</p>
              </div>
            </div>

            {/* ================= RECORDS ================= */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-5 sm:p-6">
                <h2 className="text-lg font-bold text-slate-900">
                  Attendance History
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {month === "ALL" ? "All records" : formatMonth(month)}
                </p>
              </div>

              {visibleRecords.length === 0 ? (
                <div className="p-14 text-center">
                  <div className="mb-3 text-4xl">📋</div>

                  <h3 className="font-semibold text-slate-800">
                    No attendance records yet
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Your attendance will appear here once your warden marks it.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px]">
                    <thead className="border-b border-slate-200 bg-slate-50">
                      <tr>
                        {["Date", "Day", "Status", "Hostel", "Remarks"].map(
                          (heading) => (
                            <th
                              key={heading}
                              className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                              {heading}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {visibleRecords.map((record) => (
                        <tr key={record._id} className="hover:bg-slate-50">
                          <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                            {formatDate(record.date)}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {formatWeekday(record.date)}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                record.status === "PRESENT"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {record.status === "PRESENT"
                                ? "Present"
                                : "Absent"}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {record.hostelId?.name || "—"}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-500">
                            {record.remarks || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default StudentAttendance;