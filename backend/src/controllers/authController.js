import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/userModel.js";
import Student from "../models/studentModel.js";



// ==========================================
// STUDENT LOGIN
// ==========================================
// Student logs in using:
// SBU ID + Password
//
// Example:
// SBU2026002
// Student@123
// ==========================================
export const loginStudent = async (req, res) => {
  try {
    const { sbuId, password } = req.body;

    // ------------------------------------------
    // 1. Check required fields
    // ------------------------------------------
    if (!sbuId || !password) {
      return res.status(400).json({
        success: false,
        message: "SBU ID and password are required",
      });
    }

    const formattedSbuId = sbuId.trim().toUpperCase();

    // ------------------------------------------
    // 2. Find student using SBU ID
    // ------------------------------------------
    const student = await Student.findOne({
      sbuId: formattedSbuId,
    });

    if (!student) {
      return res.status(401).json({
        success: false,
        message: "Invalid SBU ID or password",
      });
    }

    // ------------------------------------------
    // 3. Find linked User account
    // ------------------------------------------
    const user = await User.findById(student.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Student login account not found",
      });
    }

    // ------------------------------------------
    // 4. Make sure this is a STUDENT account
    // ------------------------------------------
    if (user.role !== "STUDENT") {
      return res.status(403).json({
        success: false,
        message: "This login is only for students",
      });
    }

    // ------------------------------------------
    // 5. Check account status
    // ------------------------------------------
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive",
      });
    }

    // ------------------------------------------
    // 6. Compare password
    // ------------------------------------------
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid SBU ID or password",
      });
    }

    // ------------------------------------------
    // 7. Create JWT
    // ------------------------------------------
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // ------------------------------------------
    // 8. Send response
    // ------------------------------------------
    res.status(200).json({
      success: true,
      message: "Student login successful",
      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,

        sbuId: student.sbuId,
        studentId: student._id,

        staffId: null,
      },
    });
  } catch (error) {
    console.error("Student login error:", error);

    res.status(500).json({
      success: false,
      message: "Server error during student login",
    });
  }
};

// ==========================================
// STAFF / ADMIN LOGIN
// ==========================================
// Used by:
// ADMIN
// WARDEN
// GUARD
// MAINTENANCE
//
// Login using:
// Staff ID + Password
//
// Examples:
// ADMIN001
// WARDEN001
// GUARD001
// MAINT001
// ==========================================
export const loginStaff = async (req, res) => {
  try {
    const { staffId, password } = req.body;

    // ------------------------------------------
    // 1. Check required fields
    // ------------------------------------------
    if (!staffId || !password) {
      return res.status(400).json({
        success: false,
        message: "Staff ID and password are required",
      });
    }

    const formattedStaffId = staffId.trim().toUpperCase();

    // ------------------------------------------
    // 2. Find user using Staff ID
    // ------------------------------------------
    const user = await User.findOne({
      staffId: formattedStaffId,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid Staff ID or password",
      });
    }

    // ------------------------------------------
    // 3. Make sure this is a staff account
    // ------------------------------------------
    const allowedStaffRoles = [
      "WARDEN",
      "GUARD",
      "MAINTENANCE",
    ];

    if (!allowedStaffRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "This login is only for staff accounts",
      });
    }

    // ------------------------------------------
    // 4. Check account status
    // ------------------------------------------
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive",
      });
    }

    // ------------------------------------------
    // 5. Compare password
    // ------------------------------------------
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid Staff ID or password",
      });
    }

    // ------------------------------------------
    // 6. Create JWT
    // ------------------------------------------
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // ------------------------------------------
    // 7. Send response
    // ------------------------------------------
    res.status(200).json({
      success: true,
      message: "Staff login successful",
      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,

        sbuId: null,
        studentId: null,

        staffId: user.staffId,
      },
    });
  } catch (error) {
    console.error("Staff login error:", error);

    res.status(500).json({
      success: false,
      message: "Server error during staff login",
    });
  }
};

// ==========================================
// ADMIN LOGIN
// ==========================================

export const loginAdmin = async (req, res) => {
  try {
    const { staffId, password } = req.body;

    if (!staffId || !password) {
      return res.status(400).json({
        success: false,
        message: "Staff ID and password are required",
      });
    }

    const formattedStaffId = staffId.trim().toUpperCase();

    const user = await User.findOne({
      staffId: formattedStaffId,
      role: "ADMIN",
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Admin account is inactive",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({
      success: true,
      message: "Admin login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        staffId: user.staffId,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);

    res.status(500).json({
      success: false,
      message: "Server error during admin login",
    });
  }
};