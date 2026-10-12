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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setError("");
  };

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

      if (response.data.success) {
        // IMPORTANT:
        // sessionStorage keeps this login separate for each browser tab.
        sessionStorage.setItem("token", response.data.token);

        sessionStorage.setItem(
          "user",
          JSON.stringify(response.data.user)
        );

        navigate("/student");
      }
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
                  Student Login
                </h1>

                <p className="mt-2 text-gray-600">
                  Login to access your SBHMS student dashboard.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                {/* SBU ID */}
                <div>
                  <label
                    htmlFor="sbuId"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    SBU ID
                  </label>

                  <input
                    id="sbuId"
                    name="sbuId"
                    type="text"
                    value={formData.sbuId}
                    onChange={handleChange}
                    placeholder="Enter your SBU ID"
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

                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-20 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(!showPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      {showPassword
                        ? "Hide"
                        : "Show"}
                    </button>
                  </div>
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

export default StudentLogin;