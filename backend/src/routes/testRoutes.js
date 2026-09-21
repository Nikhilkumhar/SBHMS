import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get(
  "/protected",
  authMiddleware,
  (req, res) => {
    res.json({
      success: true,
      message: "You accessed a protected route 🔐",
      user: req.user,
    });
  }
);

router.get(
  "/student",
  authMiddleware,
  roleMiddleware("STUDENT"),
  (req, res) => {
    res.json({
      success: true,
      message: "Student access granted 🎓",
      user: req.user,
    });
  }
);

router.get(
  "/warden",
  authMiddleware,
  roleMiddleware("WARDEN", "ADMIN"),
  (req, res) => {
    res.json({
      success: true,
      message: "Warden/Admin access granted 👮",
      user: req.user,
    });
  }
);

export default router;