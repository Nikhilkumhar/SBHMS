import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function AdminLogin() {
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

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.staffId || !formData.password) {
      setError("Please enter your Admin ID and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.post(
        "/api/auth/admin-login",
        {
          staffId: formData.staffId,
          password: formData.password,
        }
      );

      if (response.data.success) {
        // IMPORTANT:
        // sessionStorage keeps this login separate for each browser tab.
        sessionStorage.setItem(
          "token",
          response.data.token
        );

        sessionStorage.setItem(
          "user",
          JSON.stringify(response.data.user)
        );

        navigate("/admin");
      }
    } catch (error) {
      console.error("Admin login error:", error);

      setError(
        error.response?.data?.message ||
          "Admin login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl sm:p-10">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Login
            </h1>

            <p className="mt-2 text-gray-600">
              Login to manage the Smart Birla Hostel Management System.
            </p>
          </div>

          {/* Login Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* Admin ID */}
            <div>
              <label
                htmlFor="staffId"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Admin ID
              </label>

              <input
                id="staffId"
                name="staffId"
                type="text"
                value={formData.staffId}
                onChange={handleChange}
                placeholder="Enter Admin ID"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Login */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* Back */}
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-6 w-full text-center text-sm text-gray-500 hover:text-blue-600"
          >
            ← Back to Login Options
          </button>

        </div>
      </div>
    </div>
  );
}

export default AdminLogin;