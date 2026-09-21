import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import hostelImage from "../../assets/hostel-building.jpg";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, email, phone, password, confirmPassword } = formData;

    if (!name || !email || !phone || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (phone.length !== 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await api.post("/api/auth/register", {
        name,
        email,
        phone,
        password,
      });

      console.log("Registration successful:", response.data);

      setSuccess(
        "Registration successful! Redirecting to login..."
      );

      setTimeout(() => {
        navigate("/");
      }, 1500);

    } catch (error) {
      console.error("Registration Error:", error);

      setError(
        error.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">

      <div className="w-full max-w-6xl bg-white rounded-3xl overflow-hidden shadow-2xl grid lg:grid-cols-[1.15fr_0.85fr]">

        {/* ========================================= */}
        {/* LEFT IMAGE SECTION */}
        {/* ========================================= */}

        <div className="relative hidden lg:block min-h-[680px] overflow-hidden">

          <img
            src={hostelImage}
            alt="Sarala Birla University Hostel"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Image Overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-[#071936]/95 via-[#0b2a55]/35 to-transparent" />

          {/* Logo */}
          <div className="absolute top-8 left-8 flex items-center gap-3">

            <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-blue-700 text-xl font-bold">
                S
              </span>
            </div>

            <div>
              <h1 className="text-white text-xl font-bold">
                SBHMS
              </h1>

              <p className="text-white/75 text-xs">
                Smart Birla Hostel Management
              </p>
            </div>

          </div>

          {/* Bottom Content */}
          <div className="absolute bottom-10 left-8 right-8 text-white">

            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-5">

              <span className="w-2 h-2 bg-green-400 rounded-full" />

              <span className="text-xs font-medium">
                Smart Hostel Management System
              </span>

            </div>

            <h2 className="text-4xl font-bold leading-tight">
              Your hostel,
              <br />
              <span className="text-blue-200">
                now connected.
              </span>
            </h2>

            <p className="mt-4 text-white/75 text-sm leading-relaxed max-w-lg">
              Create your SBHMS account and access a smarter
              way to manage your hostel activities and services.
            </p>

          </div>

        </div>

        {/* ========================================= */}
        {/* RIGHT REGISTER SECTION */}
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
                Smart Birla Hostel Management System
              </p>

            </div>

            {/* Heading */}
            <div className="mb-7">

              <p className="text-xs font-bold tracking-widest text-blue-600 uppercase">
                Get Started
              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                Create account
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Register your account to access SBHMS.
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

            {/* Success */}
            {success && (
              <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3">

                <p className="text-sm text-green-600">
                  {success}
                </p>

              </div>
            )}

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >

              {/* Name */}
              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Full Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />

              </div>

              {/* Email */}
              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email Address
                </label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  autoComplete="email"
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />

              </div>

              {/* Phone */}
              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Phone Number
                </label>

                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter 10-digit phone number"
                  maxLength={10}
                  autoComplete="tel"
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />

              </div>

              {/* Password */}
              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Password
                </label>

                <div className="relative">

                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Minimum 6 characters"
                    autoComplete="new-password"
                    className="w-full h-12 px-4 pr-16 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-blue-600"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>

                </div>

              </div>

              {/* Confirm Password */}
              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Confirm Password
                </label>

                <div className="relative">

                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    className="w-full h-12 px-4 pr-16 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-blue-600"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>

                </div>

              </div>

              {/* Register Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>

            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">

              <p className="text-sm text-slate-500">
                Already have an account?{" "}

                <Link
                  to="/"
                  className="font-semibold text-blue-600 hover:text-blue-700"
                >
                  Sign In
                </Link>

              </p>

            </div>

            {/* Footer */}
            <div className="mt-7 pt-5 border-t border-slate-100 text-center">

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

export default Register;