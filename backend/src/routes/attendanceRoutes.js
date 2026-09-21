import express from "express";

import {
  markAttendance,
  markBulkAttendance,
  getAttendanceRoster,
  getAttendanceByDate,
  getStudentAttendance,
} from "../controllers/attendanceController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();


// ======================================================
// MARK SINGLE ATTENDANCE
// ======================================================

router.post(
  "/",
  authMiddleware,
  roleMiddleware("WARDEN", "ADMIN"),
  markAttendance
);


// ======================================================
// MARK BULK ATTENDANCE
// ======================================================

router.post(
  "/bulk",
  authMiddleware,
  roleMiddleware("WARDEN", "ADMIN"),
  markBulkAttendance
);


// ======================================================
// GET ATTENDANCE ROSTER
// ======================================================

router.get(
  "/roster",
  authMiddleware,
  roleMiddleware("WARDEN", "ADMIN"),
  getAttendanceRoster
);


// ======================================================
// GET ATTENDANCE BY DATE
// ======================================================

router.get(
  "/",
  authMiddleware,
  roleMiddleware("WARDEN", "ADMIN"),
  getAttendanceByDate
);


// ======================================================
// GET STUDENT ATTENDANCE HISTORY
// ======================================================

router.get(
  "/student/:studentId",
  authMiddleware,
  roleMiddleware("STUDENT", "WARDEN", "ADMIN"),
  getStudentAttendance
);


export default router;