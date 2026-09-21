import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import api from "../../services/api";

function StudentGatePass() {
  const navigate = useNavigate();

  const [gatePasses, setGatePasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    passType: "MARKET",
    purpose: "",
    outDate: "",
    outTime: "",
    expectedInDate: "",
    expectedInTime: "",
  });

  const fetchGatePasses = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.get("/api/gate-passes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setGatePasses(response.data.gatePasses || []);
    } catch (error) {
      console.error("Gate pass error:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      setError(
        error.response?.data?.message ||
          "Unable to load your gate passes."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGatePasses();
  }, [navigate]);

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

    setError("");
    setSuccess("");

    if (
      !formData.passType ||
      !formData.purpose ||
      !formData.outDate ||
      !formData.outTime ||
      !formData.expectedInDate ||
      !formData.expectedInTime
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (formData.expectedInDate < formData.outDate) {
      setError(
        "Expected return date cannot be before the out date."
      );
      return;
    }

    if (
      formData.expectedInDate === formData.outDate &&
      formData.expectedInTime <= formData.outTime
    ) {
      setError(
        "Expected return time must be after the out time."
      );
      return;
    }

    try {
      setSubmitting(true);

      const token = localStorage.getItem("token");

      const response = await api.post(
        "/api/gate-passes",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Gate pass created:", response.data);

      setSuccess(
        "Gate pass application submitted successfully."
      );

      setFormData({
        passType: "MARKET",
        purpose: "",
        outDate: "",
        outTime: "",
        expectedInDate: "",
        expectedInTime: "",
      });

      setShowForm(false);

      await fetchGatePasses();
    } catch (error) {
      console.error("Create gate pass error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to submit gate pass application."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-50 text-amber-700 border-amber-200";

      case "APPROVED":
        return "bg-blue-50 text-blue-700 border-blue-200";

      case "OUT":
        return "bg-orange-50 text-orange-700 border-orange-200";

      case "RETURNED":
        return "bg-green-50 text-green-700 border-green-200";

      case "REJECTED":
        return "bg-red-50 text-red-700 border-red-200";

      case "EXPIRED":
      case "CANCELLED":
        return "bg-slate-100 text-slate-600 border-slate-200";

      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />

          <p className="mt-4 text-sm text-slate-500">
            Loading your gate passes...
          </p>
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
            type="button"
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
              type="button"
              onClick={() => navigate("/student")}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 transition"
            >
              ← Dashboard
            </button>

            <button
              type="button"
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

        {/* ================= HEADER ================= */}

        <section className="mb-8">

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">

            <div>
              <p className="text-sm font-semibold text-blue-600">
                Student Portal
              </p>

              <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                Gate Pass
              </h2>

              <p className="mt-2 text-slate-500">
                View and manage your hostel gate passes.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowForm(true);
                setError("");
                setSuccess("");
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-md shadow-blue-600/20 transition"
            >
              <span className="text-lg leading-none">
                +
              </span>

              Apply for Gate Pass
            </button>

          </div>
        </section>

        {/* ================= MESSAGES ================= */}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
            <p className="text-sm font-medium text-red-700">
              {error}
            </p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl px-5 py-4">
            <p className="text-sm font-medium text-green-700">
              {success}
            </p>
          </div>
        )}

        {/* ================= APPLICATION FORM ================= */}

        {showForm && (
          <section className="bg-white border border-blue-100 rounded-2xl shadow-sm mb-8 overflow-hidden">

            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">

              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Apply for Gate Pass
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Submit your request for warden approval.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition"
              >
                ✕
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6"
            >

              {/* Pass Type */}

              <div className="mb-7">

                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Pass Type
                </label>

                <div className="grid sm:grid-cols-2 gap-4">

                  {/* Market */}

                  <label
                    className={`cursor-pointer border rounded-xl p-4 transition ${
                      formData.passType === "MARKET"
                        ? "border-orange-400 bg-orange-50"
                        : "border-slate-200 bg-white hover:border-orange-200"
                    }`}
                  >

                    <input
                      type="radio"
                      name="passType"
                      value="MARKET"
                      checked={formData.passType === "MARKET"}
                      onChange={handleChange}
                      className="sr-only"
                    />

                    <div className="flex items-center gap-3">

                      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                        <span className="font-bold text-orange-600">
                          M
                        </span>
                      </div>

                      <div>
                        <p className="font-semibold text-slate-900">
                          Market
                        </p>

                        <p className="text-xs text-slate-500">
                          Short outside visit
                        </p>
                      </div>

                    </div>
                  </label>

                  {/* Home */}

                  <label
                    className={`cursor-pointer border rounded-xl p-4 transition ${
                      formData.passType === "HOME"
                        ? "border-indigo-400 bg-indigo-50"
                        : "border-slate-200 bg-white hover:border-indigo-200"
                    }`}
                  >

                    <input
                      type="radio"
                      name="passType"
                      value="HOME"
                      checked={formData.passType === "HOME"}
                      onChange={handleChange}
                      className="sr-only"
                    />

                    <div className="flex items-center gap-3">

                      <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <span className="font-bold text-indigo-600">
                          H
                        </span>
                      </div>

                      <div>
                        <p className="font-semibold text-slate-900">
                          Home
                        </p>

                        <p className="text-xs text-slate-500">
                          Going home
                        </p>
                      </div>

                    </div>
                  </label>

                </div>
              </div>

              {/* Purpose */}

              <div className="mb-6">

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Purpose
                </label>

                <textarea
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Enter the reason for going outside..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
                />

              </div>

              {/* Dates and Times */}

              <div className="grid md:grid-cols-2 gap-6 mb-7">

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Out Date
                  </label>

                  <input
                    type="date"
                    name="outDate"
                    value={formData.outDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Out Time
                  </label>

                  <input
                    type="time"
                    name="outTime"
                    value={formData.outTime}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Expected Return Date
                  </label>

                  <input
                    type="date"
                    name="expectedInDate"
                    value={formData.expectedInDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Expected Return Time
                  </label>

                  <input
                    type="time"
                    name="expectedInTime"
                    value={formData.expectedInTime}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

              </div>

              {/* Notice */}

              <div className="mb-6 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">

                <p className="text-xs leading-5 text-blue-700">
                  Your application will remain{" "}
                  <strong>PENDING</strong> until the warden
                  verifies parent permission and approves the
                  gate pass.
                </p>

              </div>

              {/* Buttons */}

              <div className="flex flex-col sm:flex-row justify-end gap-3">

                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {submitting
                    ? "Submitting..."
                    : "Submit Application"}
                </button>

              </div>

            </form>
          </section>
        )}

        {/* ================= SUMMARY ================= */}

        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

          <SummaryCard
            title="Total Passes"
            value={gatePasses.length}
            icon="G"
            iconStyle="bg-blue-100 text-blue-700"
          />

          <SummaryCard
            title="Pending"
            value={
              gatePasses.filter(
                (pass) => pass.status === "PENDING"
              ).length
            }
            icon="P"
            iconStyle="bg-amber-100 text-amber-700"
          />

          <SummaryCard
            title="Approved"
            value={
              gatePasses.filter(
                (pass) => pass.status === "APPROVED"
              ).length
            }
            icon="✓"
            iconStyle="bg-green-100 text-green-700"
          />

          <SummaryCard
            title="Currently Outside"
            value={
              gatePasses.filter(
                (pass) => pass.status === "OUT"
              ).length
            }
            icon="→"
            iconStyle="bg-orange-100 text-orange-700"
          />

        </section>

        {/* ================= GATE PASS LIST ================= */}

        <section>

          <div className="mb-5">

            <h3 className="text-xl font-bold text-slate-900">
              My Gate Passes
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Your recent gate pass applications.
            </p>

          </div>

          {gatePasses.length === 0 ? (

            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">

              <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-100 flex items-center justify-center">
                <span className="text-xl font-bold text-blue-600">
                  G
                </span>
              </div>

              <h3 className="mt-5 text-lg font-bold text-slate-900">
                No Gate Passes
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                You have not applied for any gate pass yet.
              </p>

              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="mt-6 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
              >
                Apply for Gate Pass
              </button>

            </div>

          ) : (

            <div className="space-y-4">

              {gatePasses.map((pass) => (
                <GatePassCard
                  key={pass._id || pass.id}
                  pass={pass}
                  getStatusStyle={getStatusStyle}
                  formatDate={formatDate}
                />
              ))}

            </div>

          )}

        </section>
      </main>
    </div>
  );
}

/* =====================================================
   SUMMARY CARD
===================================================== */

function SummaryCard({
  title,
  value,
  icon,
  iconStyle,
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {value}
          </p>

        </div>

        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold ${iconStyle}`}
        >
          {icon}
        </div>

      </div>

    </div>
  );
}

/* =====================================================
   GATE PASS CARD
===================================================== */

function GatePassCard({
  pass,
  getStatusStyle,
  formatDate,
}) {
  const showQRCode =
    Boolean(pass.qrToken) &&
    (pass.status === "APPROVED" || pass.status === "OUT");

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition">

      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-8">

        {/* ================= PASS INFORMATION ================= */}

        <div className="flex-1">

          <div className="flex items-start gap-4">

            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${
                pass.passType === "HOME"
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-orange-100 text-orange-700"
              }`}
            >
              {pass.passType === "HOME" ? "H" : "M"}
            </div>

            <div>

              <div className="flex flex-wrap items-center gap-2">

                <h4 className="text-lg font-bold text-slate-900">
                  {pass.passType === "HOME"
                    ? "Home Pass"
                    : "Market Pass"}
                </h4>

                <span
                  className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${getStatusStyle(
                    pass.status
                  )}`}
                >
                  {pass.status}
                </span>

              </div>

              <p className="mt-2 text-sm text-slate-600">
                {pass.purpose || "No purpose provided"}
              </p>

            </div>

          </div>

          {/* Details */}

          <div className="grid sm:grid-cols-2 gap-x-10 gap-y-4 mt-6">

            <Detail
              label="Out Date"
              value={formatDate(pass.outDate)}
            />

            <Detail
              label="Out Time"
              value={pass.outTime}
            />

            <Detail
              label="Expected Return"
              value={formatDate(pass.expectedInDate)}
            />

            <Detail
              label="Return Time"
              value={pass.expectedInTime}
            />

            <Detail
              label="Parent Permission"
              value={
                pass.parentPermission
                  ? "Granted"
                  : "Pending"
              }
              valueClass={
                pass.parentPermission
                  ? "text-green-600"
                  : "text-amber-600"
              }
            />

            <Detail
              label="Actual Status"
              value={pass.status}
            />

          </div>

        </div>

        {/* ================= QR SECTION ================= */}

        {showQRCode && (
          <div className="w-full xl:w-[300px] shrink-0">

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">

              <div className="text-center">

                <p className="text-sm font-bold text-blue-900">
                  Gate Pass QR
                </p>

                <p className="mt-1 text-xs text-blue-700">
                  Show this QR code to the hostel guard.
                </p>

              </div>

              <div className="mt-5 flex justify-center">

                <div className="rounded-2xl bg-white p-4 shadow-sm border border-blue-100">

                  <QRCodeCanvas
                    value={pass.qrToken}
                    size={200}
                    level="M"
                    includeMargin={true}
                  />

                </div>

              </div>

              {/* Status */}

              <div className="mt-4 text-center">

                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyle(
                    pass.status
                  )}`}
                >
                  {pass.status === "APPROVED"
                    ? "Ready for OUT scan"
                    : "Currently Outside"}
                </span>

              </div>

              {/* QR Token */}

              <div className="mt-5">

                <p className="text-[11px] uppercase tracking-wide font-semibold text-blue-700">
                  QR Token
                </p>

                <div className="mt-2 rounded-xl border border-blue-200 bg-white p-3">

                  <p className="break-all text-[10px] leading-4 font-mono text-slate-500">
                    {pass.qrToken}
                  </p>

                </div>

                <p className="mt-2 text-[11px] leading-4 text-blue-700">
                  This token is used by the guard scanner
                  to verify this gate pass.
                </p>

              </div>

            </div>

          </div>
        )}

      </div>

      {/* ================= FOOTER ================= */}

      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

        <p className="text-xs text-slate-400">
          Applied{" "}
          {pass.createdAt
            ? formatDate(pass.createdAt)
            : "—"}
        </p>

        {pass.rejectionReason && (
          <p className="text-xs font-medium text-red-600">
            Reason: {pass.rejectionReason}
          </p>
        )}

        {pass.status === "PENDING" && (
          <span className="text-xs font-semibold text-amber-600">
            Waiting for warden approval
          </span>
        )}

        {pass.status === "RETURNED" && (
          <span className="text-xs font-semibold text-green-600">
            Gate pass completed
          </span>
        )}

      </div>

    </div>
  );
}

/* =====================================================
   DETAIL
===================================================== */

function Detail({
  label,
  value,
  valueClass = "text-slate-900",
}) {
  return (
    <div>

      <p className="text-[11px] uppercase tracking-wide font-semibold text-slate-400">
        {label}
      </p>

      <p
        className={`mt-1 text-sm font-semibold ${valueClass}`}
      >
        {value || "—"}
      </p>

    </div>
  );
}

export default StudentGatePass;