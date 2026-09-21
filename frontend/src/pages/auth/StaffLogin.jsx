import hostelImage from "../../assets/hostel-building.jpg";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function StaffLogin() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    staffId: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/api/auth/staff-login", formData);

      if (response.data.success) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        const role = response.data.user.role;

        if (role === "ADMIN") {
          navigate("/admin");
        } else if (role === "WARDEN") {
          navigate("/warden");
        } else if (role === "GUARD") {
          navigate("/guard");
        } else if (role === "MAINTENANCE") {
          navigate("/maintenance");
        } else {
          setError("Invalid staff role.");
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your Staff ID and password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden grid md:grid-cols-2">
        
        {/* Left Side */}
        <div className="hidden md:block relative min-h-[600px]">
          <img
            src="/src/assets/hostel-building.jpg"
            alt="Sarala Birla University Hostel"
            className="absolute inset-0 w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-blue-950/75" />

          <div className="relative z-10 h-full flex flex-col justify-center px-10 text-white">
            <p className="text-blue-200 font-medium mb-3">
              SBHMS
            </p>

            <h1 className="text-4xl font-bold leading-tight">
              Staff & Admin
              <br />
              Portal
            </h1>

            <p className="mt-5 text-blue-100 leading-relaxed">
              Secure access for administrators, wardens, guards,
              and maintenance staff.
            </p>

            <div className="mt-8 space-y-3 text-sm text-blue-100">
              <p>✓ Hostel Management</p>
              <p>✓ Student Management</p>
              <p>✓ Gate Pass Management</p>
              <p>✓ Attendance & Reports</p>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="p-8 sm:p-10 md:p-12 flex flex-col justify-center">
          <div className="mb-8">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium mb-6"
            >
              ← Back to Login Selection
            </button>

            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-4">
              Staff Portal
            </div>

            <h2 className="text-3xl font-bold text-slate-900">
              Welcome Back
            </h2>

            <p className="mt-2 text-slate-500">
              Sign in using your Staff ID.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Staff ID */}
            <div>
              <label
                htmlFor="staffId"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Staff ID
              </label>

              <input
                id="staffId"
                type="text"
                name="staffId"
                value={formData.staffId}
                onChange={handleChange}
                placeholder="Enter your Staff ID"
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-500">
              Smart Birla Hostel Management System
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Authorized staff access only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StaffLogin;