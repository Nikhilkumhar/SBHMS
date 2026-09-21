import bcrypt from "bcryptjs";
import User from "../models/userModel.js";

// ==========================================
// ALLOWED STAFF ROLES
// ==========================================

const allowedStaffRoles = ["WARDEN", "GUARD", "MAINTENANCE"];

// ==========================================
// CREATE STAFF
// ==========================================

export const createStaff = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      staffId,
      password,
      role,
    } = req.body;

    // Check required fields
    if (
      !name ||
      !email ||
      !phone ||
      !staffId ||
      !password ||
      !role
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Check role
    if (!allowedStaffRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid staff role",
      });
    }

    // Check password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const formattedEmail = email.trim().toLowerCase();
    const formattedStaffId = staffId.trim().toUpperCase();

    // Check existing email
    const existingEmail = await User.findOne({
      email: formattedEmail,
    });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Check existing Staff ID
    const existingStaffId = await User.findOne({
      staffId: formattedStaffId,
    });

    if (existingStaffId) {
      return res.status(409).json({
        success: false,
        message: "Staff ID already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create staff
    const staff = await User.create({
      name: name.trim(),
      email: formattedEmail,
      phone: phone.trim(),
      staffId: formattedStaffId,
      password: hashedPassword,
      role,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "Staff created successfully",
      staff: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        staffId: staff.staffId,
        role: staff.role,
        isActive: staff.isActive,
      },
    });
  } catch (error) {
    console.error("Create staff error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while creating staff",
    });
  }
};

// ==========================================
// GET ALL STAFF
// ==========================================

export const getStaff = async (req, res) => {
  try {
    const staff = await User.find({
      role: { $in: allowedStaffRoles },
    })
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: staff.length,
      staff,
    });
  } catch (error) {
    console.error("Get staff error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching staff",
    });
  }
};

// ==========================================
// GET STAFF BY ID
// ==========================================

export const getStaffById = async (req, res) => {
  try {
    const staff = await User.findOne({
      _id: req.params.id,
      role: { $in: allowedStaffRoles },
    }).select("-password");

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

    res.status(200).json({
      success: true,
      staff,
    });
  } catch (error) {
    console.error("Get staff by ID error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching staff",
    });
  }
};

// ==========================================
// UPDATE STAFF
// ==========================================

export const updateStaff = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      role,
      password,
    } = req.body;

    const staff = await User.findOne({
      _id: req.params.id,
      role: { $in: allowedStaffRoles },
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

    // Validate role if provided
    if (role && !allowedStaffRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid staff role",
      });
    }

    // Update basic details
    if (name) staff.name = name.trim();

    if (phone) staff.phone = phone.trim();

    if (email) {
      const formattedEmail = email.trim().toLowerCase();

      const existingEmail = await User.findOne({
        email: formattedEmail,
        _id: { $ne: staff._id },
      });

      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: "Email already exists",
        });
      }

      staff.email = formattedEmail;
    }

    if (role) {
      staff.role = role;
    }

    // Update password only if provided
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters",
        });
      }

      staff.password = await bcrypt.hash(password, 10);
    }

    await staff.save();

    res.status(200).json({
      success: true,
      message: "Staff updated successfully",
      staff: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        staffId: staff.staffId,
        role: staff.role,
        isActive: staff.isActive,
      },
    });
  } catch (error) {
    console.error("Update staff error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while updating staff",
    });
  }
};

// ==========================================
// ACTIVATE / DEACTIVATE STAFF
// ==========================================

export const toggleStaffStatus = async (req, res) => {
  try {
    const staff = await User.findOne({
      _id: req.params.id,
      role: { $in: allowedStaffRoles },
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

    staff.isActive = !staff.isActive;

    await staff.save();

    res.status(200).json({
      success: true,
      message: staff.isActive
        ? "Staff account activated"
        : "Staff account deactivated",
      staff: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        staffId: staff.staffId,
        role: staff.role,
        isActive: staff.isActive,
      },
    });
  } catch (error) {
    console.error("Toggle staff status error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while changing staff status",
    });
  }
};

// ==========================================
// DELETE STAFF
// ==========================================

export const deleteStaff = async (req, res) => {
  try {
    const staff = await User.findOne({
      _id: req.params.id,
      role: { $in: allowedStaffRoles },
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

    await User.findByIdAndDelete(staff._id);

    res.status(200).json({
      success: true,
      message: "Staff deleted successfully",
    });
  } catch (error) {
    console.error("Delete staff error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while deleting staff",
    });
  }
};