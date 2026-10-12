import { useEffect, useMemo, useState } from "react";
import { portalBase } from "../../utils/roleHome";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function CollegeMovementManagement() {
  const navigate = useNavigate();

  const [movements, setMovements] = useState([]);
  const [dailyReport, setDailyReport] = useState(null);

  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showCorrection, setShowCorrection] =
    useState(false);

  const [correctionData, setCorrectionData] = useState({
    sbuId: "",
    correctionType: "IN",
    correctionReason: "",
  });

  const [correcting, setCorrecting] = useState(false);

  const token = sessionStorage.getItem("token");

  // ======================================================
  // FETCH ALL MOVEMENTS
  // ======================================================

  useEffect(() => {
    fetchMovements();
  }, []);

  // ======================================================
  // FETCH DAILY REPORT WHEN DATE CHANGES
  // ======================================================

  useEffect(() => {
    if (selectedDate) {
      fetchDailyReport();
    }
  }, [selectedDate]);

  const fetchMovements = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/api/college-movements",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMovements(response.data.movements || []);
    } catch (err) {
      console.error(
        "Fetch college movements error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to load college movements."
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // FETCH DAILY REPORT
  // ======================================================

  const fetchDailyReport = async () => {
    try {
      setLoadingReport(true);

      const response = await api.get(
        "/api/college-movements/daily-report",
        {
          params: {
            date: selectedDate,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setDailyReport(response.data);
    } catch (err) {
      console.error(
        "Fetch daily report error:",
        err
      );

      setDailyReport(null);
    } finally {
      setLoadingReport(false);
    }
  };

  // ======================================================
  // REFRESH
  // ======================================================

  const refreshData = async () => {
    setSuccess("");

    await Promise.all([
      fetchMovements(),
      fetchDailyReport(),
    ]);
  };

  // ======================================================
  // FILTER MOVEMENTS
  // ======================================================

  const filteredMovements = useMemo(() => {
    const query = search.trim().toLowerCase();

    return movements.filter((movement) => {
      const student =
        movement.studentId || {};

      const user =
        student.userId || {};

      const name =
        user.name?.toLowerCase() || "";

      const sbuId =
        student.sbuId?.toLowerCase() || "";

      const course =
        student.course?.toLowerCase() || "";

      const hostel =
        student.hostelId?.name?.toLowerCase() ||
        student.hostelId?.code?.toLowerCase() ||
        "";

      const room =
        student.roomId?.roomNumber?.toString() ||
        "";

      const matchesSearch =
        !query ||
        name.includes(query) ||
        sbuId.includes(query) ||
        course.includes(query) ||
        hostel.includes(query) ||
        room.includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        movement.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [movements, search, statusFilter]);

  // ======================================================
  // SUMMARY
  // ======================================================

  const summary = useMemo(() => {
    return {
      total: movements.length,

      currentlyOut: movements.filter(
        (movement) =>
          movement.status === "OUT"
      ).length,

      returned: movements.filter(
        (movement) =>
          movement.status === "IN"
      ).length,

      corrected: movements.filter(
        (movement) =>
          movement.isCorrected
      ).length,
    };
  }, [movements]);

  // ======================================================
  // FORMAT DATE/TIME
  // ======================================================

  const formatDateTime = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // ======================================================
  // STATUS STYLE
  // ======================================================

  const getStatusStyle = (status) => {
    if (status === "OUT") {
      return "border-red-200 bg-red-50 text-red-700";
    }

    if (status === "IN") {
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }

    return "border-slate-200 bg-slate-50 text-slate-600";
  };

  // ======================================================
  // CORRECTION
  // ======================================================

  const openCorrection = () => {
    setCorrectionData({
      sbuId: "",
      correctionType: "IN",
      correctionReason: "",
    });

    setError("");
    setSuccess("");
    setShowCorrection(true);
  };

  const closeCorrection = () => {
    if (correcting) return;

    setShowCorrection(false);
  };

  const handleCorrectionChange = (e) => {
    const { name, value } = e.target;

    setCorrectionData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const submitCorrection = async (e) => {
    e.preventDefault();

    try {
      setCorrecting(true);
      setError("");
      setSuccess("");

      if (
        !correctionData.sbuId.trim()
      ) {
        setError("SBU ID is required.");
        return;
      }

      if (
        !correctionData.correctionReason.trim()
      ) {
        setError(
          "Correction reason is required."
        );
        return;
      }

      const response = await api.put(
        "/api/college-movements/correct",
        {
          sbuId:
            correctionData.sbuId
              .trim()
              .toUpperCase(),

          correctionType:
            correctionData.correctionType,

          correctionReason:
            correctionData.correctionReason.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(
        response.data.message ||
          "College movement corrected successfully."
      );

      setShowCorrection(false);

      await refreshData();
    } catch (err) {
      console.error(
        "College movement correction error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to correct college movement."
      );
    } finally {
      setCorrecting(false);
    }
  };

  // ======================================================
  // PAGE
  // ======================================================

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1500px]">

        {/* HEADER */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <button
                type="button"
                onClick={() =>
                  navigate(portalBase())
                }
                className="mb-3 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                ← Back to Dashboard
              </button>

              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                College Movement Management
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Monitor student college entry and exit movements.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={openCorrection}
                className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                Manual Correction
              </button>

              <button
                type="button"
                onClick={refreshData}
                disabled={
                  loading ||
                  loadingReport
                }
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ↻ Refresh
              </button>
            </div>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* SUCCESS */}
        {success && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {/* DATE */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Report Date
          </label>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) =>
              setSelectedDate(
                e.target.value
              )
            }
            className="w-full max-w-xs rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* DAILY REPORT */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Daily Movements
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {loadingReport
                ? "—"
                : dailyReport?.summary
                    ?.totalMovements ?? 0}
            </p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
            <p className="text-sm text-red-700">
              Students Went Out
            </p>

            <p className="mt-2 text-3xl font-bold text-red-900">
              {loadingReport
                ? "—"
                : dailyReport?.summary
                    ?.studentsWentOut ?? 0}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
            <p className="text-sm text-emerald-700">
              Returned In
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-900">
              {loadingReport
                ? "—"
                : dailyReport?.summary
                    ?.returnedIn ?? 0}
            </p>
          </div>

          <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
            <p className="text-sm text-orange-700">
              Currently Outside
            </p>

            <p className="mt-2 text-3xl font-bold text-orange-900">
              {loadingReport
                ? "—"
                : dailyReport?.summary
                    ?.currentlyOut ?? 0}
            </p>
          </div>
        </div>

        {/* OVERALL SUMMARY */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              All Records
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {summary.total}
            </p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
            <p className="text-sm text-red-700">
              Currently OUT
            </p>

            <p className="mt-2 text-2xl font-bold text-red-900">
              {summary.currentlyOut}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
            <p className="text-sm text-emerald-700">
              Returned
            </p>

            <p className="mt-2 text-2xl font-bold text-emerald-900">
              {summary.returned}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <p className="text-sm text-blue-700">
              Corrected
            </p>

            <p className="mt-2 text-2xl font-bold text-blue-900">
              {summary.corrected}
            </p>
          </div>
        </div>

        {/* FILTERS */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Search
              </label>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Name, SBU ID, course, hostel, room..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="ALL">
                  All Statuses
                </option>

                <option value="OUT">
                  Currently OUT
                </option>

                <option value="IN">
                  Returned IN
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* MOVEMENTS TABLE */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-900">
              College Movement Records
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Showing {filteredMovements.length} of{" "}
              {movements.length} records
            </p>
          </div>

          {loading ? (
            <div className="p-14 text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

              <p className="mt-4 text-sm text-slate-500">
                Loading college movements...
              </p>
            </div>
          ) : filteredMovements.length === 0 ? (
            <div className="p-14 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-xl">
                —
              </div>

              <h3 className="font-semibold text-slate-800">
                No movement records found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or status filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">

                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Student
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Hostel / Room
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      College OUT
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      College IN
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Recorded By
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Correction
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {filteredMovements.map(
                    (movement) => {
                      const student =
                        movement.studentId ||
                        {};

                      const user =
                        student.userId ||
                        {};

                      const hostel =
                        student.hostelId ||
                        {};

                      const room =
                        student.roomId ||
                        {};

                      const recordedOutBy =
                        movement.recordedOutBy ||
                        {};

                      const correctedBy =
                        movement.correctedBy ||
                        {};

                      return (
                        <tr
                          key={
                            movement._id ||
                            movement.id
                          }
                          className="transition hover:bg-slate-50"
                        >

                          {/* STUDENT */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                                {(
                                  user.name ||
                                  "S"
                                )
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>
                                <p className="font-semibold text-slate-900">
                                  {user.name ||
                                    "Unknown Student"}
                                </p>

                                <p className="text-xs text-slate-500">
                                  {student.sbuId ||
                                    "—"}
                                </p>

                                <p className="text-xs text-slate-400">
                                  {student.course ||
                                    "—"}
                                </p>
                              </div>

                            </div>
                          </td>

                          {/* HOSTEL / ROOM */}
                          <td className="px-5 py-4">
                            <p className="font-medium text-slate-800">
                              {hostel.name ||
                                hostel.code ||
                                "—"}
                            </p>

                            <p className="text-sm text-slate-500">
                              Room{" "}
                              {room.roomNumber ||
                                "—"}
                            </p>

                            <p className="text-xs text-slate-400">
                              Floor{" "}
                              {room.floor ||
                                "—"}
                            </p>
                          </td>

                          {/* OUT */}
                          <td className="px-5 py-4">
                            <p className="font-medium text-slate-800">
                              {formatDateTime(
                                movement.outTime
                              )}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              By:{" "}
                              {recordedOutBy.name ||
                                "—"}
                            </p>
                          </td>

                          {/* IN */}
                          <td className="px-5 py-4">
                            <p className="font-medium text-slate-800">
                              {formatDateTime(
                                movement.inTime
                              )}
                            </p>

                            {movement.recordedInBy && (
                              <p className="mt-1 text-xs text-slate-500">
                                By:{" "}
                                {movement.recordedInBy
                                  ?.name || "—"}
                              </p>
                            )}
                          </td>

                          {/* STATUS */}
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyle(
                                movement.status
                              )}`}
                            >
                              {movement.status ===
                              "OUT"
                                ? "OUT"
                                : "RETURNED"}
                            </span>

                            {movement.remarks && (
                              <p className="mt-2 max-w-[180px] text-xs text-slate-500">
                                {movement.remarks}
                              </p>
                            )}
                          </td>

                          {/* RECORDED BY */}
                          <td className="px-5 py-4">
                            <p className="text-sm font-medium text-slate-800">
                              {recordedOutBy.name ||
                                "—"}
                            </p>

                            <p className="text-xs text-slate-500">
                              {recordedOutBy.role ||
                                "—"}
                            </p>
                          </td>

                          {/* CORRECTION */}
                          <td className="px-5 py-4">

                            {movement.isCorrected ? (
                              <div>
                                <span className="inline-flex rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                                  Corrected
                                </span>

                                <p className="mt-2 max-w-[200px] text-xs text-slate-500">
                                  {movement.correctionReason ||
                                    "No reason"}
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  By:{" "}
                                  {correctedBy.name ||
                                    "—"}
                                </p>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">
                                —
                              </span>
                            )}

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>
              </table>
            </div>
          )}

        </div>

        {/* MANUAL CORRECTION MODAL */}
        {showCorrection && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">

            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">

              <div className="mb-6 flex items-start justify-between">

                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Manual Movement Correction
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Correct a student's college movement when the normal scan was missed.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeCorrection}
                  className="text-xl text-slate-400 hover:text-slate-700"
                >
                  ×
                </button>

              </div>

              <form
                onSubmit={submitCorrection}
                className="space-y-5"
              >

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Student SBU ID
                  </label>

                  <input
                    type="text"
                    name="sbuId"
                    value={
                      correctionData.sbuId
                    }
                    onChange={
                      handleCorrectionChange
                    }
                    placeholder="e.g. SBU2026002"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm uppercase outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Correction Type
                  </label>

                  <select
                    name="correctionType"
                    value={
                      correctionData.correctionType
                    }
                    onChange={
                      handleCorrectionChange
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="IN">
                      Mark College IN
                    </option>

                    <option value="OUT">
                      Mark College OUT
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Correction Reason
                  </label>

                  <textarea
                    name="correctionReason"
                    value={
                      correctionData.correctionReason
                    }
                    onChange={
                      handleCorrectionChange
                    }
                    rows="4"
                    placeholder="Enter the reason for this correction..."
                    className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">

                  <button
                    type="button"
                    onClick={closeCorrection}
                    disabled={correcting}
                    className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={correcting}
                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {correcting
                      ? "Correcting..."
                      : "Save Correction"}
                  </button>

                </div>

              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default CollegeMovementManagement;