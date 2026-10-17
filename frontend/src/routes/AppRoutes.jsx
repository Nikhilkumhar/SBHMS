import { BrowserRouter, Routes, Route } from "react-router-dom";

/* ================= PUBLIC ================= */
import Home from "../pages/public/Home";

/* ================= AUTH ================= */
import Login from "../pages/auth/Login";
import StudentLogin from "../pages/auth/StudentLogin";
import StaffLogin from "../pages/auth/StaffLogin";
import AdminLogin from "../pages/auth/AdminLogin";

/* ================= SHARED ================= */
import ProtectedRoute from "../components/ProtectedRoute";
import ComingSoon from "../components/ComingSoon";
import NotFound from "../components/NotFound";

/* ================= ADMIN ================= */
import AdminDashboard from "../pages/admin/AdminDashboard";
import StudentManagement from "../pages/admin/StudentManagement";
import StudentDetails from "../pages/admin/StudentDetails";
import HostelManagement from "../pages/admin/HostelManagement";
import RoomManagement from "../pages/admin/RoomManagement";
import StaffManagement from "../pages/admin/StaffManagement";
import GatePassManagement from "../pages/admin/GatePassManagement";
import AttendanceManagement from "../pages/admin/AttendanceManagement";
import CollegeMovementManagement from "../pages/admin/CollegeMovementManagement";

/* ================= GUARD ================= */
import GuardDashboard from "../pages/guard/GuardDashboard";

/* ================= STUDENT ================= */
import StudentDashboard from "../pages/student/StudentDashboard";
import StudentProfile from "../pages/student/StudentProfile";
import StudentGatePass from "../pages/student/StudentGatePass";
import StudentQR from "../pages/student/StudentQR";
import StudentCollegeMovement from "../pages/student/StudentCollegeMovement";
import StudentAttendance from "../pages/student/StudentAttendance";
import StudentComplaints from "../pages/student/StudentComplaints";

/* ================= WARDEN ================= */
import WardenDashboard from "../pages/warden/WardenDashboard";
import WardenGatePass from "../pages/warden/WardenGatePass";
import WardenAttendance from "../pages/warden/WardenAttendance";

/* ================= SHARED (WARDEN + ADMIN) ================= */
import ComplaintManagement from "../pages/staff/ComplaintManagement";


// Small helper so every route is one short line
const guard = (roles, element) => (
  <ProtectedRoute allowedRoles={roles}>{element}</ProtectedRoute>
);

const ADMIN = ["ADMIN"];
const STUDENT = ["STUDENT"];
const WARDEN = ["WARDEN"];
const GUARD = ["GUARD"];
const MAINTENANCE = ["MAINTENANCE"];

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ================= PUBLIC ================= */}
        <Route path="/" element={<Home />} />

        {/* ================= AUTH ================= */}
        <Route path="/login" element={<Login />} />
        <Route path="/student-login" element={<StudentLogin />} />
        <Route path="/staff-login" element={<StaffLogin />} />
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* ================= ADMIN ONLY ================= */}
        <Route path="/admin" element={guard(ADMIN, <AdminDashboard />)} />
        <Route path="/admin/hostels" element={guard(ADMIN, <HostelManagement />)} />
        <Route path="/admin/rooms" element={guard(ADMIN, <RoomManagement />)} />
        <Route path="/admin/staff" element={guard(ADMIN, <StaffManagement />)} />
        <Route path="/admin/gate-pass" element={guard(ADMIN, <GatePassManagement />)} />
        <Route path="/admin/attendance" element={guard(ADMIN, <AttendanceManagement />)} />
        <Route path="/admin/complaints" element={guard(ADMIN, <ComplaintManagement />)} />
        <Route
          path="/admin/reports"
          element={guard(ADMIN, <ComingSoon title="Reports" />)}
        />

        {/* ================= ADMIN: students + college movement ================= */}
        <Route path="/admin/students" element={guard(ADMIN, <StudentManagement />)} />
        <Route path="/admin/students/:id" element={guard(ADMIN, <StudentDetails />)} />
        <Route
          path="/admin/college-movement"
          element={guard(ADMIN, <CollegeMovementManagement />)}
        />

        {/* ================= WARDEN ================= */}
        <Route path="/warden" element={guard(WARDEN, <WardenDashboard />)} />
        <Route path="/warden/gate-pass" element={guard(WARDEN, <WardenGatePass />)} />
        <Route path="/warden/attendance" element={guard(WARDEN, <WardenAttendance />)} />
        <Route path="/warden/complaints" element={guard(WARDEN, <ComplaintManagement />)} />
        <Route path="/warden/students" element={guard(WARDEN, <StudentManagement />)} />
        <Route path="/warden/students/:id" element={guard(WARDEN, <StudentDetails />)} />
        <Route
          path="/warden/college-movement"
          element={guard(WARDEN, <CollegeMovementManagement />)}
        />


        {/* ================= GUARD ================= */}
        <Route path="/guard" element={guard(GUARD, <GuardDashboard />)} />

        {/* ================= MAINTENANCE ================= */}
        <Route
          path="/maintenance"
          element={guard(MAINTENANCE, <ComingSoon title="Maintenance Dashboard" />)}
        />

        {/* ================= STUDENT ================= */}
        <Route path="/student" element={guard(STUDENT, <StudentDashboard />)} />
        <Route path="/student/profile" element={guard(STUDENT, <StudentProfile />)} />
        <Route path="/student/gate-pass" element={guard(STUDENT, <StudentGatePass />)} />
        <Route path="/student/qr" element={guard(STUDENT, <StudentQR />)} />
        <Route
          path="/student/college-movement"
          element={guard(STUDENT, <StudentCollegeMovement />)}
        />
        <Route
          path="/student/attendance"
          element={guard(STUDENT, <StudentAttendance />)}
        />
        <Route
          path="/student/complaints"
          element={guard(STUDENT, <StudentComplaints />)}
        />
        <Route
          path="/student/notifications"
          element={guard(STUDENT, <ComingSoon title="Notifications" />)}
        />

        {/* ================= 404 ================= */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;