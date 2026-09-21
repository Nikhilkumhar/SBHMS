import express from "express";

import { scanStudentQR } from "../controllers/collegeScanController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();


// ==========================================
// SCAN STUDENT QR
// ==========================================

router.post(
  "/scan",
  authMiddleware,
  roleMiddleware("GUARD", "WARDEN", "ADMIN"),
  scanStudentQR
);


export default router;