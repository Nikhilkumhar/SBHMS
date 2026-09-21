import express from "express";

import {
  recordCollegeOut,
  recordCollegeIn,
  getCollegeMovements,
  getStudentsCurrentlyOut,
  getCollegeDailyReport,
  correctCollegeMovement,
} from "../controllers/collegeMovementController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

// RECORD COLLEGE OUT
router.post(
  "/out",
  authMiddleware,
  roleMiddleware("GUARD", "WARDEN", "ADMIN"),
  recordCollegeOut
);

// RECORD COLLEGE IN
router.post(
  "/in",
  authMiddleware,
  roleMiddleware("GUARD", "WARDEN", "ADMIN"),
  recordCollegeIn
);

// GET ALL COLLEGE MOVEMENTS
router.get(
  "/",
  authMiddleware,
  roleMiddleware("GUARD", "WARDEN", "ADMIN"),
  getCollegeMovements
);

// GET STUDENTS CURRENTLY OUT
router.get(
  "/currently-out",
  authMiddleware,
  roleMiddleware("GUARD", "WARDEN", "ADMIN"),
  getStudentsCurrentlyOut
);

// GET COLLEGE DAILY REPORT
router.get(
  "/daily-report",
  authMiddleware,
  roleMiddleware("WARDEN", "ADMIN"),
  getCollegeDailyReport
);

// MANUAL COLLEGE MOVEMENT CORRECTION
router.put(
  "/correct",
  authMiddleware,
  roleMiddleware("WARDEN", "ADMIN"),
  correctCollegeMovement
);

export default router;