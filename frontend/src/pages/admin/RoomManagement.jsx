import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";

function RoomManagement() {
  const navigate = useNavigate();

  const [hostels, setHostels] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedHostel, setSelectedHostel] = useState("ALL");

  const [showAddRoom, setShowAddRoom] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    hostelId: "",
    roomNumber: "",
    floor: "",
    capacity: "",
    status: "AVAILABLE",
  });

  /* ================= FETCH DATA ================= */

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const [hostelResponse, roomResponse] =
        await Promise.all([
          api.get("/api/hostels", config),
          api.get("/api/rooms", config),
        ]);

      setHostels(
        hostelResponse.data?.hostels ||
          hostelResponse.data?.data ||
          []
      );

      setRooms(
        roomResponse.data?.rooms ||
          roomResponse.data?.data ||
          []
      );
    } catch (err) {
      console.error("Room management error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load room information."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ================= HELPERS ================= */

  const getId = (value) => {
    if (!value) return "";

    return value._id || value.id || value;
  };

  const getHostelName = (room) => {
    if (room.hostelId?.name) {
      return room.hostelId.name;
    }

    const hostel = hostels.find(
      (item) =>
        String(getId(item)) ===
        String(getId(room.hostelId))
    );

    return hostel?.name || "Unknown Hostel";
  };

  const getHostelCode = (room) => {
    if (room.hostelId?.code) {
      return room.hostelId.code;
    }

    const hostel = hostels.find(
      (item) =>
        String(getId(item)) ===
        String(getId(room.hostelId))
    );

    return hostel?.code || "—";
  };

  /* ================= FILTER ================= */

  const filteredRooms = useMemo(() => {
    const value = search.trim().toLowerCase();

    return rooms.filter((room) => {
      const roomNumber = String(
        room.roomNumber || ""
      ).toLowerCase();

      const floor = String(
        room.floor || ""
      ).toLowerCase();

      const hostelName =
        getHostelName(room).toLowerCase();

      const hostelCode =
        getHostelCode(room).toLowerCase();

      const matchesSearch =
        !value ||
        roomNumber.includes(value) ||
        floor.includes(value) ||
        hostelName.includes(value) ||
        hostelCode.includes(value);

      const roomHostelId = String(
        getId(room.hostelId)
      );

      const matchesHostel =
        selectedHostel === "ALL" ||
        roomHostelId === String(selectedHostel);

      return matchesSearch && matchesHostel;
    });
  }, [
    rooms,
    hostels,
    search,
    selectedHostel,
  ]);

  /* ================= SUMMARY ================= */

  const totalCapacity = rooms.reduce(
    (total, room) =>
      total + Number(room.capacity || 0),
    0
  );

  const totalOccupancy = rooms.reduce(
    (total, room) =>
      total + Number(room.currentOccupancy || 0),
    0
  );

  const availableRooms = rooms.filter(
    (room) =>
      room.status === "AVAILABLE"
  ).length;

  const occupiedRooms = rooms.filter(
    (room) =>
      room.status === "OCCUPIED"
  ).length;

  /* ================= FORM ================= */

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setError("");
  };

  /* ================= ADD ROOM ================= */

  const handleAddRoom = async (e) => {
    e.preventDefault();

    if (!formData.hostelId) {
      setError("Please select a hostel.");
      return;
    }

    if (!formData.roomNumber.trim()) {
      setError("Room number is required.");
      return;
    }

    if (!formData.floor) {
      setError("Floor is required.");
      return;
    }

    if (!formData.capacity) {
      setError("Room capacity is required.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const token = localStorage.getItem("token");

      const response = await api.post(
        "/api/rooms",
        {
          hostelId: formData.hostelId,
          roomNumber: formData.roomNumber.trim(),
          floor: Number(formData.floor),
          capacity: Number(formData.capacity),
          status: formData.status,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const newRoom =
        response.data?.room ||
        response.data?.data;

      if (newRoom) {
        setRooms((current) => [
          ...current,
          newRoom,
        ]);
      } else {
        await fetchData();
      }

      setFormData({
        hostelId: "",
        roomNumber: "",
        floor: "",
        capacity: "",
        status: "AVAILABLE",
      });

      setShowAddRoom(false);
    } catch (err) {
      console.error("Add room error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to create room."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= STATUS STYLE ================= */

  const getStatusStyle = (status) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-50 text-green-700";

      case "OCCUPIED":
        return "bg-blue-50 text-blue-700";

      case "MAINTENANCE":
        return "bg-orange-50 text-orange-700";

      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">

      <div className="mx-auto w-full max-w-[1450px]">

        {/* ================= HEADER ================= */}

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <button
                type="button"
                onClick={() =>
                  navigate("/admin/hostels")
                }
                className="
                  mb-3
                  inline-flex
                  items-center
                  gap-1
                  text-sm
                  font-medium
                  text-blue-600
                  transition
                  hover:text-blue-800
                "
              >
                ← Back to Hostels
              </button>

              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Room Management
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage rooms, capacity and occupancy.
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                setShowAddRoom(true)
              }
              className="
                inline-flex
                h-11
                items-center
                justify-center
                rounded-xl
                bg-blue-600
                px-5
                text-sm
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-blue-700
              "
            >
              + Add Room
            </button>

          </div>

        </div>

        {/* ================= ERROR ================= */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">

            <p className="text-sm font-medium text-red-700">
              {error}
            </p>

          </div>
        )}

        {/* ================= SUMMARY ================= */}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <SummaryCard
            title="Total Rooms"
            value={rooms.length}
            description="Registered rooms"
            icon="🛏️"
          />

          <SummaryCard
            title="Available Rooms"
            value={availableRooms}
            description="Ready for allocation"
            icon="✓"
          />

          <SummaryCard
            title="Occupied Rooms"
            value={occupiedRooms}
            description="Currently occupied"
            icon="👥"
          />

          <SummaryCard
            title="Total Capacity"
            value={totalCapacity}
            description={`${totalOccupancy} currently occupied`}
            icon="📊"
          />

        </div>

        {/* ================= FILTERS ================= */}

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px]">

            {/* SEARCH */}

            <div>

              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Search Rooms
              </label>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search room number, hostel or floor..."
                className="
                  h-11
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  px-4
                  text-sm
                  text-slate-800
                  outline-none
                  transition
                  placeholder:text-slate-400
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-100
                "
              />

            </div>

            {/* HOSTEL FILTER */}

            <div>

              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Filter by Hostel
              </label>

              <select
                value={selectedHostel}
                onChange={(e) =>
                  setSelectedHostel(e.target.value)
                }
                className="
                  h-11
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-4
                  text-sm
                  text-slate-800
                  outline-none
                  transition
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-100
                "
              >

                <option value="ALL">
                  All Hostels
                </option>

                {hostels.map((hostel) => (
                  <option
                    key={getId(hostel)}
                    value={getId(hostel)}
                  >
                    {hostel.name}{" "}
                    {hostel.code
                      ? `(${hostel.code})`
                      : ""}
                  </option>
                ))}

              </select>

            </div>

          </div>

        </div>

        {/* ================= ROOM TABLE ================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {loading ? (

            <div className="p-14 text-center">

              <div className="
                mx-auto
                h-9
                w-9
                animate-spin
                rounded-full
                border-4
                border-blue-100
                border-t-blue-600
              " />

              <p className="mt-4 text-sm text-slate-500">
                Loading rooms...
              </p>

            </div>

          ) : filteredRooms.length === 0 ? (

            <div className="p-14 text-center">

              <div className="mb-3 text-4xl">
                🛏️
              </div>

              <h3 className="font-semibold text-slate-800">
                No rooms found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {search || selectedHostel !== "ALL"
                  ? "Try changing your filters."
                  : "No rooms are currently registered."}
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[950px]">

                <thead className="border-b border-slate-200 bg-slate-50">

                  <tr>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Room
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Hostel
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Floor
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Capacity
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Occupancy
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Available
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-100">

                  {filteredRooms.map((room) => {

                    const capacity =
                      Number(room.capacity || 0);

                    const occupancy =
                      Number(
                        room.currentOccupancy || 0
                      );

                    const available =
                      Math.max(
                        capacity - occupancy,
                        0
                      );

                    return (
                      <tr
                        key={getId(room)}
                        className="transition hover:bg-slate-50"
                      >

                        {/* ROOM */}

                        <td className="px-5 py-5">

                          <div className="flex items-center gap-3">

                            <div className="
                              flex
                              h-11
                              w-11
                              shrink-0
                              items-center
                              justify-center
                              rounded-xl
                              bg-blue-50
                              text-xl
                            ">
                              🛏️
                            </div>

                            <div>

                              <p className="font-semibold text-slate-800">
                                Room {room.roomNumber || "—"}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                Room ID: {getId(room)}
                              </p>

                            </div>

                          </div>

                        </td>

                        {/* HOSTEL */}

                        <td className="px-5 py-5">

                          <p className="text-sm font-semibold text-slate-700">
                            {getHostelName(room)}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {getHostelCode(room)}
                          </p>

                        </td>

                        {/* FLOOR */}

                        <td className="px-5 py-5">

                          <span className="
                            rounded-lg
                            bg-slate-100
                            px-3
                            py-1.5
                            text-xs
                            font-semibold
                            text-slate-700
                          ">
                            Floor {room.floor ?? "—"}
                          </span>

                        </td>

                        {/* CAPACITY */}

                        <td className="px-5 py-5">

                          <p className="text-sm font-semibold text-slate-800">
                            {capacity}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            Beds
                          </p>

                        </td>

                        {/* OCCUPANCY */}

                        <td className="px-5 py-5">

                          <p className="text-sm font-semibold text-slate-800">
                            {occupancy}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            Students
                          </p>

                        </td>

                        {/* AVAILABLE */}

                        <td className="px-5 py-5">

                          <span className="
                            inline-flex
                            rounded-full
                            bg-green-50
                            px-3
                            py-1
                            text-xs
                            font-semibold
                            text-green-700
                          ">
                            {available}{" "}
                            {available === 1
                              ? "Bed"
                              : "Beds"}
                          </span>

                        </td>

                        {/* STATUS */}

                        <td className="px-5 py-5">

                          <span
                            className={`
                              inline-flex
                              rounded-full
                              px-3
                              py-1
                              text-xs
                              font-semibold
                              ${getStatusStyle(
                                room.status
                              )}
                            `}
                          >
                            {room.status ||
                              "UNKNOWN"}
                          </span>

                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>

      {/* ================= ADD ROOM MODAL ================= */}

      {showAddRoom && (

        <div className="
          fixed
          inset-0
          z-[100]
          flex
          items-center
          justify-center
          bg-slate-950/50
          p-4
        ">

          <div className="
            w-full
            max-w-lg
            rounded-2xl
            border
            border-slate-200
            bg-white
            shadow-2xl
          ">

            {/* MODAL HEADER */}

            <div className="
              flex
              items-center
              justify-between
              border-b
              border-slate-200
              px-5
              py-4
            ">

              <div>

                <h2 className="text-lg font-bold text-slate-900">
                  Add New Room
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Create a room under a hostel.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowAddRoom(false)
                }
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-lg
                  text-lg
                  text-slate-400
                  transition
                  hover:bg-slate-100
                  hover:text-slate-700
                "
              >
                ×
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleAddRoom}
              className="space-y-5 p-5"
            >

              {/* HOSTEL */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Hostel
                </label>

                <select
                  name="hostelId"
                  value={formData.hostelId}
                  onChange={handleChange}
                  className="
                    h-11
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-4
                    text-sm
                    outline-none
                    transition
                    focus:border-blue-500
                    focus:ring-2
                    focus:ring-blue-100
                  "
                >

                  <option value="">
                    Select Hostel
                  </option>

                  {hostels.map((hostel) => (
                    <option
                      key={getId(hostel)}
                      value={getId(hostel)}
                    >
                      {hostel.name}{" "}
                      {hostel.code
                        ? `(${hostel.code})`
                        : ""}
                    </option>
                  ))}

                </select>

              </div>

              {/* ROOM NUMBER */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Room Number
                </label>

                <input
                  type="text"
                  name="roomNumber"
                  value={formData.roomNumber}
                  onChange={handleChange}
                  placeholder="e.g. 101"
                  className="
                    h-11
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    px-4
                    text-sm
                    outline-none
                    transition
                    focus:border-blue-500
                    focus:ring-2
                    focus:ring-blue-100
                  "
                />

              </div>

              {/* FLOOR + CAPACITY */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Floor
                  </label>

                  <input
                    type="number"
                    name="floor"
                    value={formData.floor}
                    onChange={handleChange}
                    placeholder="e.g. 1"
                    min="0"
                    className="
                      h-11
                      w-full
                      rounded-xl
                      border
                      border-slate-200
                      px-4
                      text-sm
                      outline-none
                      transition
                      focus:border-blue-500
                      focus:ring-2
                      focus:ring-blue-100
                    "
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Capacity
                  </label>

                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    placeholder="e.g. 2"
                    min="1"
                    className="
                      h-11
                      w-full
                      rounded-xl
                      border
                      border-slate-200
                      px-4
                      text-sm
                      outline-none
                      transition
                      focus:border-blue-500
                      focus:ring-2
                      focus:ring-blue-100
                    "
                  />

                </div>

              </div>

              {/* STATUS */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Status
                </label>

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="
                    h-11
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-4
                    text-sm
                    outline-none
                    transition
                    focus:border-blue-500
                    focus:ring-2
                    focus:ring-blue-100
                  "
                >

                  <option value="AVAILABLE">
                    Available
                  </option>

                  <option value="OCCUPIED">
                    Occupied
                  </option>

                  <option value="MAINTENANCE">
                    Maintenance
                  </option>

                </select>

              </div>

              {/* BUTTONS */}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={() =>
                    setShowAddRoom(false)
                  }
                  className="
                    h-11
                    rounded-xl
                    border
                    border-slate-200
                    px-5
                    text-sm
                    font-semibold
                    text-slate-600
                    transition
                    hover:bg-slate-50
                  "
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="
                    h-11
                    rounded-xl
                    bg-blue-600
                    px-5
                    text-sm
                    font-semibold
                    text-white
                    transition
                    hover:bg-blue-700
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >
                  {submitting
                    ? "Creating..."
                    : "Create Room"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

/* ================= SUMMARY CARD ================= */

function SummaryCard({
  title,
  value,
  description,
  icon,
}) {
  return (
    <div className="
      rounded-2xl
      border
      border-slate-200
      bg-white
      p-5
      shadow-sm
      transition
      hover:shadow-md
    ">

      <div className="flex items-start justify-between gap-3">

        <div>

          <p className="text-sm text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {value}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            {description}
          </p>

        </div>

        <div className="
          flex
          h-11
          w-11
          shrink-0
          items-center
          justify-center
          rounded-xl
          bg-blue-50
          text-xl
        ">
          {icon}
        </div>

      </div>

    </div>
  );
}

export default RoomManagement;