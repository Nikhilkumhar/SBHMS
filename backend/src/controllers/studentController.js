import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import Student from "../models/studentModel.js";
import User from "../models/userModel.js";
import Hostel from "../models/hostelModel.js";
import Room from "../models/roomModel.js";
import GatePass from "../models/gatePassModel.js";
import CollegeMovement from "../models/CollegeMovement.js";

// =================================================
// CREATE STUDENT
// =================================================

export const createStudent = async (req, res) => {
  let reservedRoomId = null;
  let createdUserId = null;
  let completed = false;

  try {
    const {
      name,
      sbuId,
      email,
      phone,
      password,
      course,
      year,
      hostelId,
      roomId,
      fatherName,
      fatherMobile,
    } = req.body;

    if (
      !name ||
      !sbuId ||
      !email ||
      !phone ||
      !password ||
      !course ||
      !year ||
      !hostelId ||
      !roomId ||
      !fatherName ||
      !fatherMobile
    ) {
      return res.status(400).json({
        success: false,
        message: "All student fields are required",
      });
    }

    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    if (
      !mongoose.isValidObjectId(hostelId) ||
      !mongoose.isValidObjectId(roomId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid hostel or room",
      });
    }

    const formattedSbuId = String(sbuId).trim().toUpperCase();
    const formattedEmail = String(email).trim().toLowerCase();

    // Duplicate checks
    const existingStudent = await Student.findOne({
      sbuId: formattedSbuId,
    });

    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: "Student with this SBU ID already exists",
      });
    }

    const existingUser = await User.findOne({
      email: formattedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Hostel and room checks
    const hostel = await Hostel.findById(hostelId);

    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: "Hostel not found",
      });
    }

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    if (room.hostelId.toString() !== hostelId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Room does not belong to this hostel",
      });
    }

    // Take one bed in a single safe step.
    // This fails if the room is full or under maintenance,
    // even if two admins click at the same moment.
    const seat = await Room.findOneAndUpdate(
      {
        _id: roomId,
        hostelId,
        status: "AVAILABLE",
        $expr: { $lt: ["$currentOccupancy", "$capacity"] },
      },
      { $inc: { currentOccupancy: 1 } },
      { new: true }
    );

    if (!seat) {
      return res.status(400).json({
        success: false,
        message: "Room is full or not available",
      });
    }

    reservedRoomId = seat._id;

    if (seat.currentOccupancy >= seat.capacity) {
      await Room.updateOne(
        { _id: seat._id },
        { $set: { status: "FULL" } }
      );
    }

    // Create login account
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: String(name).trim(),
      email: formattedEmail,
      phone: String(phone).trim(),
      password: hashedPassword,
      role: "STUDENT",
    });

    createdUserId = user._id;

    // Create student profile
    const student = await Student.create({
      userId: user._id,
      sbuId: formattedSbuId,
      course,
      year,
      hostelId,
      roomId,
      fatherName,
      fatherMobile,
    });

    completed = true;

    const createdStudent = await Student.findById(student._id)
      .populate("userId", "name email phone role")
      .populate("hostelId", "name code")
      .populate("roomId", "roomNumber floor capacity");

    return res.status(201).json({
      success: true,
      message: "Student account created successfully",
      student: createdStudent,
    });
  } catch (error) {
    console.error("Create student error:", error);

    // Undo anything half-finished
    if (!completed) {
      try {
        if (createdUserId) {
          await User.findByIdAndDelete(createdUserId);
        }

        if (reservedRoomId) {
          await Room.updateOne(
            { _id: reservedRoomId, currentOccupancy: { $gt: 0 } },
            { $inc: { currentOccupancy: -1 } }
          );

          await Room.updateOne(
            {
              _id: reservedRoomId,
              status: "FULL",
              $expr: { $lt: ["$currentOccupancy", "$capacity"] },
            },
            { $set: { status: "AVAILABLE" } }
          );
        }
      } catch (rollbackError) {
        console.error("Rollback error:", rollbackError);
      }
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "SBU ID or email already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while creating student",
    });
  }
};

// =================================================
// GET LOGGED-IN STUDENT PROFILE
// =================================================

