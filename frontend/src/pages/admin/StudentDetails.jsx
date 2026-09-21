import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";

function StudentDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        const response = await api.get(
          `/api/students/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setStudent(response.data.student);
      } catch (err) {
        console.error("Student details error:", err);

        setError(
          err.response?.data?.message ||
            "Unable to load student details."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [id]);

  const name =
    student?.userId?.name ||
    student?.name ||
    "Unknown Student";

  const email =
    student?.userId?.email ||
    student?.email ||
    "—";

  const phone =
    student?.userId?.phone ||
    student?.phone ||
    "—";

  const hostel =
    student?.hostelId?.name ||
    student?.hostel?.name ||
    "—";

  const room =
    student?.roomId?.roomNumber ||
    student?.room?.roomNumber ||
    "—";

  const floor =
    student?.roomId?.floor ||
    student?.room?.floor ||
    "—";

  const active =
    student?.userId?.isActive !== false;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-5 sm:px-6 lg:px-8">

        <div className="mx-auto w-full max-w-[1450px]">

          <div className="rounded-2xl border border-slate-200 bg-white p-14 text-center shadow-sm">

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
              Loading student details...
            </p>

          </div>

        </div>

      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-5 sm:px-6 lg:px-8">

        <div className="mx-auto w-full max-w-[1450px]">

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <button
              onClick={() =>
                navigate("/admin/students")
              }
              className="mb-5 text-sm font-semibold text-blue-600 hover:text-blue-800"
            >
              ← Back to Students
            </button>

            <div className="rounded-xl border border-red-200 bg-red-50 p-5">

              <h2 className="font-semibold text-red-800">
                Unable to load student
              </h2>

              <p className="mt-1 text-sm text-red-600">
                {error || "Student not found."}
              </p>

            </div>

          </div>

        </div>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">

      <div className="mx-auto w-full max-w-[1450px]">

        {/* HEADER */}

        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

          <button
            onClick={() =>
              navigate("/admin/students")
            }
            className="mb-4 text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            ← Back to Students
          </button>

          <div className="flex items-center gap-4">

            <div className="
              flex
              h-16
              w-16
              shrink-0
              items-center
              justify-center
              rounded-2xl
              bg-blue-100
              text-2xl
              font-bold
              text-blue-700
            ">
              {name.charAt(0).toUpperCase()}
            </div>

            <div>

              <div className="flex flex-wrap items-center gap-3">

                <h1 className="text-2xl font-bold text-slate-900">
                  {name}
                </h1>

                <span
                  className={`
                    rounded-full
                    px-3
                    py-1
                    text-xs
                    font-semibold
                    ${
                      active
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }
                  `}
                >
                  {active ? "Active" : "Inactive"}
                </span>

              </div>

              <p className="mt-1 text-sm text-slate-500">
                Student Profile • {student.sbuId || "—"}
              </p>

            </div>

          </div>

        </div>


        {/* DETAILS */}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

          {/* PERSONAL */}

          <section className="lg:col-span-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 p-5">

              <h2 className="text-lg font-bold text-slate-900">
                Personal Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Basic student information
              </p>

            </div>

            <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">

              <InfoItem
                label="Full Name"
                value={name}
              />

              <InfoItem
                label="SBU ID"
                value={student.sbuId || "—"}
              />

              <InfoItem
                label="Email"
                value={email}
              />

              <InfoItem
                label="Phone"
                value={phone}
              />

              <InfoItem
                label="Course"
                value={student.course || "—"}
              />

              <InfoItem
                label="Year"
                value={student.year || "—"}
              />

            </div>

          </section>


          {/* HOSTEL */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 p-5">

              <h2 className="text-lg font-bold text-slate-900">
                Hostel Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Current accommodation
              </p>

            </div>

            <div className="space-y-5 p-5">

              <InfoItem
                label="Hostel"
                value={hostel}
              />

              <InfoItem
                label="Room Number"
                value={room}
              />

              <InfoItem
                label="Floor"
                value={floor}
              />

              <InfoItem
                label="Status"
                value={active ? "Active Student" : "Inactive Student"}
              />

            </div>

          </section>


          {/* PARENT */}

          <section className="lg:col-span-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 p-5">

              <h2 className="text-lg font-bold text-slate-900">
                Parent / Guardian Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Registered parent contact details
              </p>

            </div>

            <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">

              <InfoItem
                label="Father / Guardian Name"
                value={student.fatherName || "—"}
              />

              <InfoItem
                label="Father / Guardian Mobile"
                value={student.fatherMobile || "—"}
              />

            </div>

          </section>


          {/* ACCOUNT */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 p-5">

              <h2 className="text-lg font-bold text-slate-900">
                Account Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                SBHMS account status
              </p>

            </div>

            <div className="space-y-5 p-5">

              <InfoItem
                label="Role"
                value={student.userId?.role || "STUDENT"}
              />

              <InfoItem
                label="Account Status"
                value={active ? "Active" : "Inactive"}
              />

            </div>

          </section>

        </div>

      </div>

    </div>
  );
}


// =====================================
// INFO ITEM
// =====================================

function InfoItem({ label, value }) {
  return (
    <div>

      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium text-slate-800">
        {value}
      </p>

    </div>
  );
}

export default StudentDetails;