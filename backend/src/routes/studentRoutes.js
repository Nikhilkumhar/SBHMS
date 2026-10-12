import express from "express";

import {
  createStudent,
  getMyProfile,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  resetStudentPassword,
} from "../controllers/studentController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

// ================================================
// STUDENT PROFILE
// ================================================

router.get(
  "/me",
  authMiddleware,
  roleMiddleware("STUDENT"),
  getMyProfile
);

// ================================================
// ADMIN / WARDEN STUDENT MANAGEMENT
// ================================================

router.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN", "WARDEN"),
  createStudent
);

router.get(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN", "WARDEN"),
  getStudents
);

// ================================================
// RESET STUDENT PASSWORD
// ================================================

router.put(
  "/:id/reset-password",
  authMiddleware,
  roleMiddleware("ADMIN", "WARDEN"),
  resetStudentPassword
);

// ================================================
// GET STUDENT BY ID
// ================================================

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN", "WARDEN"),
  getStudentById
);

// ================================================
// UPDATE STUDENT
// ================================================

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN", "WARDEN"),
  updateStudent
);

// ================================================
// DELETE STUDENT
// ================================================

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  deleteStudent
);

export default router;