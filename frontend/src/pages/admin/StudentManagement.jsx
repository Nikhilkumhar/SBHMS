import { useEffect, useMemo, useState } from "react";
import { portalBase } from "../../utils/roleHome";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function StudentManagement() {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingFormData, setLoadingFormData] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [creating, setCreating] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);

  // =========================================================
  // RESET PASSWORD STATE
  // =========================================================

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetStudent, setResetStudent] = useState(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState("");
  // Remove student
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removeStudent, setRemoveStudent] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState("");

  // Only admins can remove students
  const isAdmin =
    JSON.parse(sessionStorage.getItem("user") || "{}").role === "ADMIN";

  const [formData, setFormData] = useState({
    name: "",
    sbuId: "",
    email: "",
    phone: "",
    password: "",
    course: "",
    year: "",
    hostelId: "",
    roomId: "",
    fatherName: "",
    fatherMobile: "",
  });

  // =========================================================
  // FETCH STUDENTS
  // =========================================================

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const response = await api.get("/api/students", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setStudents(response.data.students || []);
    } catch (err) {
      console.error("Fetch students error:", err);

      setError(
        err.response?.data?.message ||
        "Unable to load students. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FETCH HOSTELS + ROOMS
  // =========================================================

  const fetchFormData = async () => {
    try {
      setLoadingFormData(true);

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

      setHostels(hostelResponse.data.hostels || []);
      setRooms(roomResponse.data.rooms || []);
    } catch (err) {
      console.error("Fetch hostel/room data error:", err);

      setError(
        err.response?.data?.message ||
        "Unable to load hostel and room information."
      );
    } finally {
      setLoadingFormData(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // =========================================================
  // SEARCH
  // =========================================================

  const filteredStudents = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return students;
    }

    return students.filter((student) => {
      const name =
        student.userId?.name ||
        student.name ||
        "";

      const sbuId = student.sbuId || "";
      const course = student.course || "";

      const hostel =
        student.hostelId?.name ||
        student.hostel?.name ||
        "";

      const room =
        student.roomId?.roomNumber ||
        student.room?.roomNumber ||
        "";

      return (
        name.toLowerCase().includes(value) ||
        sbuId.toLowerCase().includes(value) ||
        course.toLowerCase().includes(value) ||
        hostel.toLowerCase().includes(value) ||
        String(room).toLowerCase().includes(value)
      );
    });
  }, [students, search]);

  // =========================================================
  // HELPERS
  // =========================================================

  const getStudentName = (student) => {
    return (
      student.userId?.name ||
      student.name ||
      "Unknown Student"
    );
  };

  const getEmail = (student) => {
    return (
      student.userId?.email ||
      student.email ||
      "—"
    );
  };

  const getHostel = (student) => {
    return (
      student.hostelId?.name ||
      student.hostel?.name ||
      "—"
    );
  };

  const getRoom = (student) => {
    return (
      student.roomId?.roomNumber ||
      student.room?.roomNumber ||
      "—"
    );
  };

  const isActive = (student) => {
    return student.userId?.isActive !== false;
  };

  // =========================================================
  // OPEN ADD STUDENT MODAL
  // =========================================================

  const handleOpenAddStudent = async () => {
    setError("");
    setSuccess("");
    setCreatedCredentials(null);

    setFormData({
      name: "",
      sbuId: "",
      email: "",
      phone: "",
      password: "",
      course: "",
      year: "",
      hostelId: "",
      roomId: "",
      fatherName: "",
      fatherMobile: "",
    });

    setShowPassword(false);
    setShowAddModal(true);

    if (hostels.length === 0 || rooms.length === 0) {
      await fetchFormData();
    }
  };

  // =========================================================
  // CLOSE ADD STUDENT MODAL
  // =========================================================

  const handleCloseModal = () => {
    if (creating) return;

    setShowAddModal(false);
    setShowPassword(false);
    setCreatedCredentials(null);
    setError("");
  };

  // =========================================================
  // INPUT CHANGE
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]:
        name === "sbuId"
          ? value.toUpperCase()
          : value,
    }));

    setError("");
  };

  // =========================================================
  // AVAILABLE ROOMS
  // =========================================================

  const availableRooms = useMemo(() => {
    if (!formData.hostelId) {
      return [];
    }

    return rooms.filter((room) => {
      const roomHostelId =
        room.hostelId?._id ||
        room.hostelId;

      const belongsToHostel =
        String(roomHostelId) ===
        String(formData.hostelId);

      const isAvailable =
        Number(room.currentOccupancy || 0) <
        Number(room.capacity || 0);

      return belongsToHostel && isAvailable;
    });
  }, [rooms, formData.hostelId]);

  // =========================================================
  // CREATE STUDENT
  // =========================================================

  const handleCreateStudent = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // -------------------------
    // FRONTEND VALIDATION
    // -------------------------

    if (
      !formData.name ||
      !formData.sbuId ||
      !formData.email ||
      !formData.phone ||
      !formData.password ||
      !formData.course ||
      !formData.year ||
      !formData.hostelId ||
      !formData.roomId ||
      !formData.fatherName ||
      !formData.fatherMobile
    ) {
      setError("Please fill in all student details.");
      return;
    }

    if (formData.password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (String(formData.phone).length !== 10) {
      setError(
        "Student mobile number must be 10 digits."
      );
      return;
    }

    if (
      String(formData.fatherMobile).length !== 10
    ) {
      setError(
        "Father mobile number must be 10 digits."
      );
      return;
    }

    try {
      setCreating(true);

      const token = localStorage.getItem("token");

      const response = await api.post(
        "/api/students",
        {
          name: formData.name.trim(),
          sbuId: formData.sbuId.trim().toUpperCase(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          password: formData.password,
          course: formData.course.trim(),
          year: Number(formData.year),
          hostelId: formData.hostelId,
          roomId: formData.roomId,
          fatherName: formData.fatherName.trim(),
          fatherMobile: formData.fatherMobile.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Student created:", response.data);

      // Refresh student table
      await fetchStudents();

      // Show login credentials
      setCreatedCredentials({
        sbuId: formData.sbuId
          .trim()
          .toUpperCase(),

        password: formData.password,

        name: formData.name.trim(),
      });

      setSuccess(
        "Student account created successfully."
      );
    } catch (err) {
      console.error("Create student error:", err);

      setError(
        err.response?.data?.message ||
        "Unable to create student. Please try again."
      );
    } finally {
      setCreating(false);
    }
  };

  // =========================================================
  // COPY CREDENTIALS
  // =========================================================

  const handleCopyCredentials = async () => {
    if (!createdCredentials) return;

    const text = `SBHMS Student Login
Name: ${createdCredentials.name}
SBU ID: ${createdCredentials.sbuId}
Password: ${createdCredentials.password}`;

    try {
      await navigator.clipboard.writeText(text);

      setSuccess(
        "Student login credentials copied."
      );
    } catch (error) {
      console.error(
        "Copy credentials error:",
        error
      );
    }
  };

  // =========================================================
  // REMOVE STUDENT
  // =========================================================

  const handleOpenRemoveModal = (student) => {
    setRemoveStudent(student);
    setRemoveError("");
    setSuccess("");
    setShowRemoveModal(true);
  };

  const handleCloseRemoveModal = () => {
    if (removing) return;

    setShowRemoveModal(false);
    setRemoveStudent(null);
    setRemoveError("");
  };

  const handleRemoveStudent = async () => {
    const studentId = removeStudent?._id || removeStudent?.id;

    if (!studentId) {
      setRemoveError("Student ID not found.");
      return;
    }

    try {
      setRemoving(true);
      setRemoveError("");

      const response = await api.delete(`/api/students/${studentId}`);

      setSuccess(
        response.data.message || "Student removed successfully."
      );

      setShowRemoveModal(false);
      setRemoveStudent(null);

      await fetchStudents();
    } catch (err) {
      console.error("Remove student error:", err);

      setRemoveError(
        err.response?.data?.message || "Unable to remove student."
      );
    } finally {
      setRemoving(false);
    }
  };

  // =========================================================
  // OPEN RESET PASSWORD MODAL
  // =========================================================

  const handleOpenResetModal = (student) => {
    setResetStudent(student);
    setResetPassword("");
    setResetSuccess("");
    setError("");
    setShowResetModal(true);
  };

  // =========================================================
  // CLOSE RESET PASSWORD MODAL
  // =========================================================

  const handleCloseResetModal = () => {
    if (resetting) return;

    setShowResetModal(false);
    setResetStudent(null);
    setResetPassword("");
    setResetSuccess("");
    setError("");
  };

  // =========================================================
  // RESET STUDENT PASSWORD
  // =========================================================

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setError("");
    setResetSuccess("");

    if (!resetPassword) {
      setError("Please enter a new password.");
      return;
    }

    if (resetPassword.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    const studentId =
      resetStudent?._id ||
      resetStudent?.id;

    if (!studentId) {
      setError("Student ID not found.");
      return;
    }

    try {
      setResetting(true);

      const token = localStorage.getItem("token");

      const response = await api.put(
        `/api/students/${studentId}/reset-password`,
        {
          password: resetPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setResetSuccess(
        response.data.message ||
        "Student password reset successfully."
      );

      setResetPassword("");
    } catch (err) {
      console.error(
        "Reset student password error:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Unable to reset student password."
      );
    } finally {
      setResetting(false);
    }
  };

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1500px]">
        {/* ================= HEADER ================= */}

        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <button
                type="button"
                onClick={() => navigate(isAdmin ? "/admin" : "/warden")}
                className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 transition hover:text-blue-800"
              >
                ← Back to Dashboard
              </button>

              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Student Management
              </h1>

              <p className="mt-1 text-sm text-slate-500 sm:text-base">
                View and manage students registered in SBHMS.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddStudent}
              className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 lg:self-center"
            >
              + Add Student
            </button>
          </div>
        </div>

        {/* ================= SUCCESS ================= */}

        {success && !(showAddModal || showResetModal || showRemoveModal) && (
          <div className="rounded-xl border px-4 py-3 text-sm border-green-200 bg-green-50 text-green-700 mb-5">
{success}
</div>
        )}

        {/* ================= SUMMARY ================= */}

        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Students
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {students.length}
            </p>
            <p className="mt-1 text-xs text-slate-400">Registered students</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Active Students
            </p>
            <p className="mt-2 text-3xl font-bold text-green-600">
              {students.filter((student) => isActive(student)).length}
            </p>
            <p className="mt-1 text-xs text-slate-400">Currently active</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Search Results
            </p>
            <p className="mt-2 text-3xl font-bold text-blue-600">
              {filteredStudents.length}
            </p>
            <p className="mt-1 text-xs text-slate-400">Matching students</p>
          </div>
        </div>

        {/* ================= STUDENT TABLE ================= */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Students</h2>
                <p className="mt-1 text-sm text-slate-500">
                  All registered hostel students
                </p>
              </div>

              <div className="w-full lg:w-80 xl:w-96">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, SBU ID, course..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          {error && !(showAddModal || showResetModal || showRemoveModal) && (
            <div className="rounded-xl border px-4 py-3 text-sm border-red-200 bg-red-50 text-red-700 mx-5 mt-5 sm:mx-6">
{error}
</div>
          )}

          {loading ? (
            <div className="p-14 text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
              <p className="mt-4 text-sm text-slate-500">Loading students...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-14 text-center">
              <div className="mb-3 text-4xl">👨‍🎓</div>

              <h3 className="font-semibold text-slate-800">
                No students found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {search
                  ? "Try a different search."
                  : "No students are currently registered."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1150px]">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    {["Student", "SBU ID", "Course", "Year", "Hostel", "Room", "Status", "Action"].map((heading) => (
                      <th
                        key={heading}
                        className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student) => (
                    <tr
                      key={(student._id || student.id)}
                      className="transition hover:bg-slate-50"
                    >
                      {/* STUDENT */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                            {getStudentName(student).charAt(0).toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-800">
                              {getStudentName(student)}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {getEmail(student)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* SBU ID */}
                      <td className="px-5 py-4">
                        <span className="font-medium text-slate-700">
                          {student.sbuId || "—"}
                        </span>
                      </td>

                      {/* COURSE */}
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {student.course || "—"}
                      </td>

                      {/* YEAR */}
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {student.year || "—"}
                      </td>

                      {/* HOSTEL */}
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {getHostel(student)}
                      </td>

                      {/* ROOM */}
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {getRoom(student)}
                      </td>

                      {/* STATUS */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            isActive(student)
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {isActive(student) ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* ACTION */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`${portalBase()}/students/${getId(student)}`)
                            }
                            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 hover:text-blue-800"
                          >
                            View
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenResetModal(student)}
                            className="rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
                          >
                            Reset Password
                          </button>

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleOpenRemoveModal(student)}
                              className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* =====================================================
          ADD STUDENT MODAL
      ===================================================== */}

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* MODAL HEADER */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Add New Student
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Create the student's SBHMS account and hostel profile.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                disabled={creating}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            {createdCredentials ? (
              /* ---------- CREDENTIALS SCREEN ---------- */
              <div className="p-6">
                <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
                  <div className="mb-5">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-xl">
                      ✓
                    </div>

                    <h3 className="text-xl font-bold text-green-800">
                      Student Created Successfully
                    </h3>

                    <p className="mt-1 text-sm text-green-700">
                      Give these login credentials to the student.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-xl border border-green-200 bg-white p-4">
                      <p className="text-xs font-medium text-slate-500">
                        Student Name
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {createdCredentials.name}
                      </p>
                    </div>

                    <div className="rounded-xl border border-green-200 bg-white p-4">
                      <p className="text-xs font-medium text-slate-500">
                        SBU ID / User ID
                      </p>
                      <p className="mt-1 font-mono text-lg font-bold text-blue-700">
                        {createdCredentials.sbuId}
                      </p>
                    </div>

                    <div className="rounded-xl border border-green-200 bg-white p-4">
                      <p className="text-xs font-medium text-slate-500">
                        Password
                      </p>
                      <p className="mt-1 font-mono text-lg font-bold text-slate-900">
                        {createdCredentials.password}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={handleCopyCredentials}
                      className="flex-1 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      Copy Login Credentials
                    </button>

                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* ---------- FORM ---------- */
              <form onSubmit={handleCreateStudent} className="p-6">
                {error && <div className="rounded-xl border px-4 py-3 text-sm border-red-200 bg-red-50 text-red-700 mb-6">
{error}
</div>}

                {loadingFormData ? (
                  <div className="py-16 text-center">
                    <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
                    <p className="mt-4 text-sm text-slate-500">
                      Loading hostels and rooms...
                    </p>
                  </div>
                ) : (
                  <>
                    {/* STUDENT INFORMATION */}
                    <div className="mb-7">
                      <h3 className="mb-4 text-base font-bold text-slate-900">
                        Student Information
                      </h3>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
<label className="mb-2 block text-sm font-semibold text-slate-700">Student Name *</label>
                          <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter full name"
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                          />
                        </div>

                        <div>
<label className="mb-2 block text-sm font-semibold text-slate-700">SBU ID / User ID *</label>
                          <input
                            name="sbuId"
                            value={formData.sbuId}
                            onChange={handleChange}
                            placeholder="Example: SBU2026003"
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 uppercase"
                          />
                        </div>

                        <div>
<label className="mb-2 block text-sm font-semibold text-slate-700">Email *</label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="student@sbu.ac.in"
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                          />
                        </div>

                        <div>
<label className="mb-2 block text-sm font-semibold text-slate-700">Student Mobile *</label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            maxLength={10}
                            placeholder="10 digit mobile number"
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                          />
                        </div>

                        <div>
<label className="mb-2 block text-sm font-semibold text-slate-700">Login Password *</label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              name="password"
                              value={formData.password}
                              onChange={handleChange}
                              placeholder="Minimum 6 characters"
                              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 pr-16"
                            />

                            <button
                              type="button"
                              onClick={() => setShowPassword((value) => !value)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-blue-600"
                            >
                              {showPassword ? "Hide" : "Show"}
                            </button>
                          </div>
                        </div>

                        <div>
<label className="mb-2 block text-sm font-semibold text-slate-700">Course *</label>
                          <input
                            name="course"
                            value={formData.course}
                            onChange={handleChange}
                            placeholder="Example: MCA"
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                          />
                        </div>

                        <div>
<label className="mb-2 block text-sm font-semibold text-slate-700">Year *</label>
                          <select
                            name="year"
                            value={formData.year}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-white"
                          >
                            <option value="">Select year</option>
                            <option value="1">Year 1</option>
                            <option value="2">Year 2</option>
                            <option value="3">Year 3</option>
                            <option value="4">Year 4</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* HOSTEL ALLOCATION */}
                    <div className="mb-7">
                      <h3 className="mb-4 text-base font-bold text-slate-900">
                        Hostel Allocation
                      </h3>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
<label className="mb-2 block text-sm font-semibold text-slate-700">Hostel *</label>
                          <select
                            name="hostelId"
                            value={formData.hostelId}
                            onChange={(e) => {
                              setFormData((previous) => ({
                                ...previous,
                                hostelId: e.target.value,
                                roomId: "",
                              }));
                              setError("");
                            }}
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-white"
                          >
                            <option value="">Select hostel</option>

                            {hostels.map((hostel) => (
                              <option key={hostel._id} value={hostel._id}>
                                {hostel.name}
                                {hostel.code ? ` (${hostel.code})` : ""}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
<label className="mb-2 block text-sm font-semibold text-slate-700">Room *</label>
                          <select
                            name="roomId"
                            value={formData.roomId}
                            onChange={handleChange}
                            disabled={!formData.hostelId}
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
                          >
                            <option value="">
                              {!formData.hostelId
                                ? "Select hostel first"
                                : availableRooms.length === 0
                                ? "No available rooms"
                                : "Select room"}
                            </option>

                            {availableRooms.map((room) => (
                              <option key={room._id} value={room._id}>
                                Room {room.roomNumber} — Floor {room.floor} —{" "}
                                {room.currentOccupancy} / {room.capacity}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* PARENT DETAILS */}
                    <div className="mb-7">
                      <h3 className="mb-4 text-base font-bold text-slate-900">
                        Parent / Guardian Information
                      </h3>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
<label className="mb-2 block text-sm font-semibold text-slate-700">Father Name *</label>
                          <input
                            name="fatherName"
                            value={formData.fatherName}
                            onChange={handleChange}
                            placeholder="Enter father name"
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                          />
                        </div>

                        <div>
<label className="mb-2 block text-sm font-semibold text-slate-700">Father Mobile *</label>
                          <input
                            type="tel"
                            name="fatherMobile"
                            value={formData.fatherMobile}
                            onChange={handleChange}
                            maxLength={10}
                            placeholder="10 digit mobile number"
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                          />
                        </div>
                      </div>
                    </div>

                    {/* BUTTONS */}
                    <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        disabled={creating}
                        className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={creating}
                        className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {creating ? "Creating Student..." : "Create Student"}
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}
          </div>
        </div>
      )}

      {/* =====================================================
          RESET PASSWORD MODAL
      ===================================================== */}

      {showResetModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Reset Student Password
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Set a new login password for the student.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseResetModal}
                disabled={resetting}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-6">
              <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">Student</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {resetStudent ? getStudentName(resetStudent) : "—"}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {resetStudent?.sbuId || "—"}
                </p>
              </div>

              {error && <div className="rounded-xl border px-4 py-3 text-sm border-red-200 bg-red-50 text-red-700 mb-5">
{error}
</div>}

              {resetSuccess && (
                <div className="rounded-xl border px-4 py-3 text-sm border-green-200 bg-green-50 text-green-700 mb-5">
{resetSuccess}
</div>
              )}

              <div className="mb-6">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  New Password
                </label>

                <input
                  type="password"
                  value={resetPassword}
                  onChange={(e) => {
                    setResetPassword(e.target.value);
                    setError("");
                    setResetSuccess("");
                  }}
                  placeholder="Minimum 6 characters"
                  disabled={resetting}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition disabled:cursor-not-allowed disabled:bg-slate-100"
                />

                <p className="mt-2 text-xs text-slate-400">
                  The password will be securely hashed before it is stored.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleCloseResetModal}
                  disabled={resetting}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={resetting}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {resetting ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          REMOVE STUDENT MODAL
      ===================================================== */}

      {showRemoveModal && removeStudent && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900">
              Remove student?
            </h3>

            <p className="mt-3 text-sm text-slate-600">
              You are about to remove{" "}
              <span className="font-semibold">
                {getStudentName(removeStudent)}
              </span>{" "}
              ({removeStudent.sbuId}).
            </p>

            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-500">
              <li>Their login will stop working immediately.</li>
              <li>Their room bed will be freed.</li>
              <li>Unused gate passes will be cancelled.</li>
              <li>Attendance and movement history is kept.</li>
            </ul>

            {removeError && <div className="rounded-xl border px-4 py-3 text-sm border-red-200 bg-red-50 text-red-700 mt-4">
{removeError}
</div>}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseRemoveModal}
                disabled={removing}
                className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleRemoveStudent}
                disabled={removing}
                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {removing ? "Removing..." : "Yes, Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentManagement;