import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function GatePassManagement() {
  const navigate = useNavigate();

  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchGatePasses();
  }, []);

  const fetchGatePasses = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/api/gate-passes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setPasses(response.data.gatePasses || []);
    } catch (err) {
      console.error("Fetch gate passes error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load gate passes."
      );
    } finally {
      setLoading(false);
    }
  };

  const getStudentName = (pass) => {
    return pass.studentId?.userId?.name || "Unknown Student";
  };

  const getStudentEmail = (pass) => {
    return pass.studentId?.userId?.email || "—";
  };

  const getSbuId = (pass) => {
    return pass.studentId?.sbuId || "—";
  };

  const getCourse = (pass) => {
    return pass.studentId?.course || "—";
  };

  const getHostel = (pass) => {
    return (
      pass.studentId?.hostelId?.name ||
      pass.studentId?.hostelId?.code ||
      "—"
    );
  };

  const getRoom = (pass) => {
    return pass.studentId?.roomId?.roomNumber || "—";
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredPasses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return passes.filter((pass) => {
      const studentName = getStudentName(pass).toLowerCase();
      const sbuId = getSbuId(pass).toLowerCase();
      const purpose = (pass.purpose || "").toLowerCase();
      const passType = (pass.passType || "").toLowerCase();
      const status = (pass.status || "").toLowerCase();

      const matchesSearch =
        !query ||
        studentName.includes(query) ||
        sbuId.includes(query) ||
        purpose.includes(query) ||
        passType.includes(query) ||
        status.includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        pass.status === statusFilter;

      const matchesType =
        typeFilter === "ALL" ||
        pass.passType === typeFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType
      );
    });
  }, [passes, search, statusFilter, typeFilter]);

  const summary = useMemo(() => {
    return {
      total: passes.length,

      pending: passes.filter(
        (pass) => pass.status === "PENDING"
      ).length,

      approved: passes.filter(
        (pass) => pass.status === "APPROVED"
      ).length,

      outside: passes.filter(
        (pass) => pass.status === "OUT"
      ).length,

      returned: passes.filter(
        (pass) => pass.status === "RETURNED"
      ).length,

      home: passes.filter(
        (pass) => pass.passType === "HOME"
      ).length,

      market: passes.filter(
        (pass) => pass.passType === "MARKET"
      ).length,
    };
  }, [passes]);

  const getStatusStyle = (status) => {
    const styles = {
      PENDING:
        "bg-amber-50 text-amber-700 border-amber-200",

      APPROVED:
        "bg-blue-50 text-blue-700 border-blue-200",

      OUT:
        "bg-red-50 text-red-700 border-red-200",

      RETURNED:
        "bg-emerald-50 text-emerald-700 border-emerald-200",

      REJECTED:
        "bg-slate-100 text-slate-600 border-slate-200",

      EXPIRED:
        "bg-orange-50 text-orange-700 border-orange-200",

      CANCELLED:
        "bg-slate-100 text-slate-600 border-slate-200",
    };

    return (
      styles[status] ||
      "bg-slate-100 text-slate-600 border-slate-200"
    );
  };

  const getTypeStyle = (type) => {
    if (type === "HOME") {
      return "bg-purple-50 text-purple-700 border-purple-200";
    }

    return "bg-cyan-50 text-cyan-700 border-cyan-200";
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <button
              onClick={() => navigate("/admin")}
              className="mb-3 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              ← Back to Dashboard
            </button>

            <h1 className="text-3xl font-bold text-slate-900">
              Gate Pass Management
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Monitor student gate passes and outside movements.
            </p>
          </div>

          <button
            onClick={fetchGatePasses}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            ↻ Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Passes
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {summary.total}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Pending
            </p>

            <p className="mt-2 text-3xl font-bold text-amber-600">
              {summary.pending}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Currently Outside
            </p>

            <p className="mt-2 text-3xl font-bold text-red-600">
              {summary.outside}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Returned
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {summary.returned}
            </p>
          </div>
        </div>

        {/* Secondary Summary */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">
            <p className="text-sm font-medium text-purple-700">
              Home Passes
            </p>

            <p className="mt-1 text-2xl font-bold text-purple-900">
              {summary.home}
            </p>
          </div>

          <div className="rounded-xl border border-cyan-100 bg-cyan-50 p-4">
            <p className="text-sm font-medium text-cyan-700">
              Market Passes
            </p>

            <p className="mt-1 text-2xl font-bold text-cyan-900">
              {summary.market}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-medium text-blue-700">
              Approved
            </p>

            <p className="mt-1 text-2xl font-bold text-blue-900">
              {summary.approved}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Search */}
            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Search
              </label>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, SBU ID, purpose..."
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Status */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="OUT">Outside</option>
                <option value="RETURNED">Returned</option>
                <option value="REJECTED">Rejected</option>
                <option value="EXPIRED">Expired</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Type */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Pass Type
              </label>

              <select
                value={typeFilter}
                onChange={(e) =>
                  setTypeFilter(e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="ALL">All Types</option>
                <option value="HOME">Home</option>
                <option value="MARKET">Market</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Gate Pass Records
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Showing {filteredPasses.length} of{" "}
                  {passes.length} records
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-16 text-center text-sm text-slate-500">
              Loading gate passes...
            </div>
          ) : filteredPasses.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
                —
              </div>

              <h3 className="font-semibold text-slate-800">
                No gate passes found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200">
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Student
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Hostel / Room
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Type
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Purpose
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Out / Return
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredPasses.map((pass) => (
                    <tr
                      key={pass._id || pass.id}
                      className="transition hover:bg-slate-50"
                    >
                      {/* Student */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                            {getStudentName(pass)
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">
                              {getStudentName(pass)}
                            </p>

                            <p className="text-xs text-slate-500">
                              {getSbuId(pass)}
                            </p>

                            <p className="text-xs text-slate-400">
                              {getCourse(pass)} ·{" "}
                              {getStudentEmail(pass)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Hostel */}
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">
                          {getHostel(pass)}
                        </p>

                        <p className="text-sm text-slate-500">
                          Room {getRoom(pass)}
                        </p>
                      </td>

                      {/* Type */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getTypeStyle(
                            pass.passType
                          )}`}
                        >
                          {pass.passType || "—"}
                        </span>
                      </td>

                      {/* Purpose */}
                      <td className="max-w-[220px] px-5 py-4">
                        <p className="truncate font-medium text-slate-800">
                          {pass.purpose || "—"}
                        </p>
                      </td>

                      {/* Dates */}
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-slate-800">
                          {formatDate(pass.outDate)}
                        </p>

                        <p className="text-xs text-slate-500">
                          Out: {pass.outTime || "—"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Return:{" "}
                          {formatDate(pass.expectedInDate)}{" "}
                          {pass.expectedInTime || ""}
                        </p>

                        {pass.actualOutTime && (
                          <p className="mt-1 text-xs text-red-500">
                            Actual Out:{" "}
                            {formatDateTime(pass.actualOutTime)}
                          </p>
                        )}

                        {pass.actualInTime && (
                          <p className="text-xs text-emerald-600">
                            Actual In:{" "}
                            {formatDateTime(pass.actualInTime)}
                          </p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyle(
                            pass.status
                          )}`}
                        >
                          {pass.status || "—"}
                        </span>

                        <p className="mt-2 text-xs text-slate-500">
                          Parent:{" "}
                          {pass.parentPermission
                            ? "Permission Given"
                            : "Pending"}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GatePassManagement;