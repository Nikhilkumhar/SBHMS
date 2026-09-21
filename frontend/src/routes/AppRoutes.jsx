import { BrowserRouter, Routes, Route } from "react-router-dom";

/* ================= PUBLIC ================= */

import Home from "../pages/public/Home";

/* ================= AUTHENTICATION ================= */

import Login from "../pages/auth/Login";
import StudentLogin from "../pages/auth/StudentLogin";
import StaffLogin from "../pages/auth/StaffLogin";
import AdminLogin from "../pages/auth/AdminLogin";

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

/* ================= WARDEN ================= */

import WardenGatePass from "../pages/warden/WardenGatePass";
import WardenAttendance from "../pages/warden/WardenAttendance";
import WardenDashboard from "../pages/warden/WardenDashboard";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ================= PUBLIC ================= */}

        <Route
          path="/"
          element={<Home />}
        />

        {/* ================= AUTHENTICATION ================= */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/student-login"
          element={<StudentLogin />}
        />

        <Route
          path="/staff-login"
          element={<StaffLogin />}
        />

        <Route
          path="/admin-login"
          element={<AdminLogin />}
        />

        {/* ================= ADMIN ================= */}

        <Route
          path="/admin"
          element={<AdminDashboard />}
        />

        <Route
          path="/admin/students"
          element={<StudentManagement />}
        />

        <Route
          path="/admin/students/:id"
          element={<StudentDetails />}
        />

        <Route
          path="/admin/hostels"
          element={<HostelManagement />}
        />

        <Route
          path="/admin/rooms"
          element={<RoomManagement />}
        />

        <Route
          path="/admin/staff"
          element={<StaffManagement />}
        />

        <Route
          path="/admin/gate-pass"
          element={<GatePassManagement />}
        />

        <Route
          path="/admin/attendance"
          element={<AttendanceManagement />}
        />

        <Route
          path="/admin/college-movement"
          element={<CollegeMovementManagement />}
        />

        {/* ================= GUARD ================= */}

        <Route
          path="/guard"
          element={<GuardDashboard />}
        />

        {/* ================= STUDENT ================= */}

        <Route
          path="/student"
          element={<StudentDashboard />}
        />

        <Route
          path="/student/profile"
          element={<StudentProfile />}
        />

        <Route
          path="/student/gate-pass"
          element={<StudentGatePass />}
        />

        {/* College QR */}
        <Route
          path="/student/qr"
          element={<StudentQR />}
        />

        {/* ================= WARDEN ================= */}

        <Route
          path="/warden/gate-pass"
          element={<WardenGatePass />}
        />
        <Route
          path="/warden/attendance"
          element={<WardenAttendance />}
        />
        <Route
          path="/warden"
          element={<WardenDashboard />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;