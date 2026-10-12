import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function StudentProfile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = sessionStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/api/students/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("Profile loaded:", response.data);

        setProfile(response.data.student);
      } catch (error) {
        console.error("Profile error:", error);

        if (error.response?.status === 401) {
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("user");

          navigate("/login");
          return;
        }

        setError(
          error.response?.data?.message ||
            "Unable to load your profile."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />

          <p className="mt-4 text-sm text-slate-500">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-red-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-12 h-12 mx-auto rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-red-600 text-xl font-bold">
              !
            </span>
          </div>

          <h2 className="mt-4 text-xl font-bold text-slate-900">
            Unable to Load Profile
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {error}
          </p>

          <button
            onClick={() => navigate("/student")}
            className="mt-6 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
      {/* ================= NAVBAR ================= */}

      <nav className="bg-white/95 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
          <button
            onClick={() => navigate("/student")}
            className="flex items-center gap-3"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-600/20">
              <span className="text-white text-xl font-bold">
                S
              </span>
            </div>

            <div className="text-left">
              <h1 className="text-lg font-bold text-slate-900">
                SBHMS
              </h1>

              <p className="text-[10px] text-blue-600 font-semibold tracking-wide">
                SARALA BIRLA HOSTEL
              </p>
            </div>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/student")}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 transition"
            >
              ← Dashboard
            </button>

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

      <main className="max-w-5xl mx-auto px-6 lg:px-10 py-10">
        {/* Header */}

        <section className="mb-8">
          <p className="text-sm font-semibold text-blue-600">
            Student Portal
          </p>

          <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            My Profile
          </h2>

          <p className="mt-2 text-slate-500">
            View your personal and hostel information.
          </p>
        </section>

        {/* Profile Header */}

        <section className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-7 shadow-xl shadow-blue-600/15 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
              <span className="text-3xl font-bold text-white">
                {profile?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>

            <div>
              <p className="text-sm text-blue-100">
                Student Account
              </p>

              <h3 className="mt-1 text-2xl font-bold text-white">
                {profile?.name}
              </h3>

              <div className="flex flex-wrap items-center gap-3 mt-3">
                <span className="px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-semibold text-white">
                  {profile?.sbuId}
                </span>

                <span className="px-3 py-1 rounded-full bg-green-500/20 border border-green-300/20 text-xs font-semibold text-green-100">
                  {profile?.isActive
                    ? "Active Account"
                    : "Inactive Account"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Personal Information */}

        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">
              Personal Information
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Your basic personal and academic details.
            </p>
          </div>

          <div className="p-6 grid sm:grid-cols-2 gap-x-8 gap-y-6">
            <InfoItem
              label="Full Name"
              value={profile?.name}
            />

            <InfoItem
              label="SBU ID"
              value={profile?.sbuId}
            />

            <InfoItem
              label="Email"
              value={profile?.email}
            />

            <InfoItem
              label="Phone"
              value={profile?.phone}
            />

            <InfoItem
              label="Course"
              value={profile?.course}
            />

            <InfoItem
              label="Year"
              value={
                profile?.year
                  ? `Year ${profile.year}`
                  : "—"
              }
            />

            <InfoItem
              label="Role"
              value={profile?.role}
            />

            <InfoItem
              label="Account Status"
              value={
                profile?.isActive
                  ? "Active"
                  : "Inactive"
              }
              valueClass={
                profile?.isActive
                  ? "text-green-600"
                  : "text-red-600"
              }
            />
          </div>
        </section>

        {/* Hostel Information */}

        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">
              Hostel Information
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Your current hostel and room details.
            </p>
          </div>

          <div className="p-6 grid sm:grid-cols-3 gap-6">
            <InfoItem
              label="Hostel"
              value={profile?.hostel?.name}
            />

            <InfoItem
              label="Hostel Code"
              value={profile?.hostel?.code}
            />

            <InfoItem
              label="Room Number"
              value={profile?.room?.roomNumber}
            />

            <InfoItem
              label="Floor"
              value={
                profile?.room?.floor !== undefined
                  ? `Floor ${profile.room.floor}`
                  : "—"
              }
            />

            <InfoItem
              label="Room Capacity"
              value={
                profile?.room?.capacity
                  ? `${profile.room.capacity} Students`
                  : "—"
              }
            />
          </div>
        </section>

        {/* Parent Information */}

        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">
              Parent / Guardian Information
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Parent details registered with the hostel.
            </p>
          </div>

          <div className="p-6 grid sm:grid-cols-2 gap-6">
            <InfoItem
              label="Father's Name"
              value={profile?.fatherName}
            />

            <InfoItem
              label="Father's Mobile"
              value={profile?.fatherMobile}
            />
          </div>
        </section>

        {/* Bottom Action */}

        <div className="flex justify-center">
          <button
            onClick={() => navigate("/student")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-md shadow-blue-600/20 transition"
          >
            ← Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}

function InfoItem({
  label,
  value,
  valueClass = "text-slate-900",
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p
        className={`mt-2 text-sm font-semibold break-words ${valueClass}`}
      >
        {value || "—"}
      </p>
    </div>
  );
}

export default StudentProfile;