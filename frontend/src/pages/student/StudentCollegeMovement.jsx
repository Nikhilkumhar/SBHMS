import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

function StudentCollegeMovement() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMovements = async () => {
    try {
      setLoading(true);
      setError("");

      const token = sessionStorage.getItem("token");

      const response = await api.get("/api/college-movements/my", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMovements(response.data.movements || []);
    } catch (err) {
      console.error("Fetch college movements error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load college movement history."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, []);

  const getStatusStyle = (status) => {
    if (status === "OUT") {
      return "bg-yellow-100 text-yellow-700";
    }

    if (status === "IN") {
      return "bg-green-100 text-green-700";
    }

    return "bg-gray-100 text-gray-700";
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (time) => {
    if (!time) return "-";

    return new Date(time).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              College Movement
            </h1>

            <p className="mt-1 text-gray-600">
              View your college OUT and IN movement history.
            </p>
          </div>

          <Link
            to="/student"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-center font-medium text-white transition hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Current Status */}
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Current Status
          </h2>

          {movements.length === 0 ? (
            <p className="text-gray-500">
              No college movement recorded yet.
            </p>
          ) : (
            (() => {
              const latestMovement = movements[0];

              return (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-500">
                      Latest Movement
                    </p>

                    <p className="mt-1 font-medium text-gray-900">
                      {formatDate(latestMovement.date)}
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full px-4 py-2 text-sm font-semibold ${getStatusStyle(
                      latestMovement.status
                    )}`}
                  >
                    {latestMovement.status === "OUT"
                      ? "Currently OUT"
                      : "IN Hostel"}
                  </span>
                </div>
              );
            })()
          )}
        </div>

        {/* History */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="border-b px-6 py-5">
            <h2 className="text-lg font-semibold text-gray-900">
              Movement History
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Total Records: {movements.length}
            </p>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center text-gray-500">
              Loading movement history...
            </div>
          ) : error ? (
            <div className="px-6 py-12 text-center">
              <p className="mb-4 text-red-600">{error}</p>

              <button
                onClick={fetchMovements}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : movements.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              No college movement records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                      Date
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                      OUT Time
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                      IN Time
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                      Status
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                      Remarks
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {movements.map((movement) => (
                    <tr
                      key={movement._id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {formatDate(movement.date)}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-800">
                        {formatTime(movement.outTime)}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-800">
                        {formatTime(movement.inTime)}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                            movement.status
                          )}`}
                        >
                          {movement.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600">
                        {movement.remarks ||
                          (movement.isCorrected
                            ? `Corrected: ${
                                movement.correctionReason || "Manual correction"
                              }`
                            : "-")}
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

export default StudentCollegeMovement;