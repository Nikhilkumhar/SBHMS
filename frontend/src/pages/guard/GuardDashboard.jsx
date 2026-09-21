import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function GuardDashboard() {
  const navigate = useNavigate();

  const [scanType, setScanType] = useState("COLLEGE");

  const [qrToken, setQrToken] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // ==========================================
  // HANDLE QR SCAN
  // ==========================================

  const handleScan = async (e) => {
    e.preventDefault();

    if (!qrToken.trim()) {
      setError("Please enter or scan a QR token.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      let response;

      // ========================================
      // COLLEGE QR
      // ========================================

      if (scanType === "COLLEGE") {
        response = await api.post(
          "/api/college/scan",
          {
            qrToken: qrToken.trim(),
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const action = response.data.action;

        setSuccess(
          response.data.message ||
            `College ${action} recorded successfully.`
        );
      }

      // ========================================
      // GATE PASS OUT
      // ========================================

      if (scanType === "GATE_OUT") {
        response = await api.post(
          "/api/gate-passes/scan/out",
          {
            qrToken: qrToken.trim(),
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setSuccess(
          response.data.message ||
            "Student OUT recorded successfully."
        );
      }

      // ========================================
      // GATE PASS IN
      // ========================================

      if (scanType === "GATE_IN") {
        response = await api.post(
          "/api/gate-passes/scan/in",
          {
            qrToken: qrToken.trim(),
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setSuccess(
          response.data.message ||
            "Student IN recorded successfully."
        );
      }

      setQrToken("");
    } catch (err) {
      console.error("QR scan error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to process QR scan."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  // ==========================================
  // SCAN TYPE INFORMATION
  // ==========================================

  const getScanTitle = () => {
    if (scanType === "COLLEGE") {
      return "College QR Scan";
    }

    if (scanType === "GATE_OUT") {
      return "Gate Pass OUT";
    }

    return "Gate Pass IN";
  };

  const getScanDescription = () => {
    if (scanType === "COLLEGE") {
      return "Scan the student's daily QR. The system automatically records College OUT or IN.";
    }

    if (scanType === "GATE_OUT") {
      return "Scan an approved gate pass QR when the student leaves the hostel.";
    }

    return "Scan the student's active gate pass QR when the student returns.";
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* ======================================
          TOP NAVIGATION
      ====================================== */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              SBHMS
            </p>

            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Guard Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-800">
                {user.name || "Guard"}
              </p>

              <p className="text-xs text-slate-500">
                {user.staffId || "GUARD"}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* ======================================
          MAIN CONTENT
      ====================================== */}

      <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">

        {/* Welcome */}

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900">
            Daily Hostel Operations
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Scan student QR codes to manage college movement and gate pass entry/exit.
          </p>
        </div>

        {/* ======================================
            QUICK OPERATION CARDS
        ====================================== */}

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">

          <button
            type="button"
            onClick={() => {
              setScanType("COLLEGE");
              setError("");
              setSuccess("");
            }}
            className={`rounded-2xl border p-5 text-left shadow-sm transition ${
              scanType === "COLLEGE"
                ? "border-blue-300 bg-blue-50"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-xl">
              🎓
            </div>

            <h3 className="font-bold text-slate-900">
              College Movement
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Scan daily student QR
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              setScanType("GATE_OUT");
              setError("");
              setSuccess("");
            }}
            className={`rounded-2xl border p-5 text-left shadow-sm transition ${
              scanType === "GATE_OUT"
                ? "border-red-300 bg-red-50"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-xl">
              ↗
            </div>

            <h3 className="font-bold text-slate-900">
              Gate Pass OUT
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Record student leaving
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              setScanType("GATE_IN");
              setError("");
              setSuccess("");
            }}
            className={`rounded-2xl border p-5 text-left shadow-sm transition ${
              scanType === "GATE_IN"
                ? "border-emerald-300 bg-emerald-50"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-xl">
              ↙
            </div>

            <h3 className="font-bold text-slate-900">
              Gate Pass IN
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Record student returning
            </p>
          </button>

        </div>

        {/* ======================================
            MESSAGES
        ====================================== */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">
            {success}
          </div>
        )}

        {/* ======================================
            SCANNER SECTION
        ====================================== */}

        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
              ▣
            </div>

            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
              {getScanTitle()}
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              {getScanDescription()}
            </p>
          </div>

          <form
            onSubmit={handleScan}
            className="space-y-5"
          >

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Student QR Token
              </label>

              <input
                type="text"
                value={qrToken}
                onChange={(e) =>
                  setQrToken(e.target.value)
                }
                placeholder="Scan or enter QR token"
                autoComplete="off"
                autoFocus
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <p className="mt-2 text-xs text-slate-400">
                A physical QR scanner can enter the token into this field automatically.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Processing..."
                : "Process QR Scan"}
            </button>

          </form>

          {/* Current operation */}

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-slate-600">
                Current Operation
              </span>

              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {getScanTitle()}
              </span>
            </div>
          </div>

        </div>

        {/* ======================================
            OPERATION GUIDE
        ====================================== */}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="text-lg font-bold text-slate-900">
            Guard Scan Guide
          </h2>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="font-semibold text-blue-900">
                College
              </p>

              <p className="mt-1 text-sm leading-6 text-blue-800">
                First scan records College OUT. The next scan records College IN automatically.
              </p>
            </div>

            <div className="rounded-xl border border-red-100 bg-red-50 p-4">
              <p className="font-semibold text-red-900">
                Gate OUT
              </p>

              <p className="mt-1 text-sm leading-6 text-red-800">
                Use the approved gate-pass QR when a student leaves the hostel.
              </p>
            </div>

            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="font-semibold text-emerald-900">
                Gate IN
              </p>

              <p className="mt-1 text-sm leading-6 text-emerald-800">
                Use the same active gate-pass QR when the student returns.
              </p>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}

export default GuardDashboard;