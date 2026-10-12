import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function AttendanceManagement() {
  const navigate = useNavigate();

  const [hostels, setHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const [roster, setRoster] = useState([]);
  const [excludedHomeStudents, setExcludedHomeStudents] = useState([]);
  const [summary, setSummary] = useState(null);

  const [attendanceStatus, setAttendanceStatus] = useState({});
  const [remarks, setRemarks] = useState({});

  const [loadingHostels, setLoadingHostels] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = sessionStorage.getItem("token");

  // ======================================================
  // FETCH HOSTELS
  // ======================================================

  useEffect(() => {
    fetchHostels();
  }, []);

  const fetchHostels = async () => {
    try {
      setLoadingHostels(true);
      setError("");

      const response = await api.get("/api/hostels", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const hostelList = response.data.hostels || [];

      setHostels(hostelList);

      if (hostelList.length > 0) {
        setSelectedHostel(
          hostelList[0]._id || hostelList[0].id
        );
      }
    } catch (err) {
      console.error("Fetch hostels error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load hostels."
      );
    } finally {
      setLoadingHostels(false);
    }
  };

  // ======================================================
  // FETCH ATTENDANCE ROSTER
  // ======================================================

  useEffect(() => {
    if (selectedHostel && selectedDate) {
      fetchRoster();
    }
  }, [selectedHostel, selectedDate]);

  const fetchRoster = async () => {
    try {
      setLoadingRoster(true);
      setError("");
      setSuccess("");

      const response = await api.get(
        "/api/attendance/roster",
        {
          params: {
            hostelId: selectedHostel,
            date: selectedDate,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;

      setRoster(data.roster || []);
      setExcludedHomeStudents(
        data.excludedHomeStudents || []
      );
      setSummary(data.summary || null);

      // Load existing attendance statuses
      const existingStatuses = {};
      const existingRemarks = {};

      (data.roster || []).forEach((student) => {
        if (
          student.attendanceStatus &&
          student.attendanceStatus !== "NOT_MARKED"
        ) {
          existingStatuses[
            student.studentId
          ] = student.attendanceStatus;
        }

        if (student.remarks) {
          existingRemarks[
            student.studentId
          ] = student.remarks;
        }
      });

      setAttendanceStatus(existingStatuses);
      setRemarks(existingRemarks);
    } catch (err) {
      console.error("Fetch attendance roster error:", err);

      setRoster([]);
      setExcludedHomeStudents([]);
      setSummary(null);

      setError(
        err.response?.data?.message ||
          "Unable to load attendance roster."
      );
    } finally {
      setLoadingRoster(false);
    }
  };

  // ======================================================
  // MARK STATUS
  // ======================================================

  const handleStatusChange = (studentId, status) => {
    setAttendanceStatus((previous) => ({
      ...previous,
      [studentId]: status,
    }));
  };

  // ======================================================
  // REMARKS
  // ======================================================

  const handleRemarksChange = (studentId, value) => {
    setRemarks((previous) => ({
      ...previous,
      [studentId]: value,
    }));
  };

  // ======================================================
  // MARK ALL PRESENT
  // ======================================================

  const markAllPresent = () => {
    const updated = {};

    roster.forEach((student) => {
      updated[student.studentId] = "PRESENT";
    });

    setAttendanceStatus(updated);
    setSuccess("");
    setError("");
  };

  // ======================================================
  // MARK ALL ABSENT
  // ======================================================

  const markAllAbsent = () => {
    const updated = {};

    roster.forEach((student) => {
      updated[student.studentId] = "ABSENT";
    });

    setAttendanceStatus(updated);
    setSuccess("");
    setError("");
  };

  // ======================================================
  // CLEAR UNMARKED
  // ======================================================

  const clearUnmarked = () => {
    const updated = { ...attendanceStatus };

    roster.forEach((student) => {
      if (
        student.attendanceStatus === "NOT_MARKED"
      ) {
        delete updated[student.studentId];
      }
    });

    setAttendanceStatus(updated);
  };

  // ======================================================
  // SUBMIT BULK ATTENDANCE
  // ======================================================

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const attendance = roster
        .filter(
          (student) =>
            attendanceStatus[student.studentId]
        )
        .map((student) => ({
          studentId: student.studentId,
          status:
            attendanceStatus[student.studentId],
          remarks:
            remarks[student.studentId] || undefined,
        }));

      if (attendance.length === 0) {
        setError(
          "Please mark at least one student's attendance."
        );
        return;
      }

      const response = await api.post(
        "/api/attendance/bulk",
        {
          hostelId: selectedHostel,
          date: selectedDate,
          attendance,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(
        response.data.message ||
          "Attendance marked successfully."
      );

      await fetchRoster();
    } catch (err) {
      console.error(
        "Submit attendance error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to mark attendance."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ======================================================
  // COUNTS
  // ======================================================

  const currentCounts = useMemo(() => {
    let present = 0;
    let absent = 0;
    let notMarked = 0;

    roster.forEach((student) => {
      const status =
        attendanceStatus[student.studentId] ||
        student.attendanceStatus;

      if (status === "PRESENT") {
        present++;
      } else if (status === "ABSENT") {
        absent++;
      } else {
        notMarked++;
      }
    });

    return {
      present,
      absent,
      notMarked,
    };
  }, [roster, attendanceStatus]);

  // ======================================================
  // MOVEMENT BADGE
  // ======================================================

  const getMovementBadge = (student) => {
    if (student.movementStatus === "MARKET_OUT") {
      return (
        <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700">
          Market Out
        </span>
      );
    }

    if (
      student.movementStatus === "COLLEGE_OUT"
    ) {
      return (
        <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
          College Out
        </span>
      );
    }

    return (
      <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
        Hostel
      </span>
    );
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
                onClick={() => navigate("/admin")}
                className="mb-3 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                ← Back to Dashboard
              </button>

              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Attendance Management
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                View and manage daily hostel attendance.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchRoster}
              disabled={
                loadingRoster ||
                !selectedHostel
              }
              className="self-start rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 lg:self-center"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* FILTERS */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* HOSTEL */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Select Hostel
              </label>

              <select
                value={selectedHostel}
                onChange={(e) =>
                  setSelectedHostel(e.target.value)
                }
                disabled={loadingHostels}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {loadingHostels ? (
                  <option>
                    Loading hostels...
                  </option>
                ) : (
                  <>
                    <option value="">
                      Select Hostel
                    </option>

                    {hostels.map((hostel) => (
                      <option
                        key={
                          hostel._id ||
                          hostel.id
                        }
                        value={
                          hostel._id ||
                          hostel.id
                        }
                      >
                        {hostel.name}
                        {hostel.code
                          ? ` (${hostel.code})`
                          : ""}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            {/* DATE */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Attendance Date
              </label>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) =>
                  setSelectedDate(e.target.value)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
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

        {/* SUMMARY */}
        {summary && (
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Total Students
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {summary.totalStudents}
              </p>
            </div>

            <div className="rounded-2xl border border-purple-100 bg-purple-50 p-5">
              <p className="text-sm text-purple-700">
                Home Outside
              </p>

              <p className="mt-2 text-3xl font-bold text-purple-900">
                {summary.homeOutside}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
              <p className="text-sm text-emerald-700">
                Expected Attendance
              </p>

              <p className="mt-2 text-3xl font-bold text-emerald-900">
                {summary.expectedAttendance}
              </p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <p className="text-sm text-blue-700">
                Present
              </p>

              <p className="mt-2 text-3xl font-bold text-blue-900">
                {currentCounts.present}
              </p>
            </div>

            <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
              <p className="text-sm text-red-700">
                Absent
              </p>

              <p className="mt-2 text-3xl font-bold text-red-900">
                {currentCounts.absent}
              </p>
            </div>
          </div>
        )}

        {/* MOVEMENT INFORMATION */}
        {summary && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div>
                <span className="font-semibold text-cyan-700">
                  Market Outside:
                </span>{" "}
                {summary.marketOutside}
              </div>

              <div>
                <span className="font-semibold text-blue-700">
                  College Currently Out:
                </span>{" "}
                {summary.collegeCurrentlyOut}
              </div>

              <div>
                <span className="font-semibold text-slate-700">
                  Not Marked:
                </span>{" "}
                {currentCounts.notMarked}
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Market-out and college-out students remain
              part of the expected hostel attendance.
              Only HOME + OUT students are excluded.
            </p>
          </div>
        )}

        {/* ACTION BAR */}
        {roster.length > 0 && (
          <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-slate-900">
                Attendance Roster
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Mark attendance for the selected hostel
                and date.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={markAllPresent}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
              >
                Mark All Present
              </button>

              <button
                type="button"
                onClick={markAllAbsent}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
              >
                Mark All Absent
              </button>

              <button
                type="button"
                onClick={clearUnmarked}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* ROSTER */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loadingRoster ? (
            <div className="p-14 text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

              <p className="mt-4 text-sm text-slate-500">
                Loading attendance roster...
              </p>
            </div>
          ) : roster.length === 0 ? (
            <div className="p-14 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
                ✓
              </div>

              <h3 className="font-semibold text-slate-800">
                No attendance records found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Select a hostel and date to load the
                attendance roster.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Student
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Room
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Movement
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Attendance
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Remarks
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {roster.map((student) => {
                    const studentId =
                      student.studentId;

                    const selectedStatus =
                      attendanceStatus[
                        studentId
                      ] ||
                      student.attendanceStatus ||
                      "NOT_MARKED";

                    return (
                      <tr
                        key={studentId}
                        className="transition hover:bg-slate-50"
                      >
                        {/* STUDENT */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                              {(
                                student.name || "S"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <p className="font-semibold text-slate-900">
                                {student.name ||
                                  "Unknown Student"}
                              </p>

                              <p className="text-xs text-slate-500">
                                {student.sbuId ||
                                  "—"}
                              </p>

                              <p className="text-xs text-slate-400">
                                {student.phone ||
                                  "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* ROOM */}
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-800">
                            Room{" "}
                            {student.roomNumber ||
                              "—"}
                          </p>

                          <p className="text-xs text-slate-500">
                            Floor{" "}
                            {student.floor ||
                              "—"}
                          </p>
                        </td>

                        {/* MOVEMENT */}
                        <td className="px-5 py-4">
                          {getMovementBadge(
                            student
                          )}
                        </td>

                        {/* ATTENDANCE */}
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleStatusChange(
                                  studentId,
                                  "PRESENT"
                                )
                              }
                              className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                                selectedStatus ===
                                "PRESENT"
                                  ? "bg-emerald-600 text-white"
                                  : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              }`}
                            >
                              Present
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleStatusChange(
                                  studentId,
                                  "ABSENT"
                                )
                              }
                              className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                                selectedStatus ===
                                "ABSENT"
                                  ? "bg-red-600 text-white"
                                  : "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                              }`}
                            >
                              Absent
                            </button>
                          </div>

                          <p className="mt-2 text-xs text-slate-400">
                            {selectedStatus ===
                            "NOT_MARKED"
                              ? "Not marked"
                              : selectedStatus}
                          </p>
                        </td>

                        {/* REMARKS */}
                        <td className="px-5 py-4">
                          <input
                            type="text"
                            value={
                              remarks[studentId] ||
                              ""
                            }
                            onChange={(e) =>
                              handleRemarksChange(
                                studentId,
                                e.target.value
                              )
                            }
                            placeholder="Optional"
                            className="w-56 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* SUBMIT */}
          {roster.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Present:{" "}
                <span className="font-semibold text-emerald-600">
                  {currentCounts.present}
                </span>{" "}
                · Absent:{" "}
                <span className="font-semibold text-red-600">
                  {currentCounts.absent}
                </span>{" "}
                · Not Marked:{" "}
                <span className="font-semibold text-slate-700">
                  {currentCounts.notMarked}
                </span>
              </p>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? "Saving Attendance..."
                  : "Save Attendance"}
              </button>
            </div>
          )}
        </div>

        {/* EXCLUDED HOME STUDENTS */}
        {excludedHomeStudents.length > 0 && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-purple-200 bg-white shadow-sm">
            <div className="border-b border-purple-100 bg-purple-50 px-5 py-4">
              <h2 className="font-semibold text-purple-900">
                Students Excluded from Attendance
              </h2>

              <p className="mt-1 text-xs text-purple-700">
                These students have an active HOME gate
                pass and are currently OUT.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Student
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      SBU ID
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Room
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Purpose
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {excludedHomeStudents.map(
                    (student) => (
                      <tr
                        key={
                          student.studentId
                        }
                      >
                        <td className="px-5 py-4 font-medium text-slate-800">
                          {student.name ||
                            "Unknown Student"}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {student.sbuId ||
                            "—"}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {student.roomNumber ||
                            "—"}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {student.purpose ||
                            "Going home"}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AttendanceManagement;