export const getMyProfile = async (req, res) => {
  try {
    // Get user ID from JWT middleware
    const userId = req.user.userId;

    const student = await Student.findOne({ userId })
      .populate("userId", "name email phone role isActive")
      .populate("hostelId", "name code")
      .populate("roomId", "roomNumber floor capacity");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    res.status(200).json({
      success: true,
      student: {
        id: student._id,

        name: student.userId.name,

        sbuId: student.sbuId,

        email: student.userId.email,

        phone: student.userId.phone,

        course: student.course,

        year: student.year,

        // FIX:
        // Populated hostel is stored in hostelId
        hostel: student.hostelId,

        // FIX:
        // Populated room is stored in roomId
        room: student.roomId,

        fatherName: student.fatherName,

        fatherMobile: student.fatherMobile,

        role: student.userId.role,

        isActive: student.userId.isActive,
      },
    });
  } catch (error) {
    console.error("Get my profile error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
    });
  }
};

// =================================================
// GET ALL STUDENTS
// =================================================
// By default students who LEFT are hidden.
// Use /api/students?includeLeft=true to see them too.

export const getStudents = async (req, res) => {
  try {
    const filter = {};

    if (req.query.includeLeft !== "true") {
      filter.status = { $ne: "LEFT" };
    }

    const students = await Student.find(filter)
      .populate("userId", "name email phone role")
      .populate("hostelId", "name code")
      .populate("roomId", "roomNumber floor capacity");

    res.status(200).json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    console.error("Get students error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching students",
    });
  }
};

// =================================================
// GET STUDENT BY ID
// =================================================

export const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate("userId", "name email phone role")
      .populate("hostelId", "name code")
      .populate("roomId", "roomNumber floor capacity");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.status(200).json({
      success: true,
      student,
    });
  } catch (error) {
    console.error("Get student error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching student",
    });
  }
};

// =================================================
// UPDATE STUDENT
// =================================================

export const updateStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const {
      sbuId,
      course,
      year,
      hostelId,
      roomId,
      fatherName,
      fatherMobile,
    } = req.body;

    // =================================================
    // FORMAT SBU ID IF PROVIDED
    // =================================================

    const formattedSbuId = sbuId
      ? sbuId.trim().toUpperCase()
      : null;

    // =================================================
    // IF HOSTEL OR ROOM IS BEING CHANGED
    // =================================================

    if (hostelId || roomId) {
      const newHostelId =
        hostelId || student.hostelId.toString();

      const newRoomId =
        roomId || student.roomId.toString();

      const newHostel =
        await Hostel.findById(newHostelId);

      if (!newHostel) {
        return res.status(404).json({
          success: false,
          message: "New hostel not found",
        });
      }

      const newRoom =
        await Room.findById(newRoomId);

      if (!newRoom) {
        return res.status(404).json({
          success: false,
          message: "New room not found",
        });
      }

      // Check room belongs to hostel
      if (
        newRoom.hostelId.toString() !==
        newHostelId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Room does not belong to selected hostel",
        });
      }

      // Check if student is changing room
      if (
        newRoomId !==
        student.roomId.toString()
      ) {
        // Check new room capacity
        if (
          newRoom.currentOccupancy >=
          newRoom.capacity
        ) {
          return res.status(400).json({
            success: false,
            message: "New room is already full",
          });
        }

        // Decrease old room occupancy
        const oldRoom =
          await Room.findById(student.roomId);

        if (
          oldRoom &&
          oldRoom.currentOccupancy > 0
        ) {
          oldRoom.currentOccupancy -= 1;

          if (oldRoom.status === "FULL") {
            oldRoom.status = "AVAILABLE";
          }

          await oldRoom.save();
        }

        // Increase new room occupancy
        newRoom.currentOccupancy += 1;

        if (
          newRoom.currentOccupancy >=
          newRoom.capacity
        ) {
          newRoom.status = "FULL";
        }

        await newRoom.save();

        student.hostelId = newHostelId;
        student.roomId = newRoomId;
      }
    }

    // =================================================
    // CHECK DUPLICATE SBU ID
    // =================================================

    if (
      formattedSbuId &&
      formattedSbuId !== student.sbuId
    ) {
      const existingStudent =
        await Student.findOne({
          sbuId: formattedSbuId,
          _id: { $ne: student._id },
        });

      if (existingStudent) {
        return res.status(409).json({
          success: false,
          message:
            "Another student already uses this SBU ID",
        });
      }

      student.sbuId = formattedSbuId;
    }

    // =================================================
    // UPDATE FIELDS
    // =================================================

    if (course) {
      student.course = course;
    }

    if (year) {
      student.year = year;
    }

    if (fatherName) {
      student.fatherName = fatherName;
    }

    if (fatherMobile) {
      student.fatherMobile = fatherMobile;
    }

    await student.save();

    // =================================================
    // POPULATE UPDATED STUDENT
    // =================================================

    const updatedStudent =
      await Student.findById(student._id)
        .populate(
          "userId",
          "name email phone role"
        )
        .populate(
          "hostelId",
          "name code"
        )
        .populate(
          "roomId",
          "roomNumber floor capacity"
        );

    res.status(200).json({
      success: true,
      message: "Student updated successfully",
      student: updatedStudent,
    });
  } catch (error) {
    console.error(
      "Update student error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Server error while updating student",
    });
  }
};

