import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function StudentManagement() {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // ================================
  // FETCH STUDENTS
  // ================================
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

  useEffect(() => {
    fetchStudents();
  }, []);

  // ================================
  // SEARCH
  // ================================
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

  // ================================
  // HELPERS
  // ================================
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

  // ================================
  // PAGE
  // ================================
  return (
    <div className="min-h-screen bg-slate-100 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">

      <div className="mx-auto w-full max-w-[1500px]">

        {/* ================================
            HEADER
        ================================= */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6 mb-5">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <button
                type="button"
                onClick={() => navigate("/admin")}
                className="
                  inline-flex
                  items-center
                  gap-1.5
                  mb-3
                  text-sm
                  font-medium
                  text-blue-600
                  hover:text-blue-800
                  transition
                "
              >
                ← Back to Dashboard
              </button>

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Student Management
              </h1>

              <p className="mt-1 text-sm sm:text-base text-slate-500">
                View and manage students registered in SBHMS.
              </p>

            </div>

            <button
              type="button"
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                self-start
                lg:self-center
                rounded-xl
                bg-blue-600
                px-5
                py-2.5
                text-sm
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-blue-700
              "
            >
              + Add Student
            </button>

          </div>

        </div>


        {/* ================================
            SUMMARY CARDS
        ================================= */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-5">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-sm font-medium text-slate-500">
              Total Students
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {students.length}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Registered students
            </p>

          </div>


          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-sm font-medium text-slate-500">
              Active Students
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {
                students.filter((student) =>
                  isActive(student)
                ).length
              }
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Currently active
            </p>

          </div>


          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-sm font-medium text-slate-500">
              Search Results
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-600">
              {filteredStudents.length}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Matching students
            </p>

          </div>

        </div>


        {/* ================================
            STUDENTS TABLE
        ================================= */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 p-5 sm:p-6">

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  Students
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  All registered hostel students
                </p>

              </div>


              <div className="w-full lg:w-80 xl:w-96">

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search name, SBU ID, course..."
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-300
                    bg-slate-50
                    px-4
                    py-2.5
                    text-sm
                    text-slate-800
                    outline-none
                    transition
                    placeholder:text-slate-400
                    focus:border-blue-500
                    focus:bg-white
                    focus:ring-2
                    focus:ring-blue-100
                  "
                />

              </div>

            </div>

          </div>


          {/* ERROR */}

          {error && (
            <div className="mx-5 mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-6">
              {error}
            </div>
          )}


          {/* LOADING */}

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
                Loading students...
              </p>

            </div>

          ) : filteredStudents.length === 0 ? (

            <div className="p-14 text-center">

              <div className="mb-3 text-4xl">
                👨‍🎓
              </div>

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

              <table className="w-full min-w-[950px]">

                <thead className="border-b border-slate-200 bg-slate-50">

                  <tr>

                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Student
                    </th>

                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      SBU ID
                    </th>

                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Course
                    </th>

                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Year
                    </th>

                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Hostel
                    </th>

                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Room
                    </th>

                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Action
                    </th>

                  </tr>

                </thead>


                <tbody className="divide-y divide-slate-100">

                  {filteredStudents.map((student) => (

                    <tr
                      key={student._id || student.id}
                      className="transition hover:bg-slate-50"
                    >

                      {/* STUDENT */}

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-3">

                          <div className="
                            flex
                            h-10
                            w-10
                            shrink-0
                            items-center
                            justify-center
                            rounded-full
                            bg-blue-100
                            font-semibold
                            text-blue-700
                          ">
                            {getStudentName(student)
                              .charAt(0)
                              .toUpperCase()}
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
                          className={`
                            inline-flex
                            rounded-full
                            px-3
                            py-1
                            text-xs
                            font-semibold
                            ${
                              isActive(student)
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-700"
                            }
                          `}
                        >
                          {isActive(student)
                            ? "Active"
                            : "Inactive"}
                        </span>

                      </td>


                      {/* VIEW */}

                      <td className="px-5 py-4">

                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/admin/students/${
                                student._id || student.id
                              }`
                            )
                          }
                          className="
                            rounded-lg
                            px-3
                            py-1.5
                            text-sm
                            font-semibold
                            text-blue-600
                            transition
                            hover:bg-blue-50
                            hover:text-blue-800
                          "
                        >
                          View
                        </button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </div>

    </div>
  );
}

export default StudentManagement;