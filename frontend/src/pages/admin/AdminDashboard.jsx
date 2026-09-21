import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";

function AdminDashboard() {
  const navigate = useNavigate();

  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  const [stats, setStats] = useState({
    students: 0,
    hostels: 0,
    rooms: 0,
    staff: null,
  });

  const [loadingStats, setLoadingStats] = useState(true);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const sidebarWidth = sidebarExpanded ? "240px" : "72px";

  /* ================= FETCH DASHBOARD DATA ================= */

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoadingStats(true);

        const token = localStorage.getItem("token");

        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        const [studentsResponse, hostelsResponse, roomsResponse] =
          await Promise.all([
            api.get("/api/students", config),
            api.get("/api/hostels", config),
            api.get("/api/rooms", config),
          ]);

        const students =
          studentsResponse.data?.students ||
          studentsResponse.data?.data ||
          [];

        const hostels =
          hostelsResponse.data?.hostels ||
          hostelsResponse.data?.data ||
          [];

        const rooms =
          roomsResponse.data?.rooms ||
          roomsResponse.data?.data ||
          [];

        setStats({
          students: Array.isArray(students)
            ? students.length
            : 0,

          hostels: Array.isArray(hostels)
            ? hostels.length
            : 0,

          rooms: Array.isArray(rooms)
            ? rooms.length
            : 0,

          staff: null,
        });
      } catch (error) {
        console.error(
          "Admin dashboard data error:",
          error
        );
      } finally {
        setLoadingStats(false);
      }
    };

    fetchDashboardData();
  }, []);

  /* ================= LOGOUT ================= */

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  /* ================= SIDEBAR ================= */

  const menuItems = [
    {
      name: "Dashboard",
      icon: "▦",
      path: "/admin",
    },
    {
      name: "Students",
      icon: "👨‍🎓",
      path: "/admin/students",
    },
    {
      name: "Hostels & Rooms",
      icon: "🏢",
      path: "/admin/hostels",
    },
    {
      name: "Staff",
      icon: "👥",
      path: "/admin/staff",
    },
    {
      name: "Gate Pass",
      icon: "🎫",
      path: "/admin/gate-pass",
    },
    {
      name: "Attendance",
      icon: "✓",
      path: "/admin/attendance",
    },
    {
      name: "College Movement",
      icon: "🏫",
      path: "/admin/college-movement",
    },
    {
      name: "Reports",
      icon: "▤",
      path: "/admin/reports",
    },
  ];

  /* ================= OVERVIEW CARDS ================= */

  const overviewCards = [
    {
      title: "Total Students",
      value: stats.students,
      description: "Registered students",
      icon: "👨‍🎓",
      path: "/admin/students",
    },
    {
      title: "Hostels",
      value: stats.hostels,
      description: "Active hostels",
      icon: "🏢",
      path: "/admin/hostels",
    },
    {
      title: "Rooms",
      value: stats.rooms,
      description: "Registered rooms",
      icon: "🛏️",
      path: "/admin/hostels",
    },
    {
      title: "Staff Members",
      value: stats.staff ?? "—",
      description: "Staff management",
      icon: "👥",
      path: "/admin/staff",
    },
  ];

  /* ================= QUICK ACTIONS ================= */

  const quickActions = [
    {
      title: "Gate Pass Management",
      description:
        "Review and manage student gate pass applications.",
      icon: "🎫",
      path: "/admin/gate-pass",
    },
    {
      title: "Student Management",
      description:
        "Add, view and manage hostel students.",
      icon: "👨‍🎓",
      path: "/admin/students",
    },
    {
      title: "Attendance",
      description:
        "Monitor daily hostel attendance.",
      icon: "✓",
      path: "/admin/attendance",
    },
    {
      title: "College Movement",
      description:
        "Monitor students going to and returning from college.",
      icon: "🏫",
      path: "/admin/college-movement",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 overflow-x-hidden">

      {/* ================= SIDEBAR ================= */}

      <aside
        style={{ width: sidebarWidth }}
        className="
          fixed
          left-0
          top-0
          bottom-0
          z-50
          bg-slate-950
          text-white
          transition-all
          duration-300
          overflow-hidden
        "
      >

        {/* Sidebar Header */}

        <div
          className={`
            h-20
            border-b
            border-slate-800
            flex
            items-center
            ${
              sidebarExpanded
                ? "justify-between px-3"
                : "justify-center px-2"
            }
          `}
        >
          <div className="flex items-center min-w-0">

            <div
              className="
                w-10
                h-10
                shrink-0
                rounded-xl
                bg-blue-600
                flex
                items-center
                justify-center
                text-lg
                font-bold
              "
            >
              S
            </div>

            {sidebarExpanded && (
              <div className="ml-3 min-w-0">
                <h1 className="text-lg font-bold whitespace-nowrap">
                  SBHMS
                </h1>

                <p className="text-[11px] text-slate-400 whitespace-nowrap">
                  Smart Hostel Management
                </p>
              </div>
            )}

          </div>

          <button
            type="button"
            onClick={() =>
              setSidebarExpanded((value) => !value)
            }
            className="
              w-9
              h-9
              shrink-0
              rounded-lg
              flex
              items-center
              justify-center
              text-slate-300
              hover:bg-slate-800
              hover:text-white
              transition
            "
            title={
              sidebarExpanded
                ? "Collapse sidebar"
                : "Expand sidebar"
            }
          >
            ☰
          </button>
        </div>

        {/* Administration */}

        {sidebarExpanded && (
          <div className="px-5 pt-5 pb-3">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
              Administration
            </p>
          </div>
        )}

        {!sidebarExpanded && <div className="h-5" />}

        {/* Menu */}

        <nav className="px-2 space-y-1">
          {menuItems.map((item) => {

            const active =
              item.path === "/admin";

            return (
              <button
                key={item.name}
                type="button"
                onClick={() => navigate(item.path)}
                title={
                  !sidebarExpanded
                    ? item.name
                    : ""
                }
                className={`
                  w-full
                  h-11
                  rounded-lg
                  flex
                  items-center
                  transition
                  ${
                    sidebarExpanded
                      ? "gap-3 px-3"
                      : "justify-center"
                  }
                  ${
                    active
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }
                `}
              >

                <span className="w-6 shrink-0 text-center">
                  {item.icon}
                </span>

                {sidebarExpanded && (
                  <span className="text-sm font-medium whitespace-nowrap">
                    {item.name}
                  </span>
                )}

              </button>
            );
          })}
        </nav>

        {/* Logout */}

        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-800 p-2">

          <button
            type="button"
            onClick={handleLogout}
            title={
              !sidebarExpanded
                ? "Logout"
                : ""
            }
            className={`
              w-full
              h-11
              rounded-lg
              flex
              items-center
              text-red-300
              hover:bg-red-500/10
              transition
              ${
                sidebarExpanded
                  ? "gap-3 px-3"
                  : "justify-center"
              }
            `}
          >

            <span className="w-6 text-center shrink-0">
              ↪
            </span>

            {sidebarExpanded && (
              <span className="text-sm font-medium">
                Logout
              </span>
            )}

          </button>

        </div>

      </aside>

      {/* ================= MAIN AREA ================= */}

      <div
        style={{ marginLeft: sidebarWidth }}
        className="
          min-h-screen
          transition-all
          duration-300
          min-w-0
        "
      >

        {/* ================= TOP BAR ================= */}

        <header
          className="
            h-20
            bg-white
            border-b
            border-slate-200
            flex
            items-center
            justify-between
            px-5
            sm:px-7
          "
        >

          <div className="min-w-0">

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Dashboard
            </h2>

            <p className="text-xs sm:text-sm text-slate-500">
              Monitor SBHMS
            </p>

          </div>

          <div className="flex items-center gap-3 shrink-0">

            <div className="hidden sm:block text-right">

              <p className="text-sm font-semibold text-slate-800">
                {user.name || "SBHMS Administrator"}
              </p>

              <p className="text-xs text-slate-500">
                {user.role || "ADMIN"}
              </p>

            </div>

            <div
              className="
                w-10
                h-10
                rounded-full
                bg-blue-100
                text-blue-700
                flex
                items-center
                justify-center
                font-bold
              "
            >
              {(user.name || "A")
                .charAt(0)
                .toUpperCase()}
            </div>

          </div>

        </header>

        {/* ================= CONTENT ================= */}

        <main className="w-full p-5 sm:p-6 lg:p-7">

          {/* Welcome */}

          <section className="mb-7">

            <div
              className="
                rounded-2xl
                bg-gradient-to-r
                from-blue-700
                to-blue-600
                text-white
                px-6
                py-7
              "
            >

              <p className="text-sm font-medium text-blue-100 mb-2">
                Administrator Portal
              </p>

              <h1 className="text-2xl sm:text-3xl font-bold">
                Welcome back,{" "}
                {user.name || "SBHMS Administrator"} 👋
              </h1>

              <p className="mt-2 text-sm sm:text-base text-blue-100 max-w-3xl">
                Manage students, hostels, staff,
                attendance, gate passes, college
                movements and system reports from
                one place.
              </p>

            </div>

          </section>

          {/* Overview */}

          <section className="mb-7">

            <div className="mb-4">

              <h2 className="text-lg font-bold text-slate-900">
                Overview
              </h2>

              <p className="text-sm text-slate-500">
                Current hostel management summary
              </p>

            </div>

            <div
              className="
                grid
                grid-cols-1
                sm:grid-cols-2
                xl:grid-cols-4
                gap-4
              "
            >

              {overviewCards.map((card) => (

                <button
                  key={card.title}
                  type="button"
                  onClick={() => navigate(card.path)}
                  className="
                    text-left
                    bg-white
                    border
                    border-slate-200
                    rounded-2xl
                    p-5
                    shadow-sm
                    hover:shadow-md
                    hover:border-blue-300
                    transition
                  "
                >

                  <div className="flex items-start justify-between gap-3">

                    <div className="min-w-0">

                      <p className="text-sm text-slate-500">
                        {card.title}
                      </p>

                      <p className="text-3xl font-bold text-slate-900 mt-2">
                        {loadingStats ? "..." : card.value}
                      </p>

                      <p className="text-xs text-slate-400 mt-2">
                        {card.description}
                      </p>

                    </div>

                    <div
                      className="
                        w-11
                        h-11
                        shrink-0
                        rounded-xl
                        bg-blue-50
                        flex
                        items-center
                        justify-center
                        text-xl
                      "
                    >
                      {card.icon}
                    </div>

                  </div>

                </button>

              ))}

            </div>

          </section>

          {/* Quick Actions */}

          <section className="mb-7">

            <div className="mb-4">

              <h2 className="text-lg font-bold text-slate-900">
                Quick Actions
              </h2>

              <p className="text-sm text-slate-500">
                Frequently used management sections
              </p>

            </div>

            <div
              className="
                grid
                grid-cols-1
                lg:grid-cols-2
                gap-4
              "
            >

              {quickActions.map((item) => (

                <button
                  key={item.title}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className="
                    text-left
                    bg-white
                    border
                    border-slate-200
                    rounded-2xl
                    p-5
                    hover:border-blue-300
                    hover:shadow-md
                    transition
                  "
                >

                  <div className="flex items-start gap-4">

                    <div
                      className="
                        w-12
                        h-12
                        shrink-0
                        rounded-xl
                        bg-blue-50
                        flex
                        items-center
                        justify-center
                        text-xl
                      "
                    >
                      {item.icon}
                    </div>

                    <div className="min-w-0">

                      <h3 className="font-semibold text-slate-900">
                        {item.title}
                      </h3>

                      <p className="text-sm text-slate-500 mt-1">
                        {item.description}
                      </p>

                      <p className="text-sm font-medium text-blue-600 mt-3">
                        Open section →
                      </p>

                    </div>

                  </div>

                </button>

              ))}

            </div>

          </section>

          {/* System Status */}

          <section>

            <div
              className="
                bg-white
                border
                border-slate-200
                rounded-2xl
                p-5
                sm:p-6
              "
            >

              <div
                className="
                  flex
                  flex-col
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                  gap-4
                "
              >

                <div>

                  <h2 className="font-bold text-slate-900">
                    System Status
                  </h2>

                  <p className="text-sm text-slate-500 mt-1">
                    SBHMS services and authentication status
                  </p>

                </div>

                <div
                  className="
                    flex
                    items-center
                    gap-2
                    w-fit
                    rounded-full
                    bg-green-50
                    px-4
                    py-2
                    text-sm
                    font-medium
                    text-green-700
                  "
                >

                  <span className="w-2 h-2 rounded-full bg-green-500" />

                  System Online

                </div>

              </div>

              <div
                className="
                  grid
                  grid-cols-1
                  sm:grid-cols-3
                  gap-4
                  mt-6
                "
              >

                <div className="border border-slate-200 rounded-xl p-4">

                  <p className="text-xs text-slate-500">
                    Authentication
                  </p>

                  <p className="text-sm font-semibold text-green-600 mt-1">
                    Operational
                  </p>

                </div>

                <div className="border border-slate-200 rounded-xl p-4">

                  <p className="text-xs text-slate-500">
                    Database
                  </p>

                  <p className="text-sm font-semibold text-green-600 mt-1">
                    Connected
                  </p>

                </div>

                <div className="border border-slate-200 rounded-xl p-4">

                  <p className="text-xs text-slate-500">
                    API Server
                  </p>

                  <p className="text-sm font-semibold text-green-600 mt-1">
                    Running
                  </p>

                </div>

              </div>

            </div>

          </section>

        </main>

      </div>

    </div>
  );
}

export default AdminDashboard;