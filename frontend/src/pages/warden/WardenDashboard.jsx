import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function WardenDashboard() {
  const navigate = useNavigate();

  const [warden, setWarden] = useState(null);

  const [stats, setStats] = useState({
    students: 0,
    pendingGatePasses: 0,
    present: 0,
    expectedAttendance: 0,
    collegeOut: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadWardenDashboard();
  }, []);

  const loadWardenDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        setWarden(JSON.parse(storedUser));
      }

      /* ==========================================
         FETCH BASIC DATA
      ========================================== */

      const [
        studentsResponse,
        gatePassResponse,
        hostelResponse,
        collegeOutResponse,
      ] = await Promise.all([
        api.get("/api/students", config),
        api.get("/api/gate-passes", config),
        api.get("/api/hostels", config),
        api.get("/api/college-movements/currently-out", config),
      ]);

      /* ==========================================
         STUDENTS
      ========================================== */

      const students =
        studentsResponse.data?.students ||
        studentsResponse.data?.data ||
        [];

      const totalStudents = Array.isArray(students)
        ? students.length
        : 0;

      /* ==========================================
         GATE PASSES
      ========================================== */

      const gatePasses =
        gatePassResponse.data?.gatePasses ||
        gatePassResponse.data?.data ||
        [];

      const pendingGatePasses = Array.isArray(gatePasses)
        ? gatePasses.filter(
            (pass) => pass.status === "PENDING"
          ).length
        : 0;

      /* ==========================================
         COLLEGE CURRENTLY OUT
      ========================================== */

      const collegeMovements =
        collegeOutResponse.data?.movements ||
        collegeOutResponse.data?.data ||
        [];

      const collegeOut = Array.isArray(collegeMovements)
        ? collegeMovements.length
        : 0;

      /* ==========================================
         HOSTELS
      ========================================== */

      const hostels =
        hostelResponse.data?.hostels ||
        hostelResponse.data?.data ||
        [];

      /* ==========================================
         TODAY'S ATTENDANCE
         Get roster for every hostel
      ========================================== */

      const today = new Date();

      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");

      const todayDate = `${year}-${month}-${day}`;

      let totalExpected = 0;
      let totalPresent = 0;

      if (Array.isArray(hostels) && hostels.length > 0) {
        const attendanceResponses = await Promise.all(
          hostels.map((hostel) =>
            api.get(
              `/api/attendance/roster?hostelId=${hostel._id}&date=${todayDate}`,
              config
            )
          )
        );

        attendanceResponses.forEach((response) => {
          const summary = response.data?.summary;

          if (!summary) {
            return;
          }

          totalExpected +=
            Number(summary.expectedAttendance) || 0;

          totalPresent +=
            Number(summary.present) || 0;
        });
      }

      /* ==========================================
         UPDATE DASHBOARD
      ========================================== */

      setStats({
        students: totalStudents,
        pendingGatePasses,
        present: totalPresent,
        expectedAttendance: totalExpected,
        collegeOut,
      });
    } catch (error) {
      console.error(
        "Warden dashboard data error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================
     LOGOUT
  ========================================== */

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/staff-login");
  };

  /* ==========================================
     NAVIGATION
  ========================================== */

  const menuItems = [
    {
      title: "Students",
      description:
        "View hostel students and their details",
      icon: "👨‍🎓",
      path: "/admin/students",
      active: true,
    },
    {
      title: "Gate Pass",
      description:
        "Manage student gate pass requests",
      icon: "🚪",
      path: "/warden/gate-pass",
      active: true,
    },
    {
      title: "Attendance",
      description:
        "Manage daily hostel attendance",
      icon: "📋",
      path: "/warden/attendance",
      active: true,
    },
    {
      title: "College Movement",
      description:
        "Monitor student college OUT and IN",
      icon: "🎓",
      path: "/admin/college-movement",
      active: true,
    },
    {
      title: "Visitors",
      description:
        "Manage hostel visitor records",
      icon: "👥",
      path: "#",
      active: false,
    },
    {
      title: "Complaints",
      description:
        "View and manage student complaints",
      icon: "🛠️",
      path: "#",
      active: false,
    },
    {
      title: "Reports",
      description:
        "View hostel and attendance reports",
      icon: "📊",
      path: "#",
      active: false,
    },
  ];

  const handleMenuClick = (item) => {
    if (item.active && item.path !== "#") {
      navigate(item.path);
    }
  };

  /* ==========================================
     ATTENDANCE DISPLAY
  ========================================== */

  const attendanceText = loading
    ? "..."
    : `${stats.present} / ${stats.expectedAttendance}`;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ==========================================
          HEADER
      ========================================== */}

      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              SBHMS
            </h1>

            <p className="text-sm font-medium text-blue-600">
              SARALA BIRLA HOSTEL
            </p>
          </div>

          <div className="flex items-center gap-4">

            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-900">
                {warden?.name || "Warden"}
              </p>

              <p className="text-xs text-slate-500">
                {warden?.staffId || "WARDEN"}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Logout
            </button>

          </div>
        </div>
      </header>

      {/* ==========================================
          MAIN
      ========================================== */}

      <main className="mx-auto max-w-7xl px-6 py-10">

        {/* ==========================================
            WELCOME
        ========================================== */}

        <section className="mb-10">

          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-600">
            WARDEN PORTAL
          </p>

          <h2 className="text-3xl font-bold text-slate-900">
            Warden Dashboard
          </h2>

          <p className="mt-2 max-w-2xl text-slate-600">
            Manage hostel students, attendance, gate passes
            and daily hostel operations from one place.
          </p>

        </section>

        {/* ==========================================
            ERROR
        ========================================== */}

        {error && (
          <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">
              {error}
            </p>

            <button
              onClick={loadWardenDashboard}
              className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ==========================================
            STATS
        ========================================== */}

        <section className="mb-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          {/* TOTAL STUDENTS */}

          <div className="rounded-2xl border bg-white p-6 shadow-sm">

            <div className="mb-5 flex items-center justify-between">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl">
                👨‍🎓
              </div>

              <span className="text-xs font-medium text-slate-400">
                HOSTEL
              </span>

            </div>

            <p className="text-sm text-slate-500">
              Total Students
            </p>

            <p className="mt-1 text-3xl font-bold text-slate-900">
              {loading ? "..." : stats.students}
            </p>

          </div>

          {/* PENDING GATE PASSES */}

          <div className="rounded-2xl border bg-white p-6 shadow-sm">

            <div className="mb-5 flex items-center justify-between">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-xl">
                🚪
              </div>

              <span className="text-xs font-medium text-slate-400">
                REQUESTS
              </span>

            </div>

            <p className="text-sm text-slate-500">
              Pending Gate Passes
            </p>

            <p className="mt-1 text-3xl font-bold text-slate-900">
              {loading ? "..." : stats.pendingGatePasses}
            </p>

          </div>

          {/* ATTENDANCE */}

          <div className="rounded-2xl border bg-white p-6 shadow-sm">

            <div className="mb-5 flex items-center justify-between">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-xl">
                📋
              </div>

              <span className="text-xs font-medium text-slate-400">
                TODAY
              </span>

            </div>

            <p className="text-sm text-slate-500">
              Attendance
            </p>

            <p className="mt-1 text-3xl font-bold text-slate-900">
              {attendanceText}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Present / Expected
            </p>

          </div>

          {/* COLLEGE */}

          <div className="rounded-2xl border bg-white p-6 shadow-sm">

            <div className="mb-5 flex items-center justify-between">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-xl">
                🎓
              </div>

              <span className="text-xs font-medium text-slate-400">
                COLLEGE
              </span>

            </div>

            <p className="text-sm text-slate-500">
              Currently at College
            </p>

            <p className="mt-1 text-3xl font-bold text-slate-900">
              {loading ? "..." : stats.collegeOut}
            </p>

          </div>

        </section>

        {/* ==========================================
            WARDEN OPERATIONS
        ========================================== */}

        <section>

          <div className="mb-5">

            <h3 className="text-xl font-bold text-slate-900">
              Warden Operations
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Select an operation to manage hostel activities.
            </p>

          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

            {menuItems.map((item) => (

              <button
                key={item.title}
                onClick={() => handleMenuClick(item)}
                disabled={!item.active}
                className={`group rounded-2xl border bg-white p-6 text-left shadow-sm transition ${
                  !item.active
                    ? "cursor-not-allowed opacity-60"
                    : "hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                }`}
              >

                <div className="mb-5 flex items-center justify-between">

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl">
                    {item.icon}
                  </div>

                  {item.active && (
                    <span className="text-lg text-slate-400 group-hover:text-blue-600">
                      →
                    </span>
                  )}

                </div>

                <h4 className="text-lg font-bold text-slate-900">
                  {item.title}
                </h4>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {item.description}
                </p>

                {!item.active && (
                  <p className="mt-4 text-xs font-medium text-slate-400">
                    Coming soon
                  </p>
                )}

              </button>

            ))}

          </div>

        </section>

        {/* ==========================================
            ACCESS STATUS
        ========================================== */}

        <section className="mt-10 rounded-2xl border bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h3 className="font-bold text-slate-900">
                Warden Access
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                You are logged in as a hostel warden.
              </p>

            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-medium text-green-700">

              <span className="h-2 w-2 rounded-full bg-green-500" />

              Account Active

            </div>

          </div>

        </section>

      </main>
    </div>
  );
}

export default WardenDashboard;