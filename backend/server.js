import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

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
import complaintRoutes from "./src/routes/complaintRoutes.js";

// ================= STARTUP CHECKS =================

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is not defined in .env ❌");
  process.exit(1);
}

const app = express();

const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";

// Needed when deployed behind a proxy (Render, Railway, Nginx...)
// so rate limiting sees the real user IP
if (isProduction) {
  app.set("trust proxy", 1);
}

// ================= SECURITY + LOGGING =================

app.use(helmet());

if (!isProduction) {
  app.use(morgan("dev"));
}

// ================= CORS =================

const allowedOrigins = (
  process.env.CLIENT_URLS ||
  "http://localhost:5173,http://127.0.0.1:5173"
)
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow tools without an origin (Postman, curl) and listed websites
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "100kb" }));

// ================= HEALTH CHECK =================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SBHMS API is running 🚀",
  });
});

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
app.use("/api/complaints", complaintRoutes);

// ================= 404 FOR UNKNOWN API ROUTES =================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ================= GLOBAL ERROR HANDLER =================

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "Origin not allowed",
    });
  }

  // Bad JSON body from the client
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON in request body",
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// ================= START SERVER =================
// Connect to the database FIRST, then accept requests

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 SBHMS Server running on port ${PORT}`);
  });
};

startServer();