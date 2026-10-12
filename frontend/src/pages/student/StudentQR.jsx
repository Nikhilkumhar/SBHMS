import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import api from "../../services/api";

function StudentQR() {
  const [qrToken, setQrToken] = useState("");
  const [qrDate, setQrDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDailyQR();
  }, []);

  const fetchDailyQR = async () => {
    try {
      setLoading(true);
      setError("");

      const token = sessionStorage.getItem("token");

      const response = await api.get("/api/student-qr/daily", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setQrToken(response.data.qrToken);
      setQrDate(response.data.qrDate);
    } catch (err) {
      console.error("Fetch daily QR error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load today's QR code."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ================= HEADER ================= */}

      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              SBHMS
            </h1>

            <p className="text-sm text-blue-600">
              SARALA BIRLA HOSTEL
            </p>
          </div>

          <button
            onClick={() => window.history.back()}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            ← Back
          </button>

        </div>
      </header>

      {/* ================= MAIN ================= */}

      <main className="mx-auto max-w-5xl px-6 py-10">

        {/* Page Heading */}

        <div className="mb-8">

          <p className="mb-2 text-sm font-semibold text-blue-600">
            STUDENT PORTAL
          </p>

          <h2 className="text-3xl font-bold text-slate-900">
            College QR
          </h2>

          <p className="mt-2 text-slate-600">
            Show this QR code at the Hostel gate for entry and exit.
          </p>

        </div>

        {/* ================= LOADING ================= */}

        {loading && (
          <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
            <p className="text-slate-600">
              Generating today's QR code...
            </p>
          </div>
        )}

        {/* ================= ERROR ================= */}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">

            <p className="font-medium text-red-700">
              {error}
            </p>

            <button
              onClick={fetchDailyQR}
              className="mt-4 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Try Again
            </button>

          </div>
        )}

        {/* ================= QR CONTENT ================= */}

        {!loading && !error && qrToken && (
          <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">

            {/* ================= INFORMATION CARD ================= */}

            <div className="rounded-2xl border bg-white p-7 shadow-sm">

              <div className="mb-6">

                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-xl font-bold text-blue-600">
                  Q
                </div>

                <h3 className="text-xl font-bold text-slate-900">
                  Today's College QR
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  This QR code is generated for today's college
                  movement. Show it to the guard at the Hostel gate.
                </p>

              </div>

              {/* QR DATE */}

              <div className="mb-5">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  QR Date
                </p>

                <p className="mt-1 font-medium text-slate-900">
                  {formatDate(qrDate)}
                </p>

              </div>

              {/* STATUS */}

              <div>

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </p>

                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700">

                  <span className="h-2 w-2 rounded-full bg-green-500" />

                  Active Today

                </div>

              </div>

              {/* INSTRUCTIONS */}

              <div className="mt-8 rounded-xl bg-blue-50 p-4">

                <p className="text-sm font-semibold text-blue-900">
                  How to use
                </p>

                <p className="mt-1 text-sm leading-5 text-blue-800">
                  Show this QR to the guard when leaving for college
                  and again when returning to the hostel.
                </p>

              </div>

            </div>

            {/* ================= QR CARD ================= */}

            <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">

              <p className="mb-5 text-sm font-semibold text-slate-700">
                Scan at Hostel Gate
              </p>

              {/* QR CODE */}

              <div className="mx-auto flex w-fit items-center justify-center rounded-2xl border bg-white p-5 shadow-sm">

                <QRCodeCanvas
                  value={qrToken}
                  size={260}
                  level="H"
                  includeMargin={true}
                />

              </div>

              {/* QR TOKEN */}

              <div className="mt-6 rounded-xl bg-slate-50 p-4 text-left">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  QR Token
                </p>

                <p className="mt-2 break-all font-mono text-sm text-slate-700">
                  {qrToken}
                </p>

              </div>

              {/* VALIDITY */}

              <p className="mt-4 text-sm text-slate-500">
                This QR is valid for today only.
              </p>

            </div>

          </div>
        )}

      </main>
    </div>
  );
}

export default StudentQR;