import express from "express";

import {
  createStaff,
  getStaff,
  getStaffById,
  updateStaff,
  toggleStaffStatus,
  deleteStaff,
} from "../controllers/staffController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

// ==========================================
// STAFF MANAGEMENT
// Only ADMIN can manage staff
// ==========================================

// Create staff
router.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  createStaff
);

// Get all staff
router.get(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getStaff
);

// Get staff by ID
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getStaffById
);

// Update staff
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  updateStaff
);

// Activate / Deactivate staff
router.patch(
  "/:id/status",
  authMiddleware,
  roleMiddleware("ADMIN"),
  toggleStaffStatus
);

// Delete staff
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  deleteStaff
);

export default router;