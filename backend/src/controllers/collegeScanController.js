import crypto from "crypto";
import Student from "../models/studentModel.js";
import CollegeMovement from "../models/CollegeMovement.js";


// ==========================================
// SCAN STUDENT DAILY QR
// ==========================================

export const scanStudentQR = async (req, res) => {
  try {
    const { qrToken } = req.body;

    if (!qrToken) {
      return res.status(400).json({
        success: false,
        message: "QR token is required",
      });
    }

    // ==========================================
    // FIND STUDENT USING QR TOKEN
    // ==========================================

    const student = await Student.findOne({
      qrToken,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Invalid or unknown student QR",
      });
    }

    // ==========================================
    // CHECK QR DATE
    // ==========================================

    const now = new Date();

    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const qrDate = new Date(student.qrDate);

    const qrIsToday =
      qrDate.getTime() === startOfToday.getTime();

    if (!qrIsToday) {
      return res.status(400).json({
        success: false,
        message: "This QR code has expired. Please generate today's QR.",
      });
    }

    // ==========================================
    // CHECK COLLEGE HOURS
    // 8:00 AM - 5:00 PM
    // ==========================================

    const currentMinutes =
      now.getHours() * 60 + now.getMinutes();

    const collegeStart = 8 * 60;  // 8:00 AM
    const collegeEnd = 17 * 60;   // 5:00 PM

    if (
      currentMinutes < collegeStart ||
      currentMinutes > collegeEnd
    ) {
      return res.status(400).json({
        success: false,
        message: "College movement is allowed only between 8:00 AM and 5:00 PM",
      });
    }

    // ==========================================
    // CHECK CURRENT MOVEMENT
    // ==========================================

    const activeMovement = await CollegeMovement.findOne({
      studentId: student._id,
      status: "OUT",
    }).sort({ outTime: -1 });

    // ==========================================
    // IF STUDENT IS CURRENTLY OUT → MARK IN
    // ==========================================

    if (activeMovement) {
      activeMovement.inTime = now;
      activeMovement.status = "IN";
      activeMovement.recordedInBy = req.user.userId;

      await activeMovement.save();

      return res.status(200).json({
        success: true,
        action: "IN",
        message: "College IN recorded successfully",
        student: {
          id: student._id,
          sbuId: student.sbuId,
          course: student.course,
        },
        movement: activeMovement,
      });
    }

    // ==========================================
    // OTHERWISE → MARK OUT
    // ==========================================

    const movement = await CollegeMovement.create({
      studentId: student._id,
      date: now,
      outTime: now,
      status: "OUT",
      recordedOutBy: req.user.userId,
    });

    return res.status(201).json({
      success: true,
      action: "OUT",
      message: "College OUT recorded successfully",
      student: {
        id: student._id,
        sbuId: student.sbuId,
        course: student.course,
      },
      movement,
    });

  } catch (error) {
    console.error("Scan student QR error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while scanning student QR",
    });
  }
};