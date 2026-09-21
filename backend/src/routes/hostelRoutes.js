import express from "express";

import {
  createHostel,
  getHostels,
} from "../controllers/hostelController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN", "WARDEN"),
  createHostel
);

router.get(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN", "WARDEN"),
  getHostels
);

export default router;