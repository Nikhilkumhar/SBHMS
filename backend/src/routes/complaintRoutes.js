import express from "express";
import rateLimit from "express-rate-limit";

import {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
  escalateComplaint,
  resendDswEmail,
} from "../controllers/complaintController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

// Stops a single student from flooding the system (and the DSW's inbox)
const createComplaintLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user.userId,
  validate: { keyGeneratorIpFallback: false },
  message: {
    success: false,
    message: "Too many complaints submitted. Please try again after an hour.",
  },
});

// STUDENT
router.post(
  "/",
  authMiddleware,
  roleMiddleware("STUDENT"),
  createComplaintLimiter,
  createComplaint
);

// VIEW (Student: own, Warden/Admin: sent to them)
router.get(
  "/",
  authMiddleware,
  roleMiddleware("STUDENT", "WARDEN", "ADMIN"),
  getComplaints
);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("STUDENT", "WARDEN", "ADMIN"),
  getComplaintById
);

// WARDEN / ADMIN
router.put(
  "/:id/status",
  authMiddleware,
  roleMiddleware("WARDEN", "ADMIN"),
  updateComplaintStatus
);

router.put(
  "/:id/escalate",
  authMiddleware,
  roleMiddleware("WARDEN"),
  escalateComplaint
);

// RETRY DSW EMAIL (Student own / Admin)
router.post(
  "/:id/resend-dsw",
  authMiddleware,
  roleMiddleware("STUDENT", "ADMIN"),
  resendDswEmail
);

export default router;