import Student from "../models/studentModel.js";
import CollegeMovement from "../models/CollegeMovement.js";
import { startOfDayIST, getISTMinutes } from "../utils/time.js";
import { closeStaleCollegeMovements } from "../services/collegeMovementService.js";

// ==========================================
// SCAN STUDENT DAILY QR
// ==========================================

export const scanStudentQR = async (req, res) => {
  try {
    const { qrToken } = req.body;

    // Must be a plain text token (blocks injection tricks)
    if (!qrToken || typeof qrToken !== "string") {
      return res.status(400).json({
        success: false,
        message: "QR token is required",
      });
    }

    // ------------------------------------------
    // FIND STUDENT
    // ------------------------------------------

    const student = await Student.findOne({
      qrToken: qrToken.trim(),
    }).populate("userId", "name isActive");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Invalid or unknown student QR",
      });
    }

    if (!student.userId || !student.userId.isActive) {
      return res.status(403).json({
        success: false,
        message: "This student's account is inactive",
      });
    }

    // ------------------------------------------
    // QR MUST BE FROM TODAY (India date)
    // ------------------------------------------

    const now = new Date();

    const qrIsToday =
      student.qrDate &&
      new Date(student.qrDate).getTime() === startOfDayIST(now).getTime();

    if (!qrIsToday) {
      return res.status(400).json({
        success: false,
        message: "This QR code has expired. Please generate today's QR.",
      });
    }

    // ------------------------------------------
    // COLLEGE HOURS (India time)
    // Default 8:00 - 17:00. Can be changed in .env:
    // COLLEGE_START_HOUR=8   COLLEGE_END_HOUR=17
    // ------------------------------------------

    const startHour = Number(process.env.COLLEGE_START_HOUR ?? 8);
    const endHour = Number(process.env.COLLEGE_END_HOUR ?? 17);

    const currentMinutes = getISTMinutes(now);

    if (
      currentMinutes < startHour * 60 ||
      currentMinutes > endHour * 60
    ) {
      return res.status(400).json({
        success: false,
        message: `College movement is allowed only between ${startHour}:00 and ${endHour}:00 (IST)`,
      });
    }

    // ------------------------------------------
    // CLOSE UNFINISHED OUT RECORDS FROM PREVIOUS DAYS
    // ------------------------------------------

    await closeStaleCollegeMovements();

    // ------------------------------------------
    // IS THE STUDENT CURRENTLY OUT?
    // ------------------------------------------

    const activeMovement = await CollegeMovement.findOne({
      studentId: student._id,
      status: "OUT",
    }).sort({ outTime: -1 });

    const studentInfo = {
      id: student._id,
      name: student.userId.name,
      sbuId: student.sbuId,
      course: student.course,
    };

    // OUT -> mark IN
    if (activeMovement) {
      activeMovement.inTime = now;
      activeMovement.status = "IN";
      activeMovement.recordedInBy = req.user.userId;

      await activeMovement.save();

      return res.status(200).json({
        success: true,
        action: "IN",
        message: "College IN recorded successfully",
        student: studentInfo,
        movement: activeMovement,
      });
    }

    // Otherwise -> mark OUT
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
      student: studentInfo,
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