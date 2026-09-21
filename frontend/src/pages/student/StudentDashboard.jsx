import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function StudentDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      navigate("/");
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);

      if (parsedUser.role !== "STUDENT") {
        navigate("/");
        return;
      }

      setUser(parsedUser);
    } catch (error) {
      console.error("Invalid user data:", error);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      navigate("/");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
      {/* ================= NAVBAR ================= */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-600/20">
              <span className="text-white text-xl font-bold">
                S
              </span>
            </div>

            <div>
              <h1 className="text-lg font-bold text-slate-900">
                SBHMS
              </h1>

              <p className="text-[10px] text-blue-600 font-semibold tracking-wide">
                SARALA BIRLA HOSTEL
              </p>
            </div>
          </div>

          {/* User + Logout */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3">

              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-sm font-semibold text-blue-700">
                  {user.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold text-slate-800">
                  {user.name}
                </p>

                <p className="text-xs text-blue-600 font-medium">
                  Student
                </p>
              </div>

            </div>

            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg border border-red-200 bg-red-50 text-sm font-semibold text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* ================= MAIN ================= */}
      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-10">

        {/* ================= WELCOME ================= */}
        <section className="mb-10">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                Student Portal
              </div>

              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
                Welcome, {user.name}
              </h2>

              <p className="mt-2 text-slate-500">
                Manage your hostel activities from one place.
              </p>
            </div>

            {/* Active Status */}
            <div className="inline-flex items-center gap-2 self-start lg:self-auto px-4 py-2 rounded-xl bg-white border border-green-200 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-green-500" />

              <span className="text-sm font-medium text-green-700">
                Account Active
              </span>
            </div>

          </div>
        </section>

        {/* ================= STUDENT INFORMATION ================= */}
        <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-7 mb-10 shadow-xl shadow-blue-600/15">

          {/* Decorative shapes */}
          <div className="absolute -right-12 -top-16 w-48 h-48 rounded-full bg-white/10" />
          <div className="absolute right-24 -bottom-20 w-40 h-40 rounded-full bg-white/5" />

          <div className="relative">

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-7">

              {/* Student */}
              <div className="flex items-center gap-4">

                <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {user.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-blue-100">
                    Student Information
                  </p>

                  <h3 className="mt-1 text-xl font-semibold text-white">
                    {user.name}
                  </h3>
                </div>

              </div>

              {/* Information */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-10 gap-y-5">

                <div>
                  <p className="text-xs text-blue-100">
                    SBU ID
                  </p>

                  <p className="mt-1 text-sm font-semibold text-white">
                    {user.sbuId || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-blue-100">
                    Role
                  </p>

                  <p className="mt-1 text-sm font-semibold text-white">
                    Student
                  </p>
                </div>

                <div>
                  <p className="text-xs text-blue-100">
                    Account
                  </p>

                  <p className="mt-1 text-sm font-semibold text-green-200">
                    Active
                  </p>
                </div>

              </div>

            </div>

          </div>
        </section>

        {/* ================= QUICK ACCESS ================= */}
        <section className="mb-10">

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">

            <div>
              <p className="text-sm font-semibold text-blue-600">
                Quick Access
              </p>

              <h3 className="mt-1 text-2xl font-bold text-slate-900">
                Hostel Services
              </h3>
            </div>

            <p className="text-sm text-slate-500">
              Access your daily hostel services
            </p>

          </div>

          {/* Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">

            {/* My Profile */}
            <DashboardCard
              icon="P"
              iconStyle="bg-blue-100 text-blue-700"
              title="My Profile"
              description="View your personal and hostel information."
              onClick={() => navigate("/student/profile")}
            />

            {/* Gate Pass */}
            <DashboardCard
              icon="G"
              iconStyle="bg-orange-100 text-orange-600"
              title="Gate Pass"
              description="Apply for and manage your gate passes."
              onClick={() => navigate("/student/gate-pass")}
            />

            {/* College QR */}
            <DashboardCard
              icon="Q"
              iconStyle="bg-indigo-100 text-indigo-600"
              title="College QR"
              description="Show your daily QR code at the college gate."
              onClick={() => navigate("/student/qr")}
            />

            {/* College Movement */}
            <DashboardCard
              icon="C"
              iconStyle="bg-cyan-100 text-cyan-700"
              title="College Movement"
              description="View your college entry and exit records."
              onClick={() => navigate("/student/college-movement")}
            />

            {/* Attendance */}
            <DashboardCard
              icon="A"
              iconStyle="bg-green-100 text-green-700"
              title="Attendance"
              description="View your hostel attendance records."
              onClick={() => navigate("/student/attendance")}
            />

            {/* Notifications */}
            <DashboardCard
              icon="N"
              iconStyle="bg-purple-100 text-purple-700"
              title="Notifications"
              description="View important hostel announcements."
              onClick={() => navigate("/student/notifications")}
            />

          </div>

        </section>

        {/* ================= TODAY'S STATUS ================= */}
        <section className="mb-10">

          <div className="mb-6">
            <p className="text-sm font-semibold text-blue-600">
              Today
            </p>

            <h3 className="mt-1 text-2xl font-bold text-slate-900">
              Your Status
            </h3>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">

            <StatusCard
              title="Hostel Attendance"
              value="Not Marked"
              description="Today's attendance status"
              icon="A"
              iconStyle="bg-amber-100 text-amber-700"
            />

            <StatusCard
              title="College Movement"
              value="In Hostel"
              description="Current college movement"
              icon="C"
              iconStyle="bg-green-100 text-green-700"
            />

            <StatusCard
              title="Gate Pass"
              value="No Active Pass"
              description="Current gate pass status"
              icon="G"
              iconStyle="bg-blue-100 text-blue-700"
            />

          </div>

        </section>

        {/* ================= SECURITY ================= */}
        <section className="bg-white border border-blue-100 rounded-2xl p-6 shadow-sm">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">

            <div className="flex items-center gap-4">

              <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center">
                <span className="text-green-600 font-bold text-lg">
                  ✓
                </span>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Secure Account
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Your SBHMS account is protected by secure authentication.
                </p>
              </div>

            </div>

            <span className="inline-flex items-center gap-2 text-sm font-semibold text-green-600">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Active
            </span>

          </div>

        </section>

      </main>
    </div>
  );
}

/* ================= DASHBOARD CARD ================= */

function DashboardCard({
  icon,
  iconStyle,
  title,
  description,
  onClick,
}) {
  return (
    <div className="group bg-white border border-slate-200 rounded-2xl p-6 hover:border-blue-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">

      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold ${iconStyle}`}
      >
        {icon}
      </div>

      <h3 className="mt-5 text-lg font-semibold text-slate-900">
        {title}
      </h3>

      <p className="mt-2 text-sm text-slate-500 leading-6">
        {description}
      </p>

      <button
        type="button"
        onClick={onClick}
        className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 group-hover:text-blue-700 transition"
      >
        Open

        <span className="group-hover:translate-x-1 transition-transform">
          →
        </span>
      </button>

    </div>
  );
}

/* ================= STATUS CARD ================= */

function StatusCard({
  title,
  value,
  description,
  icon,
  iconStyle,
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition">

      <div className="flex items-start justify-between gap-4">

        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h4 className="mt-2 text-xl font-bold text-slate-900">
            {value}
          </h4>

          <p className="mt-1 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${iconStyle}`}
        >
          {icon}
        </div>

      </div>

    </div>
  );
}

export default StudentDashboard;