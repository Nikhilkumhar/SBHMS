import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function HostelManagement() {
  const navigate = useNavigate();

  const [hostels, setHostels] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [hostelSearch, setHostelSearch] = useState("");
  const [roomSearch, setRoomSearch] = useState("");
  const [roomHostelFilter, setRoomHostelFilter] = useState("ALL");

  const [showAddHostel, setShowAddHostel] = useState(false);
  const [showAddRoom, setShowAddRoom] = useState(false);

  const [hostelForm, setHostelForm] = useState({
    name: "",
    code: "",
    description: "",
  });

  const [roomForm, setRoomForm] = useState({
    hostelId: "",
    roomNumber: "",
    floor: "",
    capacity: "",
  });

  const [submittingHostel, setSubmittingHostel] = useState(false);
  const [submittingRoom, setSubmittingRoom] = useState(false);

  // =================================================
  // FETCH DATA
  // =================================================

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

      const [hostelResponse, roomResponse] = await Promise.all([
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
      console.error("Hostel management error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load hostel and room information."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // =================================================
  // HELPERS
  // =================================================

  const getHostelId = (hostel) => {
    return hostel?._id || hostel?.id;
  };

  const getRoomId = (room) => {
    return room?._id || room?.id;
  };

  const getRoomHostelId = (room) => {
    return (
      room?.hostelId?._id ||
      room?.hostelId?.id ||
      room?.hostelId
    );
  };

  const getHostelRooms = (hostel) => {
    const hostelId = getHostelId(hostel);

    return rooms.filter(
      (room) =>
        String(getRoomHostelId(room)) === String(hostelId)
    );
  };

  const getCapacity = (hostel) => {
    return getHostelRooms(hostel).reduce(
      (total, room) =>
        total + Number(room.capacity || 0),
      0
    );
  };

  const getOccupancy = (hostel) => {
    return getHostelRooms(hostel).reduce(
      (total, room) =>
        total + Number(room.currentOccupancy || 0),
      0
    );
  };

  // =================================================
  // HOSTEL SEARCH
  // =================================================

  const filteredHostels = useMemo(() => {
    const value = hostelSearch.trim().toLowerCase();

    if (!value) {
      return hostels;
    }

    return hostels.filter((hostel) => {
      const name = hostel.name || "";
      const code = hostel.code || "";
      const description = hostel.description || "";

      return (
        name.toLowerCase().includes(value) ||
        code.toLowerCase().includes(value) ||
        description.toLowerCase().includes(value)
      );
    });
  }, [hostels, hostelSearch]);

  // =================================================
  // ROOM SEARCH / FILTER
  // =================================================

  const filteredRooms = useMemo(() => {
    const value = roomSearch.trim().toLowerCase();

    return rooms.filter((room) => {
      const roomNumber = String(room.roomNumber || "");
      const floor = String(room.floor || "");

      const hostelName =
        room.hostelId?.name || "";

      const hostelCode =
        room.hostelId?.code || "";

      const matchesSearch =
        !value ||
        roomNumber.toLowerCase().includes(value) ||
        floor.toLowerCase().includes(value) ||
        hostelName.toLowerCase().includes(value) ||
        hostelCode.toLowerCase().includes(value);

      const matchesHostel =
        roomHostelFilter === "ALL" ||
        String(getRoomHostelId(room)) ===
          String(roomHostelFilter);

      return matchesSearch && matchesHostel;
    });
  }, [rooms, roomSearch, roomHostelFilter]);

  // =================================================
  // SUMMARY
  // =================================================

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

  const totalAvailableBeds =
    totalCapacity - totalOccupancy;

  // =================================================
  // HOSTEL FORM
  // =================================================

  const handleHostelChange = (e) => {
    setHostelForm({
      ...hostelForm,
      [e.target.name]: e.target.value,
    });

    setError("");
  };

  const handleAddHostel = async (e) => {
    e.preventDefault();

    if (!hostelForm.name.trim()) {
      setError("Hostel name is required.");
      return;
    }

    if (!hostelForm.code.trim()) {
      setError("Hostel code is required.");
      return;
    }

    try {
      setSubmittingHostel(true);
      setError("");

      const token = localStorage.getItem("token");

      const response = await api.post(
        "/api/hostels",
        {
          name: hostelForm.name.trim(),
          code: hostelForm.code.trim(),
          description: hostelForm.description.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const newHostel =
        response.data?.hostel ||
        response.data?.data;

      if (newHostel) {
        setHostels((current) => [
          ...current,
          newHostel,
        ]);
      } else {
        await fetchData();
      }

      setHostelForm({
        name: "",
        code: "",
        description: "",
      });

      setShowAddHostel(false);
    } catch (err) {
      console.error("Add hostel error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to create hostel."
      );
    } finally {
      setSubmittingHostel(false);
    }
  };

  // =================================================
  // ROOM FORM
  // =================================================

  const handleRoomChange = (e) => {
    setRoomForm({
      ...roomForm,
      [e.target.name]: e.target.value,
    });

    setError("");
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();

    if (!roomForm.hostelId) {
      setError("Please select a hostel.");
      return;
    }

    if (!roomForm.roomNumber.trim()) {
      setError("Room number is required.");
      return;
    }

    if (
      roomForm.floor === "" ||
      Number(roomForm.floor) < 0
    ) {
      setError("Please enter a valid floor.");
      return;
    }

    if (
      roomForm.capacity === "" ||
      Number(roomForm.capacity) <= 0
    ) {
      setError(
        "Room capacity must be greater than 0."
      );
      return;
    }

    try {
      setSubmittingRoom(true);
      setError("");

      const token = localStorage.getItem("token");

      const response = await api.post(
        "/api/rooms",
        {
          hostelId: roomForm.hostelId,
          roomNumber: roomForm.roomNumber.trim(),
          floor: Number(roomForm.floor),
          capacity: Number(roomForm.capacity),
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
        // The create API returns the room without
        // populated hostel information, so refresh
        // the room list to get complete data.
        await fetchData();
      } else {
        await fetchData();
      }

      setRoomForm({
        hostelId: "",
        roomNumber: "",
        floor: "",
        capacity: "",
      });

      setShowAddRoom(false);
    } catch (err) {
      console.error("Add room error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to create room."
      );
    } finally {
      setSubmittingRoom(false);
    }
  };

  // =================================================
  // UI
  // =================================================

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
      <div className="mx-auto w-full max-w-[1450px]">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <button
                type="button"
                onClick={() => navigate("/admin")}
                className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition hover:text-blue-800"
              >
                ← Back to Dashboard
              </button>

              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Hostels & Rooms
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage hostel buildings, rooms,
                capacity and occupancy.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setShowAddHostel(true);
                }}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-blue-200 bg-white px-5 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
              >
                + Add Hostel
              </button>

              <button
                type="button"
                onClick={() => {
                  setError("");
                  setShowAddRoom(true);
                }}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                + Add Room
              </button>
            </div>

          </div>
        </div>

        {/* ================================================= */}
        {/* ERROR */}
        {/* ================================================= */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-700">
              {error}
            </p>
          </div>
        )}

        {/* ================================================= */}
        {/* SUMMARY */}
        {/* ================================================= */}

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">

          <SummaryCard
            title="Total Hostels"
            value={hostels.length}
            description="Registered hostels"
            icon="🏢"
          />

          <SummaryCard
            title="Total Rooms"
            value={rooms.length}
            description="Registered rooms"
            icon="🛏️"
          />

          <SummaryCard
            title="Room Capacity"
            value={totalCapacity}
            description="Total beds"
            icon="👥"
          />

          <SummaryCard
            title="Occupancy"
            value={totalOccupancy}
            description="Students assigned"
            icon="📊"
          />

          <SummaryCard
            title="Available Beds"
            value={totalAvailableBeds}
            description="Beds currently available"
            icon="✓"
          />

        </div>

        {/* ================================================= */}
        {/* HOSTEL LIST */}
        {/* ================================================= */}

        <section className="mb-8">

          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Hostel Buildings
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Manage registered hostel buildings.
              </p>
            </div>

            <div className="w-full sm:w-80">
              <input
                type="text"
                value={hostelSearch}
                onChange={(e) =>
                  setHostelSearch(e.target.value)
                }
                placeholder="Search hostel..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            {loading ? (
              <LoadingState text="Loading hostels..." />
            ) : filteredHostels.length === 0 ? (
              <EmptyState
                icon="🏢"
                title="No hostels found"
                description={
                  hostelSearch
                    ? "Try a different search."
                    : "No hostels are currently registered."
                }
              />
            ) : (
              <div className="overflow-x-auto">

                <table className="w-full min-w-[900px]">

                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <TableHead>Hostel</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Rooms</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Occupancy</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Description</TableHead>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {filteredHostels.map((hostel) => {
                      const hostelRooms =
                        getHostelRooms(hostel);

                      const capacity =
                        getCapacity(hostel);

                      const occupancy =
                        getOccupancy(hostel);

                      const available =
                        capacity - occupancy;

                      return (
                        <tr
                          key={getHostelId(hostel)}
                          className="transition hover:bg-slate-50"
                        >

                          <td className="px-5 py-5">
                            <div className="flex items-center gap-3">

                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl">
                                🏢
                              </div>

                              <div>
                                <p className="font-semibold text-slate-800">
                                  {hostel.name ||
                                    "Unnamed Hostel"}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  Hostel Building
                                </p>
                              </div>

                            </div>
                          </td>

                          <td className="px-5 py-5">
                            <span className="inline-flex rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                              {hostel.code || "—"}
                            </span>
                          </td>

                          <td className="px-5 py-5">
                            <p className="text-sm font-semibold text-slate-800">
                              {hostelRooms.length}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              Rooms
                            </p>
                          </td>

                          <td className="px-5 py-5">
                            <p className="text-sm font-semibold text-slate-800">
                              {capacity}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              Beds
                            </p>
                          </td>

                          <td className="px-5 py-5">
                            <p className="text-sm font-semibold text-slate-800">
                              {occupancy}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              Students
                            </p>
                          </td>

                          <td className="px-5 py-5">
                            <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                              {available}
                            </span>
                          </td>

                          <td className="max-w-xs px-5 py-5">
                            <p className="truncate text-sm text-slate-600">
                              {hostel.description || "—"}
                            </p>
                          </td>

                        </tr>
                      );
                    })}

                  </tbody>

                </table>

              </div>
            )}

          </div>

        </section>

        {/* ================================================= */}
        {/* ROOM MANAGEMENT */}
        {/* ================================================= */}

        <section>

          <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Room Management
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Add and manage rooms across Hostel 1,
                Hostel 2 and Hostel 3.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">

              <select
                value={roomHostelFilter}
                onChange={(e) =>
                  setRoomHostelFilter(e.target.value)
                }
                className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="ALL">
                  All Hostels
                </option>

                {hostels.map((hostel) => (
                  <option
                    key={getHostelId(hostel)}
                    value={getHostelId(hostel)}
                  >
                    {hostel.name}{" "}
                    {hostel.code
                      ? `(${hostel.code})`
                      : ""}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={roomSearch}
                onChange={(e) =>
                  setRoomSearch(e.target.value)
                }
                placeholder="Search room..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-72"
              />

            </div>

          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            {loading ? (
              <LoadingState text="Loading rooms..." />
            ) : filteredRooms.length === 0 ? (
              <EmptyState
                icon="🛏️"
                title="No rooms found"
                description={
                  roomSearch ||
                  roomHostelFilter !== "ALL"
                    ? "Try changing the search or hostel filter."
                    : "No rooms are currently registered."
                }
              />
            ) : (
              <div className="overflow-x-auto">

                <table className="w-full min-w-[1000px]">

                  <thead className="border-b border-slate-200 bg-slate-50">

                    <tr>
                      <TableHead>Room</TableHead>
                      <TableHead>Hostel</TableHead>
                      <TableHead>Floor</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Occupancy</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Status</TableHead>
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

                      const status =
                        room.status ||
                        (available === 0
                          ? "FULL"
                          : "AVAILABLE");

                      return (
                        <tr
                          key={getRoomId(room)}
                          className="transition hover:bg-slate-50"
                        >

                          {/* ROOM */}

                          <td className="px-5 py-5">

                            <div className="flex items-center gap-3">

                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg">
                                🛏️
                              </div>

                              <div>
                                <p className="font-semibold text-slate-800">
                                  Room{" "}
                                  {room.roomNumber ||
                                    "—"}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  Room Number
                                </p>
                              </div>

                            </div>

                          </td>

                          {/* HOSTEL */}

                          <td className="px-5 py-5">

                            <p className="text-sm font-semibold text-slate-800">
                              {room.hostelId?.name ||
                                "—"}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {room.hostelId?.code ||
                                "—"}
                            </p>

                          </td>

                          {/* FLOOR */}

                          <td className="px-5 py-5">

                            <span className="inline-flex rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                              Floor{" "}
                              {room.floor ?? "—"}
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

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                available > 0
                                  ? "bg-green-50 text-green-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {available}{" "}
                              {available === 1
                                ? "bed"
                                : "beds"}
                            </span>

                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-5">

                            <StatusBadge
                              status={status}
                            />

                          </td>

                        </tr>
                      );
                    })}

                  </tbody>

                </table>

              </div>
            )}

          </div>

        </section>

      </div>

      {/* ================================================= */}
      {/* ADD HOSTEL MODAL */}
      {/* ================================================= */}

      {showAddHostel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4">

          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Add New Hostel
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Register a hostel building in SBHMS.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowAddHostel(false)
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={handleAddHostel}
              className="space-y-5 p-5"
            >

              <FormInput
                label="Hostel Name"
                name="name"
                value={hostelForm.name}
                onChange={handleHostelChange}
                placeholder="e.g. Hostel 1"
              />

              <FormInput
                label="Hostel Code"
                name="code"
                value={hostelForm.code}
                onChange={handleHostelChange}
                placeholder="e.g. H1"
                uppercase
              />

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Description
                  <span className="ml-1 font-normal text-slate-400">
                    (Optional)
                  </span>
                </label>

                <textarea
                  name="description"
                  value={hostelForm.description}
                  onChange={handleHostelChange}
                  rows="3"
                  placeholder="Enter hostel description..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <ModalButtons
                onCancel={() =>
                  setShowAddHostel(false)
                }
                submitting={submittingHostel}
                submitText="Create Hostel"
                loadingText="Creating..."
              />

            </form>

          </div>

        </div>
      )}

      {/* ================================================= */}
      {/* ADD ROOM MODAL */}
      {/* ================================================= */}

      {showAddRoom && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4">

          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Add New Room
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Assign a room to a hostel building.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowAddRoom(false)
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
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
                  Assign Hostel
                </label>

                <select
                  name="hostelId"
                  value={roomForm.hostelId}
                  onChange={handleRoomChange}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >

                  <option value="">
                    Select Hostel
                  </option>

                  {hostels.map((hostel) => (
                    <option
                      key={getHostelId(hostel)}
                      value={getHostelId(hostel)}
                    >
                      {hostel.name}
                      {hostel.code
                        ? ` (${hostel.code})`
                        : ""}
                    </option>
                  ))}

                </select>

              </div>

              {/* ROOM NUMBER */}

              <FormInput
                label="Room Number"
                name="roomNumber"
                value={roomForm.roomNumber}
                onChange={handleRoomChange}
                placeholder="e.g. 101"
              />

              {/* FLOOR */}

              <FormInput
                label="Floor"
                name="floor"
                type="number"
                value={roomForm.floor}
                onChange={handleRoomChange}
                placeholder="e.g. 1"
                min="0"
              />

              {/* CAPACITY */}

              <FormInput
                label="Room Capacity"
                name="capacity"
                type="number"
                value={roomForm.capacity}
                onChange={handleRoomChange}
                placeholder="e.g. 3"
                min="1"
              />

              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">

                <p className="text-xs font-semibold text-blue-800">
                  Occupancy
                </p>

                <p className="mt-1 text-sm text-blue-700">
                  New rooms start with{" "}
                  <span className="font-bold">
                    0 students
                  </span>
                  . Occupancy will increase automatically
                  when students are assigned to the room.
                </p>

              </div>

              <ModalButtons
                onCancel={() =>
                  setShowAddRoom(false)
                }
                submitting={submittingRoom}
                submitText="Create Room"
                loadingText="Creating..."
              />

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

// =================================================
// SUMMARY CARD
// =================================================

function SummaryCard({
  title,
  value,
  description,
  icon,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">

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

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl">
          {icon}
        </div>

      </div>

    </div>
  );
}

// =================================================
// TABLE HEAD
// =================================================

function TableHead({ children }) {
  return (
    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

// =================================================
// STATUS BADGE
// =================================================

function StatusBadge({ status }) {
  const styles = {
    AVAILABLE:
      "bg-green-50 text-green-700",
    FULL:
      "bg-red-50 text-red-700",
    MAINTENANCE:
      "bg-amber-50 text-amber-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] ||
        "bg-slate-100 text-slate-700"
      }`}
    >
      {status || "AVAILABLE"}
    </span>
  );
}

// =================================================
// FORM INPUT
// =================================================

function FormInput({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  uppercase = false,
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        className={`h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
          uppercase ? "uppercase" : ""
        }`}
      />

    </div>
  );
}

// =================================================
// MODAL BUTTONS
// =================================================

function ModalButtons({
  onCancel,
  submitting,
  submitText,
  loadingText,
}) {
  return (
    <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">

      <button
        type="button"
        onClick={onCancel}
        className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
      >
        Cancel
      </button>

      <button
        type="submit"
        disabled={submitting}
        className="h-11 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting
          ? loadingText
          : submitText}
      </button>

    </div>
  );
}

// =================================================
// LOADING
// =================================================

function LoadingState({ text }) {
  return (
    <div className="p-14 text-center">

      <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

      <p className="mt-4 text-sm text-slate-500">
        {text}
      </p>

    </div>
  );
}

// =================================================
// EMPTY
// =================================================

function EmptyState({
  icon,
  title,
  description,
}) {
  return (
    <div className="p-14 text-center">

      <div className="mb-3 text-4xl">
        {icon}
      </div>

      <h3 className="font-semibold text-slate-800">
        {title}
      </h3>

      <p className="mt-1 text-sm text-slate-500">
        {description}
      </p>

    </div>
  );
}

export default HostelManagement;