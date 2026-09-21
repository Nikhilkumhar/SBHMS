import express from "express";

import { generateDailyStudentQR } from "../controllers/studentQrController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

// ==========================================
// GENERATE / GET TODAY'S STUDENT QR
// ==========================================

router.get(
  "/daily",
  authMiddleware,
  roleMiddleware("STUDENT"),
  generateDailyStudentQR
);

export default router;