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

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.staffId || !formData.password) {
      setError("Please enter your Staff ID and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.post(
        "/api/auth/staff-login",
        formData
      );

      if (response.data.success) {
        // IMPORTANT:
        // sessionStorage keeps this login separate for each browser tab.
        sessionStorage.setItem("token", response.data.token);

        sessionStorage.setItem(
          "user",
          JSON.stringify(response.data.user)
        );

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
      console.error("Staff login error:", err);

      setError(
        err.response?.data?.message ||
          "Login failed. Please check your Staff ID and password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl md:grid-cols-2">

          {/* Left Side - Image */}
          <div className="hidden md:block">
            <img
              src={hostelImage}
              alt="Sarala Birla University Hostel"
              className="h-full w-full object-cover"
            />
          </div>

          {/* Right Side - Login */}
          <div className="flex items-center justify-center p-8 sm:p-10">
            <div className="w-full max-w-md">

              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                  Staff Login
                </h1>

                <p className="mt-2 text-gray-600">
                  Login to access the SBHMS staff dashboard.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                {/* Staff ID */}
                <div>
                  <label
                    htmlFor="staffId"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Staff ID
                  </label>

                  <input
                    id="staffId"
                    name="staffId"
                    type="text"
                    value={formData.staffId}
                    onChange={handleChange}
                    placeholder="Enter your Staff ID"
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
                    placeholder="Enter your password"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Logging in..."
                    : "Login"}
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
      </div>
    </div>
  );
}

export default StaffLogin;