import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import connectDB from "./src/config/db.js";

import authRoutes from "./src/routes/authRoutes.js";
import testRoutes from "./src/routes/testRoutes.js";
import studentRoutes from "./src/routes/studentRoutes.js";
import hostelRoutes from "./src/routes/hostelRoutes.js";
import roomRoutes from "./src/routes/roomRoutes.js";
import gatePassRoutes from "./src/routes/gatePassRoutes.js";
import collegeMovementRoutes from "./src/routes/collegeMovementRoutes.js";
import studentQrRoutes from "./src/routes/studentQrRoutes.js";
import collegeScanRoutes from "./src/routes/collegeScanRoutes.js";
import attendanceRoutes from "./src/routes/attendanceRoutes.js";
import staffRoutes from "./src/routes/staffRoutes.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// ================= DATABASE =================
connectDB();

// ================= MIDDLEWARE =================

// Allow frontend to communicate with backend
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    credentials: true,
  })
);

app.use(express.json());

// ================= HEALTH CHECK =================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SBHMS API is running 🚀",
  });
});

// ================= ROOT =================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "SBHMS Server is running 🚀",
  });
});

// ================= API ROUTES =================

app.use("/api/auth", authRoutes);

app.use("/api/test", testRoutes);

app.use("/api/students", studentRoutes);

app.use("/api/hostels", hostelRoutes);

app.use("/api/rooms", roomRoutes);

app.use("/api/gate-passes", gatePassRoutes);

app.use("/api/college-movements", collegeMovementRoutes);

app.use("/api/student-qr", studentQrRoutes);

app.use("/api/college", collegeScanRoutes);

app.use("/api/attendance", attendanceRoutes);
app.use("/api/staff", staffRoutes);

// ================= SERVER =================

app.listen(PORT, () => {
  console.log(`🚀 SBHMS Server running on port ${PORT}`);
});