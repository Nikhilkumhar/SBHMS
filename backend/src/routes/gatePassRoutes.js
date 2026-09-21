import express from "express";

import {
  createGatePass,
  getGatePasses,
  getGatePassById,
  recordParentPermission,
  approveGatePass,
  rejectGatePass,
  markGatePassOut,
  markGatePassIn,
} from "../controllers/gatePassController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();


// ==========================================
// STUDENT
// ==========================================

// Student applies for gate pass
router.post(
  "/",
  authMiddleware,
  roleMiddleware("STUDENT"),
  createGatePass
);


// ==========================================
// VIEW GATE PASSES
// ==========================================

// Student / Warden / Admin
router.get(
  "/",
  authMiddleware,
  roleMiddleware("STUDENT", "WARDEN", "ADMIN"),
  getGatePasses
);


// ==========================================
// GUARD QR SCAN
// ==========================================

// Guard scans QR → Student OUT
router.post(
  "/scan/out",
  authMiddleware,
  roleMiddleware("GUARD", "WARDEN", "ADMIN"),
  markGatePassOut
);


// Guard scans QR → Student IN
router.post(
  "/scan/in",
  authMiddleware,
  roleMiddleware("GUARD", "WARDEN", "ADMIN"),
  markGatePassIn
);


// ==========================================
// WARDEN / ADMIN
// ==========================================

// Record parent permission
router.put(
  "/:id/parent-permission",
  authMiddleware,
  roleMiddleware("WARDEN", "ADMIN"),
  recordParentPermission
);


// Approve gate pass
router.put(
  "/:id/approve",
  authMiddleware,
  roleMiddleware("WARDEN", "ADMIN"),
  approveGatePass
);


// Reject gate pass
router.put(
  "/:id/reject",
  authMiddleware,
  roleMiddleware("WARDEN", "ADMIN"),
  rejectGatePass
);


// ==========================================
// SINGLE GATE PASS
// ==========================================

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("STUDENT", "WARDEN", "ADMIN"),
  getGatePassById
);


export default router;