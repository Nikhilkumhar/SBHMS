import bcrypt from "bcryptjs";

import Student from "../models/studentModel.js";

import User from "../models/userModel.js";

import Hostel from "../models/hostelModel.js";

import Room from "../models/roomModel.js";


// =================================================
// CREATE STUDENT
// =================================================

export const createStudent = async (req, res) => {
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

    // Check required fields
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

    // Check password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Check duplicate SBU ID
    const existingStudent = await Student.findOne({ sbuId });

    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: "Student with this SBU ID already exists",
      });
    }

    // Check duplicate email
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Check hostel
    const hostel = await Hostel.findById(hostelId);

    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: "Hostel not found",
      });
    }

    // Check room
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    // Make sure room belongs to selected hostel
    if (room.hostelId.toString() !== hostelId) {
      return res.status(400).json({
        success: false,
        message: "Room does not belong to this hostel",
      });
    }

    // Check room capacity
    if (room.currentOccupancy >= room.capacity) {
      return res.status(400).json({
        success: false,
        message: "Room is already full",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user account
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      role: "STUDENT",
    });

    try {
      // Create student
      const student = await Student.create({
        userId: user._id,
        sbuId,
        course,
        year,
        hostelId,
        roomId,
        fatherName,
        fatherMobile,
      });

      // Update room occupancy
      room.currentOccupancy += 1;

      if (room.currentOccupancy >= room.capacity) {
        room.status = "FULL";
      }

      await room.save();

      // Populate student information
      const createdStudent = await Student.findById(student._id)
        .populate("userId", "name email phone role")
        .populate("hostelId", "name code")
        .populate("roomId", "roomNumber floor capacity");

      return res.status(201).json({
        success: true,
        message: "Student account created successfully",
        student: createdStudent,
      });

    } catch (studentError) {
      // If student creation fails, remove the user
      await User.findByIdAndDelete(user._id);

      throw studentError;
    }

  } catch (error) {
    console.error("Create student error:", error);

    // Handle duplicate key errors
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

        hostel: student.hostelId,

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

export const getStudents = async (req, res) => {
  try {
    const students = await Student.find()
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

    // If hostel or room is being changed
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
        const oldRoom = await Room.findById(
          student.roomId
        );

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

    // Check duplicate SBU ID
    if (
      sbuId &&
      sbuId !== student.sbuId
    ) {
      const existingStudent =
        await Student.findOne({
          sbuId,
          _id: { $ne: student._id },
        });

      if (existingStudent) {
        return res.status(409).json({
          success: false,
          message:
            "Another student already uses this SBU ID",
        });
      }

      student.sbuId = sbuId;
    }

    // Update fields
    if (course) student.course = course;

    if (year) student.year = year;

    if (fatherName)
      student.fatherName = fatherName;

    if (fatherMobile)
      student.fatherMobile = fatherMobile;

    await student.save();

    // Populate updated student
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
// DELETE STUDENT
// =================================================

export const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(
      req.params.id
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Decrease room occupancy
    const room = await Room.findById(
      student.roomId
    );

    if (
      room &&
      room.currentOccupancy > 0
    ) {
      room.currentOccupancy -= 1;

      if (room.status === "FULL") {
        room.status = "AVAILABLE";
      }

      await room.save();
    }

    // Delete student
    await Student.findByIdAndDelete(
      req.params.id
    );

    // Delete linked user account
    await User.findByIdAndDelete(
      student.userId
    );

    res.status(200).json({
      success: true,
      message:
        "Student and login account deleted successfully",
    });

  } catch (error) {
    console.error(
      "Delete student error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Server error while deleting student",
    });
  }
};