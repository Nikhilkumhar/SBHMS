import crypto from "crypto";
import Student from "../models/studentModel.js";


// ==========================================
// GENERATE DAILY STUDENT QR
// ==========================================

export const generateDailyStudentQR = async (req, res) => {
  try {
    // Find student connected to logged-in user
    const student = await Student.findOne({
      userId: req.user.userId,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    // Get today's date
    const today = new Date();

    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    // If today's QR already exists, return it
    if (
      student.qrToken &&
      student.qrDate &&
      new Date(student.qrDate).getTime() === startOfDay.getTime()
    ) {
      return res.status(200).json({
        success: true,
        message: "Today's QR already exists",
        qrToken: student.qrToken,
        qrDate: student.qrDate,
      });
    }

    // Generate new secure token
    const qrToken = crypto.randomBytes(32).toString("hex");

    student.qrToken = qrToken;
    student.qrDate = startOfDay;

    await student.save();

    res.status(200).json({
      success: true,
      message: "Daily QR generated successfully",
      qrToken,
      qrDate: startOfDay,
    });
  } catch (error) {
    console.error("Generate daily QR error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while generating daily QR",
    });
  }
};