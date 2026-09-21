import express from "express";

import {
  createRoom,
  getRooms,
} from "../controllers/roomController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN", "WARDEN"),
  createRoom
);

router.get(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN", "WARDEN"),
  getRooms
);

export default router;