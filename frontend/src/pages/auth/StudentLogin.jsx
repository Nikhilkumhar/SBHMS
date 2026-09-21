import { useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";
import hostelImage from "../../assets/hostel-building.jpg";

function StudentLogin() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    sbuId: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // HANDLE INPUT CHANGE
  // ==========================================
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setError("");
  };

  // ==========================================
  // HANDLE LOGIN
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.sbuId || !formData.password) {
      setError("Please enter your SBU ID and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.post(
        "/api/auth/student-login",
        formData
      );

      console.log("Student login successful:", response.data);

      // Save token
      localStorage.setItem("token", response.data.token);

      // Save user information
      localStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
      );

      // Go to student dashboard
      navigate("/student");
    } catch (error) {
      console.error("========== STUDENT LOGIN ERROR ==========");
      console.error("Message:", error.message);
      console.error("Status:", error.response?.status);
      console.error("Response:", error.response?.data);
      console.error("==========================================");

      setError(
        error.response?.data?.message ||
          "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">

      {/* Main Card */}
      <div className="w-full max-w-6xl min-h-[680px] bg-white rounded-3xl overflow-hidden shadow-2xl grid lg:grid-cols-[1.15fr_0.85fr]">

        {/* ========================================= */}
        {/* LEFT SIDE - HOSTEL IMAGE */}
        {/* ========================================= */}

        <div className="relative hidden lg:block overflow-hidden">

          <img
            src={hostelImage}
            alt="Sarala Birla University Hostel"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#071936]/95 via-[#0b2a55]/40 to-[#071936]/20" />

          {/* Logo */}
          <div className="absolute top-8 left-8 flex items-center gap-3">

            <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-blue-700 text-xl font-bold">
                S
              </span>
            </div>

            <div>
              <h1 className="text-white text-xl font-bold tracking-wide">
                SBHMS
              </h1>

              <p className="text-white/75 text-xs">
                Sarala Birla Hostel Management
              </p>
            </div>

          </div>

          {/* Bottom Content */}
          <div className="absolute bottom-10 left-8 right-8 text-white">

            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-5">

              <span className="w-2 h-2 bg-green-400 rounded-full" />

              <span className="text-xs font-medium">
                Student Portal
              </span>

            </div>

            <h2 className="text-4xl font-bold leading-tight max-w-xl">
              Welcome to
              <br />

              <span className="text-blue-200">
                Sarala Birla Hostel
              </span>
            </h2>

            <p className="mt-4 text-white/75 text-sm leading-relaxed max-w-lg">
              Access your hostel profile, gate passes,
              attendance and daily college movement records
              from one secure platform.
            </p>

            <div className="mt-6 flex items-center gap-5 text-xs text-white/70 flex-wrap">

              <span>Gate Pass</span>

              <span className="w-1 h-1 bg-white/50 rounded-full" />

              <span>Attendance</span>

              <span className="w-1 h-1 bg-white/50 rounded-full" />

              <span>College Movement</span>

            </div>

          </div>

        </div>

        {/* ========================================= */}
        {/* RIGHT SIDE - LOGIN */}
        {/* ========================================= */}

        <div className="flex items-center justify-center p-8 sm:p-12 lg:p-14">

          <div className="w-full max-w-sm">

            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">

              <div className="inline-flex w-14 h-14 bg-blue-600 rounded-2xl items-center justify-center shadow-lg">

                <span className="text-white text-2xl font-bold">
                  S
                </span>

              </div>

              <h1 className="mt-3 text-2xl font-bold text-slate-900">
                SBHMS
              </h1>

              <p className="text-xs text-slate-500 mt-1">
                Sarala Birla Hostel Management System
              </p>

            </div>

            {/* Heading */}
            <div className="mb-8">

              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 mb-5"
              >
                ← Back to login options
              </button>

              <p className="text-xs font-bold tracking-widest text-blue-600 uppercase">
                Student Portal
              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                Student Sign In
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Enter your SBU ID and password to continue.
              </p>

            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm text-red-600">
                  {error}
                </p>
              </div>
            )}

            {/* Login Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-0"
            >

              {/* SBU ID */}
              <div>

                <label
                  htmlFor="sbuId"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  SBU ID
                </label>

                <input
                  id="sbuId"
                  type="text"
                  name="sbuId"
                  value={formData.sbuId}
                  onChange={handleChange}
                  placeholder="Enter your SBU ID"
                  autoComplete="username"
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />

              </div>

              {/* Password */}
              <div className="mt-5">

                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Password
                </label>

                <div className="relative">

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full h-12 px-4 pr-16 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-blue-600 transition"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>

                </div>

              </div>

              {/* Sign In */}
              <div className="mt-6">

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>

              </div>

            </form>

            {/* Security Notice */}
            <div className="mt-8 p-4 rounded-xl bg-slate-50 border border-slate-100">

              <div className="flex items-start gap-3">

                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 text-sm">
                    ✓
                  </span>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-700">
                    Secure Student Access
                  </p>

                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Your SBU ID provides secure access to
                    your personal hostel information.
                  </p>
                </div>

              </div>

            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">

              <p className="text-xs text-slate-400">
                Secure access to SBHMS
              </p>

              <p className="text-xs text-slate-400 mt-1">
                Sarala Birla University
              </p>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default StudentLogin;