// =================================================
// REMOVE STUDENT (soft delete)
// =================================================
// The student is marked LEFT. History is kept.

export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    if (student.status === "LEFT") {
      return res.status(400).json({
        success: false,
        message: "This student has already been removed",
      });
    }

    // Do not remove someone who is outside right now
    const passOut = await GatePass.findOne({
      studentId: student._id,
      status: "OUT",
    });

    if (passOut) {
      return res.status(400).json({
        success: false,
        message:
          "Student is currently outside on a gate pass. Record the return first.",
      });
    }

    // Mark as LEFT (only one request can win, so the room
    // is never freed twice) and clear the QR token
    const updated = await Student.findOneAndUpdate(
      { _id: student._id, status: { $ne: "LEFT" } },
      {
        $set: { status: "LEFT", leftAt: new Date() },
        $unset: { qrToken: "", qrDate: "" },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(400).json({
        success: false,
        message: "This student has already been removed",
      });
    }

    // Switch off the login (blocked immediately by authMiddleware)
    await User.findByIdAndUpdate(student.userId, {
      isActive: false,
    });

    // Free the bed
    const room = await Room.findOneAndUpdate(
      { _id: student.roomId, currentOccupancy: { $gt: 0 } },
      { $inc: { currentOccupancy: -1 } },
      { new: true }
    );

    if (
      room &&
      room.status === "FULL" &&
      room.currentOccupancy < room.capacity
    ) {
      room.status = "AVAILABLE";
      await room.save();
    }

    // Cancel passes that were not used yet
    await GatePass.updateMany(
      {
        studentId: student._id,
        status: { $in: ["PENDING", "APPROVED"] },
      },
      { $set: { status: "CANCELLED" } }
    );

    // Close an open college OUT record
    await CollegeMovement.updateMany(
      { studentId: student._id, status: "OUT" },
      {
        $set: {
          status: "IN",
          inTime: new Date(),
          autoClosed: true,
          remarks: "Closed: student was removed from hostel",
        },
      }
    );

    res.status(200).json({
      success: true,
      message:
        "Student removed. Login disabled and room bed freed. Records are kept.",
    });
  } catch (error) {
    console.error("Delete student error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while removing student",
    });
  }
};


// =================================================
// RESET STUDENT PASSWORD
// =================================================

export const resetStudentPassword = async (req, res) => {
  try {
    const { password } = req.body;

    // Validate password
    if (!password) {
      return res.status(400).json({
        success: false,
        message: "New password is required",
      });
    }

    // Minimum password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Find student
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Find linked user account
    const user = await User.findById(student.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Student login account not found",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save only hashed password
    user.password = hashedPassword;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Student password reset successfully",
    });
  } catch (error) {
    console.error("Reset student password error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while resetting student password",
    });
  }
};