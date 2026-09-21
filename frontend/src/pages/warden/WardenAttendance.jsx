import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function WardenAttendance() {
  const navigate = useNavigate();

  const getToday = () => {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const [hostels, setHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState("");
  const [selectedDate, setSelectedDate] = useState(getToday());

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

  const token = localStorage.getItem("token");

  // =====================================================
  // FETCH HOSTELS
  // =====================================================

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

  // =====================================================
  // FETCH ROSTER
  // =====================================================

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

      const existingStatuses = {};
      const existingRemarks = {};

      (data.roster || []).forEach((student) => {
        if (
          student.attendanceStatus &&
          student.attendanceStatus !== "NOT_MARKED"
        ) {
          existingStatuses[student.studentId] =
            student.attendanceStatus;
        }

        if (student.remarks) {
          existingRemarks[student.studentId] =
            student.remarks;
        }
      });

      setAttendanceStatus(existingStatuses);
      setRemarks(existingRemarks);
    } catch (err) {
      console.error(
        "Fetch attendance roster error:",
        err
      );

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

  // =====================================================
  // STATUS CHANGE
  // =====================================================

  const handleStatusChange = (studentId, status) => {
    setAttendanceStatus((previous) => ({
      ...previous,
      [studentId]: status,
    }));

    setSuccess("");
    setError("");
  };

  // =====================================================
  // REMARKS
  // =====================================================

  const handleRemarksChange = (studentId, value) => {
    setRemarks((previous) => ({
      ...previous,
      [studentId]: value,
    }));
  };

  // =====================================================
  // MARK ALL PRESENT
  // =====================================================

  const markAllPresent = () => {
    const updated = {};

    roster.forEach((student) => {
      updated[student.studentId] = "PRESENT";
    });

    setAttendanceStatus(updated);
    setSuccess("");
    setError("");
  };

  // =====================================================
  // MARK ALL ABSENT
  // =====================================================

  const markAllAbsent = () => {
    const updated = {};

    roster.forEach((student) => {
      updated[student.studentId] = "ABSENT";
    });

    setAttendanceStatus(updated);
    setSuccess("");
    setError("");
  };

  // =====================================================
  // SUBMIT ATTENDANCE
  // =====================================================

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

  // =====================================================
  // CURRENT COUNTS
  // =====================================================

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

  // =====================================================
  // MOVEMENT BADGE
  // =====================================================

  const getMovementBadge = (student) => {
    if (student.movementStatus === "MARKET_OUT") {
      return (
        <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
          Market Out
        </span>
      );
    }

    if (student.movementStatus === "COLLEGE_OUT") {
      return (
        <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          College Out
        </span>
      );
    }

    return (
      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
        Hostel
      </span>
    );
  };

  // =====================================================
  // ATTENDANCE BADGE
  // =====================================================

  const getAttendanceBadge = (student) => {
    const status =
      attendanceStatus[student.studentId] ||
      student.attendanceStatus;

    if (status === "PRESENT") {
      return (
        <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
          Present
        </span>
      );
    }

    if (status === "ABSENT") {
      return (
        <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
          Absent
        </span>
      );
    }

    return (
      <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
        Not Marked
      </span>
    );
  };

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1500px]">

        {/* HEADER */}

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <button
                type="button"
                onClick={() => navigate("/warden/gate-pass")}
                className="mb-3 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                ← Warden Portal
              </button>

              <p className="text-sm font-semibold text-blue-600">
                SARALA BIRLA HOSTEL
              </p>

              <h1 className="mt-1 text-3xl font-bold text-slate-900">
                Warden Attendance
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Manage daily hostel attendance and monitor
                student movement.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchRoster}
              disabled={loadingRoster}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingRoster
                ? "Refreshing..."
                : "↻ Refresh"}
            </button>

          </div>

        </div>

        {/* FILTERS */}

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="grid gap-5 md:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Hostel
              </label>

              <select
                value={selectedHostel}
                onChange={(e) =>
                  setSelectedHostel(e.target.value)
                }
                disabled={loadingHostels}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">
                  {loadingHostels
                    ? "Loading hostels..."
                    : "Select Hostel"}
                </option>

                {hostels.map((hostel) => (
                  <option
                    key={hostel._id || hostel.id}
                    value={hostel._id || hostel.id}
                  >
                    {hostel.name}{" "}
                    {hostel.code
                      ? `(${hostel.code})`
                      : ""}
                  </option>
                ))}
              </select>
            </div>

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
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

          </div>

        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-700">
            {success}
          </div>
        )}

        {/* SUMMARY */}

        {summary && (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">

            <SummaryCard
              title="Total Students"
              value={summary.totalStudents}
            />

            <SummaryCard
              title="Expected"
              value={summary.expectedAttendance}
            />

            <SummaryCard
              title="Present"
              value={currentCounts.present}
              valueClass="text-green-600"
            />

            <SummaryCard
              title="Absent"
              value={currentCounts.absent}
              valueClass="text-red-600"
            />

            <SummaryCard
              title="Not Marked"
              value={currentCounts.notMarked}
              valueClass="text-amber-600"
            />

            <SummaryCard
              title="Home Outside"
              value={summary.homeOutside}
              valueClass="text-purple-600"
            />

            <SummaryCard
              title="College Out"
              value={summary.collegeCurrentlyOut}
              valueClass="text-blue-600"
            />

          </div>
        )}

        {/* MOVEMENT INFORMATION */}

        {summary && (
          <div className="mb-6 grid gap-4 md:grid-cols-2">

            <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5">
              <p className="text-sm font-semibold text-cyan-800">
                Market Outside
              </p>

              <p className="mt-2 text-3xl font-bold text-cyan-700">
                {summary.marketOutside}
              </p>

              <p className="mt-1 text-xs text-cyan-700">
                Included in hostel attendance.
              </p>
            </div>

            <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5">
              <p className="text-sm font-semibold text-purple-800">
                Home Outside
              </p>

              <p className="mt-2 text-3xl font-bold text-purple-700">
                {summary.homeOutside}
              </p>

              <p className="mt-1 text-xs text-purple-700">
                Excluded from today's attendance roster.
              </p>
            </div>

          </div>
        )}

        {/* ACTION BAR */}

        {!loadingRoster && roster.length > 0 && (
          <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Student Attendance
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Mark attendance for students expected in the
                hostel.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">

              <button
                type="button"
                onClick={markAllPresent}
                className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-100"
              >
                Mark All Present
              </button>

              <button
                type="button"
                onClick={markAllAbsent}
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
              >
                Mark All Absent
              </button>

            </div>

          </div>
        )}

        {/* LOADING */}

        {loadingRoster && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Loading attendance roster...
            </p>
          </div>
        )}

        {/* ROSTER TABLE */}

        {!loadingRoster && roster.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="overflow-x-auto">

              <table className="min-w-[1100px] w-full">

                <thead className="border-b border-slate-200 bg-slate-50">

                  <tr>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Student
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Room
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Movement
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Current
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Mark Attendance
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Remarks
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-100">

                  {roster.map((student) => (

                    <tr
                      key={student.studentId}
                      className="hover:bg-slate-50"
                    >

                      {/* STUDENT */}

                      <td className="px-5 py-4">

                        <p className="font-semibold text-slate-900">
                          {student.name || "Unknown Student"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {student.sbuId}
                        </p>

                      </td>

                      {/* ROOM */}

                      <td className="px-5 py-4">

                        <p className="font-medium text-slate-800">
                          Room {student.roomNumber || "—"}
                        </p>

                        <p className="text-xs text-slate-500">
                          Floor {student.floor ?? "—"}
                        </p>

                      </td>

                      {/* MOVEMENT */}

                      <td className="px-5 py-4">
                        {getMovementBadge(student)}
                      </td>

                      {/* CURRENT */}

                      <td className="px-5 py-4">
                        {getAttendanceBadge(student)}
                      </td>

                      {/* MARK */}

                      <td className="px-5 py-4">

                        <div className="flex gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(
                                student.studentId,
                                "PRESENT"
                              )
                            }
                            className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                              (
                                attendanceStatus[
                                  student.studentId
                                ] ||
                                student.attendanceStatus
                              ) === "PRESENT"
                                ? "bg-green-600 text-white"
                                : "border border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                            }`}
                          >
                            Present
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(
                                student.studentId,
                                "ABSENT"
                              )
                            }
                            className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                              (
                                attendanceStatus[
                                  student.studentId
                                ] ||
                                student.attendanceStatus
                              ) === "ABSENT"
                                ? "bg-red-600 text-white"
                                : "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                            }`}
                          >
                            Absent
                          </button>

                        </div>

                      </td>

                      {/* REMARKS */}

                      <td className="px-5 py-4">

                        <input
                          type="text"
                          value={
                            remarks[student.studentId] || ""
                          }
                          onChange={(e) =>
                            handleRemarksChange(
                              student.studentId,
                              e.target.value
                            )
                          }
                          placeholder="Optional"
                          className="w-48 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

            {/* SAVE BAR */}

            <div className="flex flex-col gap-4 border-t border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <p className="text-sm font-semibold text-slate-800">
                  {currentCounts.present} Present ·{" "}
                  {currentCounts.absent} Absent ·{" "}
                  {currentCounts.notMarked} Not Marked
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Save attendance only after checking all
                  students.
                </p>

              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? "Saving..."
                  : "Save Attendance"}
              </button>

            </div>

          </div>
        )}

        {/* EMPTY ROSTER */}

        {!loadingRoster &&
          selectedHostel &&
          roster.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
                ✓
              </div>

              <h3 className="mt-4 text-lg font-bold text-slate-900">
                No Students in Attendance Roster
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                There are no students available for attendance
                for the selected hostel and date.
              </p>

            </div>
          )}

        {/* EXCLUDED HOME STUDENTS */}

        {!loadingRoster &&
          excludedHomeStudents.length > 0 && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-purple-200 bg-white shadow-sm">

              <div className="border-b border-purple-100 bg-purple-50 p-5">

                <h2 className="text-lg font-bold text-purple-900">
                  Home Outside — Excluded
                </h2>

                <p className="mt-1 text-sm text-purple-700">
                  These students are currently OUT on HOME
                  gate passes and are not included in today's
                  attendance.
                </p>

              </div>

              <div className="overflow-x-auto">

                <table className="min-w-[800px] w-full">

                  <thead className="bg-slate-50">

                    <tr>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                        Student
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                        Room
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                        Purpose
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                        Expected In
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {excludedHomeStudents.map((student) => (

                      <tr key={student.studentId}>

                        <td className="px-5 py-4">

                          <p className="font-semibold text-slate-900">
                            {student.name}
                          </p>

                          <p className="text-xs text-slate-500">
                            {student.sbuId}
                          </p>

                        </td>

                        <td className="px-5 py-4 text-sm text-slate-700">
                          Room {student.roomNumber || "—"}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-700">
                          {student.purpose || "—"}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-700">
                          {student.expectedInDate
                            ? new Date(
                                student.expectedInDate
                              ).toLocaleDateString(
                                "en-IN"
                              )
                            : "—"}

                          {student.expectedInTime
                            ? ` ${student.expectedInTime}`
                            : ""}
                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            </div>
          )}

      </div>
    </div>
  );
}

// =====================================================
// SUMMARY CARD
// =====================================================

function SummaryCard({
  title,
  value,
  valueClass = "text-slate-900",
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {title}
      </p>

      <p
        className={`mt-2 text-3xl font-bold ${valueClass}`}
      >
        {value ?? 0}
      </p>

    </div>
  );
}

export default WardenAttendance;