import express from "express";

import {
  registerUser,
  loginStudent,
  loginStaff,
  loginAdmin,
} from "../controllers/authController.js";

const router = express.Router();

// ==========================================
// STUDENT LOGIN
// ==========================================

router.post("/student-login", loginStudent);

// ==========================================
// STAFF LOGIN
// WARDEN / GUARD / MAINTENANCE
// ==========================================

router.post("/staff-login", loginStaff);

// ==========================================
// ADMIN LOGIN
// ==========================================

router.post("/admin-login", loginAdmin);

// ==========================================
// REGISTER STUDENT
// ==========================================

router.post("/register", registerUser);

export default router;