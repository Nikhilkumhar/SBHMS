import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import api from "../../services/api";

/* =========================================================
   SCAN MODES
========================================================= */

const SCAN_MODES = {
  COLLEGE: {
    label: "College Movement",
    short: "College",
    sub: "Scan daily student QR",
    icon: "🎓",
    endpoint: "/api/college/scan",
    description:
      "Scan the student's daily QR. The system automatically records College OUT or IN.",
    cardActive: "border-blue-300 bg-blue-50",
    iconBg: "bg-blue-100",
    badge: "border-blue-200 bg-blue-50 text-blue-700",
  },
  GATE_OUT: {
    label: "Gate Pass OUT",
    short: "Gate OUT",
    sub: "Record student leaving",
    icon: "↗",
    endpoint: "/api/gate-passes/scan/out",
    description:
      "Scan an approved gate pass QR when the student leaves the hostel.",
    cardActive: "border-red-300 bg-red-50",
    iconBg: "bg-red-100",
    badge: "border-red-200 bg-red-50 text-red-700",
  },
  GATE_IN: {
    label: "Gate Pass IN",
    short: "Gate IN",
    sub: "Record student returning",
    icon: "↙",
    endpoint: "/api/gate-passes/scan/in",
    description:
      "Scan the student's active gate pass QR when the student returns.",
    cardActive: "border-emerald-300 bg-emerald-50",
    iconBg: "bg-emerald-100",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
};

// Same QR scanned again within this time is ignored
const DUPLICATE_SCAN_MS = 4000;

/* =========================================================
   SMALL HELPERS
========================================================= */

const nowTime = () =>
  new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

// Short beep + vibration so the guard knows the result without looking
const giveFeedback = (ok) => {
  try {
    if (navigator.vibrate) {
      navigator.vibrate(ok ? 150 : [100, 60, 100]);
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.value = ok ? 880 : 220;
    gain.gain.value = 0.1;

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + (ok ? 0.15 : 0.35));
    osc.onended = () => ctx.close();
  } catch {
    // Sound is optional. Ignore any error.
  }
};

const cameraErrorMessage = (err) => {
  const name = err?.name || "";
  const text = String(err?.message || err || "");

  if (name === "NotAllowedError" || /permission/i.test(text)) {
    return "Camera permission was denied. Allow camera access for this site in your browser settings and try again.";
  }

  if (name === "NotFoundError" || /not found|no camera/i.test(text)) {
    return "No camera was found on this device. Use the manual entry box below.";
  }

  if (name === "NotReadableError") {
    return "The camera is being used by another app. Close it and try again.";
  }

  return "Unable to start the camera. You can still enter the token manually.";
};

/* =========================================================
   PAGE
========================================================= */

function GuardDashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  const [scanType, setScanType] = useState("COLLEGE");
  const [manualToken, setManualToken] = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const [cameraOn, setCameraOn] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState("");

  // Refs hold values that the camera callback must always see fresh
  const scannerRef = useRef(null);
  const busyRef = useRef(false);
  const lastScanRef = useRef({ token: "", time: 0 });
  const scanTypeRef = useRef("COLLEGE");
  const processRef = useRef(null);

  const mode = SCAN_MODES[scanType];

  /* ==========================================
     PROCESS ONE QR TOKEN
  ========================================== */

  const processToken = async (rawToken) => {
    const token = String(rawToken || "").trim();

    if (!token) return;

    // Already working on a scan
    if (busyRef.current) return;

    // Same code scanned again too quickly
    const now = Date.now();

    if (
      lastScanRef.current.token === token &&
      now - lastScanRef.current.time < DUPLICATE_SCAN_MS
    ) {
      return;
    }

    lastScanRef.current = { token, time: now };
    busyRef.current = true;
    setProcessing(true);

    const activeType = scanTypeRef.current;
    const activeMode = SCAN_MODES[activeType];

    try {
      const response = await api.post(activeMode.endpoint, {
        qrToken: token,
      });

      const data = response.data;

      const student = data.student || data.gatePass?.student || null;

      let title = activeMode.label;

      if (activeType === "COLLEGE") {
        title = `College ${data.action || ""}`.trim();
      } else if (activeType === "GATE_IN" && data.isLate) {
        title = "Returned LATE";
      }

      setResult({
        ok: true,
        late: Boolean(data.isLate),
        title,
        message: data.message || "Scan recorded successfully.",
        student,
      });

      setHistory((previous) =>
        [
          {
            id: `${now}-${previous.length}`,
            time: nowTime(),
            mode: activeMode.short,
            name: student?.name || "Student",
            sbuId: student?.sbuId || "",
            ok: true,
            note: title,
          },
          ...previous,
        ].slice(0, 8)
      );

      giveFeedback(true);
    } catch (err) {
      console.error("QR scan error:", err);

      const message = err.response
        ? err.response.data?.message || "Unable to process QR scan."
        : "Cannot reach the server. Check the internet connection.";

      setResult({
        ok: false,
        late: false,
        title: "Scan failed",
        message,
        student: null,
      });

      setHistory((previous) =>
        [
          {
            id: `${now}-${previous.length}`,
            time: nowTime(),
            mode: activeMode.short,
            name: "—",
            sbuId: "",
            ok: false,
            note: message,
          },
          ...previous,
        ].slice(0, 8)
      );

      giveFeedback(false);
    } finally {
      busyRef.current = false;
      setProcessing(false);
    }
  };

  // The camera callback always calls the newest version of processToken
  processRef.current = processToken;

  /* ==========================================
     CAMERA
  ========================================== */

  const startCamera = async () => {
    setCameraError("");

    if (!window.isSecureContext) {
      setCameraError(
        "The camera only works on HTTPS or on localhost. Open the secure (https) address of this site."
      );
      return;
    }

    setCameraStarting(true);

    // Show the camera box first, so the scanner has somewhere to draw
    setCameraOn(true);
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (width, height) => {
            const size = Math.floor(Math.min(width, height) * 0.7);
            return { width: size, height: size };
          },
        },
        (decodedText) => {
          if (processRef.current) processRef.current(decodedText);
        },
        () => {
          // Called on every frame without a QR code. Ignore.
        }
      );
    } catch (err) {
      console.error("Camera start error:", err);

      scannerRef.current = null;
      setCameraOn(false);
      setCameraError(cameraErrorMessage(err));
    } finally {
      setCameraStarting(false);
    }
  };

  const stopCamera = async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;

    if (scanner) {
      try {
        await scanner.stop();
        scanner.clear();
      } catch {
        // Already stopped. Ignore.
      }
    }

    setCameraOn(false);
  };

  // Turn the camera off when leaving this page
  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;
      scannerRef.current = null;

      if (scanner) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {});
      }
    };
  }, []);

  /* ==========================================
     OTHER ACTIONS
  ========================================== */

  const changeMode = (newMode) => {
    setScanType(newMode);
    scanTypeRef.current = newMode;

    // Allow the same QR to be scanned again for the new operation
    lastScanRef.current = { token: "", time: 0 };
    setResult(null);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();

    if (!manualToken.trim()) {
      setResult({
        ok: false,
        late: false,
        title: "Nothing to scan",
        message: "Please enter or scan a QR token.",
        student: null,
      });
      return;
    }

    await processToken(manualToken);
    setManualToken("");
  };

  const handleLogout = async () => {
    await stopCamera();

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    navigate("/staff-login", { replace: true });
  };

  /* ==========================================
     PAGE
  ========================================== */

  return (
    <div className="min-h-screen bg-slate-100">
      {/* ================= HEADER ================= */}

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

      <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        {/* ================= MODE CARDS ================= */}

        <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
          {Object.entries(SCAN_MODES).map(([key, item]) => (
            <button
              key={key}
              type="button"
              onClick={() => changeMode(key)}
              className={`flex items-center gap-4 rounded-2xl border p-4 text-left shadow-sm transition md:block md:p-5 ${
                scanType === key
                  ? item.cardActive
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl md:mb-4 ${item.iconBg}`}
              >
                {item.icon}
              </div>

              <div>
                <h3 className="font-bold text-slate-900">{item.label}</h3>
                <p className="mt-0.5 text-sm text-slate-500">{item.sub}</p>
              </div>
            </button>
          ))}
        </div>

        {/* ================= SCANNER + RESULT ================= */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* ---------- CAMERA ---------- */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Camera Scanner
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {mode.description}
                </p>
              </div>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${mode.badge}`}
              >
                {mode.label}
              </span>
            </div>

            {cameraError && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {cameraError}
              </div>
            )}

            {cameraOn ? (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-black">
                <div id="qr-reader" className="w-full" />
              </div>
            ) : (
              <div className="flex aspect-square max-h-[420px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-center">
                <div className="text-5xl">📷</div>
                <p className="mt-3 text-sm font-medium text-slate-600">
                  Camera is off
                </p>
                <p className="mt-1 px-6 text-xs text-slate-400">
                  Tap “Start Camera”, then point it at the student's QR code.
                </p>
              </div>
            )}

            <div className="mt-4">
              {cameraOn ? (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Stop Camera
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startCamera}
                  disabled={cameraStarting}
                  className="w-full rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {cameraStarting ? "Starting camera..." : "Start Camera"}
                </button>
              )}
            </div>
          </section>

          {/* ---------- RESULT + MANUAL + HISTORY ---------- */}

          <div className="space-y-6">
            {/* RESULT */}

            <section
              className={`rounded-2xl border p-5 shadow-sm sm:p-6 ${
                processing
                  ? "border-slate-200 bg-white"
                  : result
                  ? result.ok
                    ? result.late
                      ? "border-amber-300 bg-amber-50"
                      : "border-emerald-300 bg-emerald-50"
                    : "border-red-300 bg-red-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              {processing ? (
                <div className="py-6 text-center">
                  <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
                  <p className="mt-3 text-sm text-slate-500">Processing...</p>
                </div>
              ) : result ? (
                <div>
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl font-bold ${
                        result.ok
                          ? result.late
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {result.ok ? (result.late ? "!" : "✓") : "✕"}
                    </div>

                    <div className="min-w-0">
                      <h3
                        className={`text-xl font-bold ${
                          result.ok
                            ? result.late
                              ? "text-amber-900"
                              : "text-emerald-900"
                            : "text-red-900"
                        }`}
                      >
                        {result.title}
                      </h3>

                      <p
                        className={`mt-1 text-sm ${
                          result.ok
                            ? result.late
                              ? "text-amber-800"
                              : "text-emerald-800"
                            : "text-red-800"
                        }`}
                      >
                        {result.message}
                      </p>
                    </div>
                  </div>

                  {result.student && (
                    <div className="mt-5 rounded-xl border border-white/70 bg-white p-4">
                      <p className="text-xs font-medium text-slate-500">
                        Student
                      </p>

                      <p className="mt-1 text-lg font-bold text-slate-900">
                        {result.student.name}
                      </p>

                      <p className="mt-1 text-sm text-slate-600">
                        {result.student.sbuId}
                        {result.student.course
                          ? ` · ${result.student.course}`
                          : ""}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-6 text-center">
                  <div className="text-4xl">▣</div>
                  <p className="mt-3 text-sm font-medium text-slate-600">
                    Waiting for a scan
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    The result will appear here.
                  </p>
                </div>
              )}
            </section>

            {/* MANUAL ENTRY */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-slate-900">
                Manual Entry
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Use this if the camera is not working, or with a hardware
                barcode scanner.
              </p>

              <form onSubmit={handleManualSubmit} className="mt-4 space-y-3">
                <input
                  type="text"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="Scan or enter QR token"
                  autoComplete="off"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <button
                  type="submit"
                  disabled={processing}
                  className="w-full rounded-xl bg-slate-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processing ? "Processing..." : "Process QR Scan"}
                </button>
              </form>
            </section>

            {/* RECENT SCANS */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">
                  Recent Scans
                </h2>

                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setHistory([])}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                  >
                    Clear
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <p className="mt-3 text-sm text-slate-400">
                  No scans yet in this session.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-slate-100">
                  {history.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {item.name}
                          {item.sbuId ? (
                            <span className="ml-2 font-normal text-slate-500">
                              {item.sbuId}
                            </span>
                          ) : null}
                        </p>

                        <p
                          className={`truncate text-xs ${
                            item.ok ? "text-slate-500" : "text-red-600"
                          }`}
                        >
                          {item.mode} · {item.note}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-xs text-slate-400">
                          {item.time}
                        </span>

                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            item.ok ? "bg-emerald-500" : "bg-red-500"
                          }`}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default GuardDashboard;