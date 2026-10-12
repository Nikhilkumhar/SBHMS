import express from "express";
import rateLimit from "express-rate-limit";

import {
  loginStudent,
  loginStaff,
  loginAdmin,
} from "../controllers/authController.js";

const router = express.Router();

// ==========================================
// LOGIN RATE LIMIT
// ==========================================
// Only FAILED attempts are counted.
// 20 failed tries per IP every 15 minutes.
// (Higher than usual because many hostel students
// can share one WiFi IP address.)

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many failed login attempts. Please try again after 15 minutes.",
  },
});

router.post("/student-login", loginLimiter, loginStudent);

router.post("/staff-login", loginLimiter, loginStaff);

router.post("/admin-login", loginLimiter, loginAdmin);

export default router;