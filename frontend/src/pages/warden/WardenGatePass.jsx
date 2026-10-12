import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function WardenGatePass() {
  const navigate = useNavigate();

  const [gatePasses, setGatePasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [processingId, setProcessingId] = useState(null);

  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectPassId, setRejectPassId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const storedUser = sessionStorage.getItem("user");

    if (!token || !storedUser) {
      navigate("/staff-login");
      return;
    }

    try {
      const user = JSON.parse(storedUser);

      if (user.role !== "WARDEN" && user.role !== "ADMIN") {
        navigate("/");
        return;
      }
    } catch (error) {
      console.error("Invalid user data:", error);

      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");

      navigate("/staff-login");
      return;
    }

    fetchGatePasses();
  }, [navigate]);

  const fetchGatePasses = async () => {
    try {
      setLoading(true);
      setError("");

      const token = sessionStorage.getItem("token");

      if (!token) {
        navigate("/staff-login");
        return;
      }

      const response = await api.get("/api/gate-passes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setGatePasses(response.data.gatePasses || []);
    } catch (error) {
      console.error("Warden gate pass error:", error);

      if (error.response?.status === 401) {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");

        navigate("/staff-login");
        return;
      }

      setError(
        error.response?.data?.message ||
          "Unable to load gate pass applications."
      );
    } finally {
      setLoading(false);
    }
  };

  const recordParentPermission = async (passId) => {
    try {
      setProcessingId(passId);
      setError("");
      setSuccess("");

      const token = sessionStorage.getItem("token");

      const response = await api.put(
        `/api/gate-passes/${passId}/parent-permission`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(
        response.data.message ||
          "Parent permission recorded successfully."
      );

      await fetchGatePasses();
    } catch (error) {
      console.error("Parent permission error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to record parent permission."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const approveGatePass = async (passId) => {
    try {
      setProcessingId(passId);
      setError("");
      setSuccess("");

      const token = sessionStorage.getItem("token");

      const response = await api.put(
        `/api/gate-passes/${passId}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(
        response.data.message ||
          "Gate pass approved successfully."
      );

      await fetchGatePasses();
    } catch (error) {
      console.error("Approve gate pass error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to approve gate pass."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectBox = (passId) => {
    setRejectPassId(passId);
    setRejectReason("");
    setError("");
    setSuccess("");
    setShowRejectBox(true);
  };

  const closeRejectBox = () => {
    setShowRejectBox(false);
    setRejectPassId(null);
    setRejectReason("");
  };

  const rejectGatePass = async () => {
    if (!rejectReason.trim()) {
      setError("Please enter a rejection reason.");
      return;
    }

    try {
      setProcessingId(rejectPassId);
      setError("");
      setSuccess("");

      const token = sessionStorage.getItem("token");

      const response = await api.put(
        `/api/gate-passes/${rejectPassId}/reject`,
        {
          reason: rejectReason.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(
        response.data.message ||
          "Gate pass rejected successfully."
      );

      closeRejectBox();

      await fetchGatePasses();
    } catch (error) {
      console.error("Reject gate pass error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to reject gate pass."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    navigate("/");
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const pendingCount = gatePasses.filter(
    (pass) => pass.status === "PENDING"
  ).length;

  const approvedCount = gatePasses.filter(
    (pass) => pass.status === "APPROVED"
  ).length;

  const outsideCount = gatePasses.filter(
    (pass) => pass.status === "OUT"
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />

          <p className="mt-4 text-sm text-slate-500">
            Loading gate pass applications...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
      {/* Navbar */}

      <nav className="bg-white border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
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
            <span className="hidden sm:inline-flex px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-700">
              Warden Portal
            </span>

            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg border border-red-200 bg-red-50 text-sm font-semibold text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main */}

      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
        {/* Header */}

        <section className="mb-8">
          <p className="text-sm font-semibold text-blue-600">
            Warden Portal
          </p>

          <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Gate Pass Management
          </h2>

          <p className="mt-2 text-slate-500">
            Review student gate-pass applications and verify
            parent permission.
          </p>
        </section>

        {/* Messages */}

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

        {/* Summary */}

        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <SummaryCard
            title="Total Applications"
            value={gatePasses.length}
            icon="G"
            iconStyle="bg-blue-100 text-blue-700"
          />

          <SummaryCard
            title="Pending"
            value={pendingCount}
            icon="P"
            iconStyle="bg-amber-100 text-amber-700"
          />

          <SummaryCard
            title="Approved"
            value={approvedCount}
            icon="✓"
            iconStyle="bg-green-100 text-green-700"
          />

          <SummaryCard
            title="Currently Outside"
            value={outsideCount}
            icon="→"
            iconStyle="bg-orange-100 text-orange-700"
          />
        </section>

        {/* Applications */}

        <section>
          <div className="mb-5">
            <h3 className="text-xl font-bold text-slate-900">
              Gate Pass Applications
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Review applications submitted by students.
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
                No Gate Pass Applications
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                There are currently no gate-pass applications.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {gatePasses.map((pass) => {
                const student = pass.studentId;
                const user = student?.userId;

                return (
                  <GatePassApplication
                    key={pass._id}
                    pass={pass}
                    student={student}
                    user={user}
                    formatDate={formatDate}
                    processingId={processingId}
                    onParentPermission={
                      recordParentPermission
                    }
                    onApprove={approveGatePass}
                    onReject={openRejectBox}
                  />
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Reject Modal */}

      {showRejectBox && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-5">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
            <h3 className="text-xl font-bold text-slate-900">
              Reject Gate Pass
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Please provide a reason for rejecting this
              application.
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => {
                setRejectReason(e.target.value);
                setError("");
              }}
              rows="4"
              placeholder="Enter rejection reason..."
              className="mt-5 w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none resize-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={closeRejectBox}
                className="px-5 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>

              <button
                onClick={rejectGatePass}
                disabled={processingId !== null}
                className="px-5 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 transition"
              >
                {processingId !== null
                  ? "Rejecting..."
                  : "Reject Gate Pass"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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

function GatePassApplication({
  pass,
  student,
  user,
  formatDate,
  processingId,
  onParentPermission,
  onApprove,
  onReject,
}) {
  const isPending = pass.status === "PENDING";
  const isProcessing = processingId === pass._id;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Application Header */}

      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
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

                <StatusBadge status={pass.status} />
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Application ID: {pass._id}
              </p>
            </div>
          </div>

          <div className="text-left lg:text-right">
            <p className="text-xs uppercase tracking-wide font-semibold text-slate-400">
              Applied
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-700">
              {formatDate(pass.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Student Information */}

      <div className="p-6">
        <div className="mb-6">
          <h5 className="text-sm font-bold text-slate-900 mb-4">
            Student Information
          </h5>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Info
              label="Student Name"
              value={user?.name}
            />

            <Info
              label="SBU ID"
              value={student?.sbuId}
            />

            <Info
              label="Student Phone"
              value={user?.phone}
              valueClass="text-blue-700"
            />

            <Info
              label="Course"
              value={student?.course}
            />

            <Info
              label="Year"
              value={
                student?.year
                  ? `Year ${student.year}`
                  : "—"
              }
            />

            <Info
              label="Hostel"
              value={student?.hostelId?.name}
            />

            <Info
              label="Room"
              value={student?.roomId?.roomNumber}
            />

            <Info
              label="Floor"
              value={
                student?.roomId?.floor !== undefined
                  ? `Floor ${student.roomId.floor}`
                  : "—"
              }
            />
          </div>
        </div>

        {/* Parent Information */}

        <div className="border-t border-slate-100 pt-6 mb-6">
          <h5 className="text-sm font-bold text-slate-900 mb-4">
            Parent / Guardian Information
          </h5>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <Info
              label="Father Name"
              value={student?.fatherName}
            />

            <Info
              label="Father Phone"
              value={student?.fatherMobile}
              valueClass="text-blue-700"
            />

            <Info
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
          </div>
        </div>

        {/* Pass Information */}

        <div className="border-t border-slate-100 pt-6">
          <h5 className="text-sm font-bold text-slate-900 mb-4">
            Gate Pass Details
          </h5>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Info
              label="Purpose"
              value={pass.purpose}
            />

            <Info
              label="Out Date"
              value={formatDate(pass.outDate)}
            />

            <Info
              label="Out Time"
              value={pass.outTime}
            />

            <Info
              label="Expected Return"
              value={formatDate(pass.expectedInDate)}
            />

            <Info
              label="Return Time"
              value={pass.expectedInTime}
            />

            <Info
              label="Current Status"
              value={pass.status}
            />
          </div>
        </div>

        {/* Actions */}

        {isPending && (
          <div className="border-t border-slate-100 mt-6 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Warden Action
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Call the parent using the number above before
                  granting permission.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {!pass.parentPermission && (
                  <button
                    onClick={() =>
                      onParentPermission(pass._id)
                    }
                    disabled={isProcessing}
                    className="px-4 py-2.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 disabled:opacity-60 transition"
                  >
                    {isProcessing
                      ? "Processing..."
                      : "✓ Record Permission"}
                  </button>
                )}

                <button
                  onClick={() => onApprove(pass._id)}
                  disabled={
                    isProcessing || !pass.parentPermission
                  }
                  className="px-5 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  ✓ Approve
                </button>

                <button
                  onClick={() => onReject(pass._id)}
                  disabled={isProcessing}
                  className="px-5 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-40 transition"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Approved Message */}

        {pass.status === "APPROVED" && (
          <div className="border-t border-slate-100 mt-6 pt-5">
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <p className="text-sm font-semibold text-green-700">
                ✓ Gate pass approved
              </p>

              <p className="mt-1 text-xs text-green-600">
                QR token has been generated and the student can
                use the approved gate pass.
              </p>
            </div>
          </div>
        )}

        {/* Rejected Message */}

        {pass.status === "REJECTED" && (
          <div className="border-t border-slate-100 mt-6 pt-5">
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-sm font-semibold text-red-700">
                Gate pass rejected
              </p>

              <p className="mt-1 text-xs text-red-600">
                Reason:{" "}
                {pass.rejectionReason ||
                  "No reason provided"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Info({
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
        className={`mt-1 text-sm font-semibold break-words ${valueClass}`}
      >
        {value || "—"}
      </p>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    PENDING:
      "bg-amber-50 text-amber-700 border-amber-200",

    APPROVED:
      "bg-blue-50 text-blue-700 border-blue-200",

    OUT:
      "bg-orange-50 text-orange-700 border-orange-200",

    RETURNED:
      "bg-green-50 text-green-700 border-green-200",

    REJECTED:
      "bg-red-50 text-red-700 border-red-200",

    EXPIRED:
      "bg-slate-100 text-slate-600 border-slate-200",

    CANCELLED:
      "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <span
      className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${
        styles[status] ||
        "bg-slate-100 text-slate-600 border-slate-200"
      }`}
    >
      {status}
    </span>
  );
}

export default WardenGatePass;