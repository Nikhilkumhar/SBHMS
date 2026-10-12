import CollegeMovement from "../models/CollegeMovement.js";
import { closeStaleCollegeMovements } from "../services/collegeMovementService.js";
import Student from "../models/studentModel.js";

// ======================================================
// RECORD COLLEGE OUT
// ======================================================

export const recordCollegeOut = async (req, res) => {
  try {
    await closeStaleCollegeMovements();
    const { sbuId, remarks } = req.body;

    if (!sbuId) {
      return res.status(400).json({
        success: false,
        message: "SBU ID is required",
      });
    }

    const student = await Student.findOne({ sbuId });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found with this SBU ID",
      });
    }

    const activeMovement = await CollegeMovement.findOne({
      studentId: student._id,
      status: "OUT",
    });

    if (activeMovement) {
      return res.status(400).json({
        success: false,
        message: "Student is already marked OUT for college",
      });
    }

    const now = new Date();

    const movement = await CollegeMovement.create({
      studentId: student._id,
      date: now,
      outTime: now,
      status: "OUT",
      recordedOutBy: req.user.userId,
      remarks,
    });

    res.status(201).json({
      success: true,
      message: "College OUT recorded successfully",
      movement,
      student: {
        id: student._id,
        sbuId: student.sbuId,
        course: student.course,
      },
    });
  } catch (error) {
    console.error("Record college OUT error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while recording college OUT",
    });
  }
};

// ======================================================
// RECORD COLLEGE IN
// ======================================================

export const recordCollegeIn = async (req, res) => {
  try {
    await closeStaleCollegeMovements();
    const { sbuId, remarks } = req.body;

    if (!sbuId) {
      return res.status(400).json({
        success: false,
        message: "SBU ID is required",
      });
    }

    const student = await Student.findOne({ sbuId });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found with this SBU ID",
      });
    }

    const movement = await CollegeMovement.findOne({
      studentId: student._id,
      status: "OUT",
    }).sort({ outTime: -1 });

    if (!movement) {
      return res.status(400).json({
        success: false,
        message: "Student does not have an active college OUT entry",
      });
    }

    const now = new Date();

    movement.inTime = now;
    movement.status = "IN";
    movement.recordedInBy = req.user.userId;

    if (remarks) {
      movement.remarks = remarks;
    }

    await movement.save();

    res.status(200).json({
      success: true,
      message: "College IN recorded successfully",
      movement,
      student: {
        id: student._id,
        sbuId: student.sbuId,
        course: student.course,
      },
    });
  } catch (error) {
    console.error("Record college IN error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while recording college IN",
    });
  }
};

// ======================================================
// GET ALL COLLEGE MOVEMENTS
// ======================================================

export const getCollegeMovements = async (req, res) => {
  try {

    const movements = await CollegeMovement.find()
      .populate({
        path: "studentId",
        populate: [
          {
            path: "userId",
            select: "name email phone",
          },
          {
            path: "hostelId",
            select: "name code",
          },
          {
            path: "roomId",
            select: "roomNumber floor",
          },
        ],
      })
      .populate("recordedOutBy", "name email role")
      .populate("recordedInBy", "name email role")
      .populate("correctedBy", "name email role")
      .sort({ outTime: -1 });

    res.status(200).json({
      success: true,
      count: movements.length,
      movements,
    });
  } catch (error) {
    console.error("Get college movements error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching college movements",
    });
  }
};

// ======================================================
// GET STUDENTS CURRENTLY OUT
// ======================================================

export const getStudentsCurrentlyOut = async (req, res) => {
  try {
    await closeStaleCollegeMovements();
    const movements = await CollegeMovement.find({
      status: "OUT",
    })
      .populate({
        path: "studentId",
        populate: [
          {
            path: "userId",
            select: "name email phone",
          },
          {
            path: "hostelId",
            select: "name code",
          },
          {
            path: "roomId",
            select: "roomNumber floor",
          },
        ],
      })
      .sort({ outTime: -1 });

    res.status(200).json({
      success: true,
      count: movements.length,
      movements,
    });
  } catch (error) {
    console.error("Get students currently out error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching students currently out",
    });
  }
};

// ======================================================
// GET COLLEGE DAILY REPORT
// ======================================================

export const getCollegeDailyReport = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required. Use YYYY-MM-DD format",
      });
    }

    const [year, month, day] = date.split("-").map(Number);

    const startOfDay = new Date(year, month - 1, day);
    const endOfDay = new Date(year, month - 1, day + 1);

    const movements = await CollegeMovement.find({
      date: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    })
      .populate({
        path: "studentId",
        populate: [
          {
            path: "userId",
            select: "name email phone",
          },
          {
            path: "hostelId",
            select: "name code",
          },
          {
            path: "roomId",
            select: "roomNumber floor",
          },
        ],
      })
      .populate("recordedOutBy", "name role")
      .populate("recordedInBy", "name role")
      .populate("correctedBy", "name role")
      .sort({ outTime: 1 });

    const totalMovements = movements.length;

    const currentlyOut = movements.filter(
      (movement) => movement.status === "OUT"
    ).length;

    const returnedIn = movements.filter(
      (movement) => movement.status === "IN"
    ).length;

    const studentsWentOut = movements.length;

    res.status(200).json({
      success: true,
      date,

      summary: {
        totalMovements,
        studentsWentOut,
        returnedIn,
        currentlyOut,
      },

      movements,
    });
  } catch (error) {
    console.error("Get college daily report error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while generating college daily report",
    });
  }
};

// ======================================================
// MANUAL COLLEGE MOVEMENT CORRECTION
// ======================================================

export const correctCollegeMovement = async (req, res) => {
  try {
    await closeStaleCollegeMovements();
    const {
      sbuId,
      correctionType,
      correctionReason,
    } = req.body;

    if (!sbuId) {
      return res.status(400).json({
        success: false,
        message: "SBU ID is required",
      });
    }

    if (!correctionType) {
      return res.status(400).json({
        success: false,
        message: "Correction type is required",
      });
    }

    if (!["IN", "OUT"].includes(correctionType)) {
      return res.status(400).json({
        success: false,
        message: "Correction type must be IN or OUT",
      });
    }

    if (!correctionReason || !correctionReason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Correction reason is required",
      });
    }

    const student = await Student.findOne({ sbuId });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found with this SBU ID",
      });
    }

    const now = new Date();

    // ==================================================
    // MANUALLY MARK STUDENT IN
    // ==================================================

    if (correctionType === "IN") {
      const movement = await CollegeMovement.findOne({
        studentId: student._id,
        status: "OUT",
      }).sort({ outTime: -1 });

      if (!movement) {
        return res.status(400).json({
          success: false,
          message:
            "No active college OUT movement found for this student",
        });
      }

      movement.inTime = now;
      movement.status = "IN";
      movement.recordedInBy = req.user.userId;
      movement.isCorrected = true;
      movement.correctionReason = correctionReason.trim();
      movement.correctedBy = req.user.userId;
      movement.correctedAt = now;

      await movement.save();

      return res.status(200).json({
        success: true,
        message: "College IN corrected successfully",
        correctionType: "IN",
        movement,

        student: {
          id: student._id,
          sbuId: student.sbuId,
          course: student.course,
        },
      });
    }

    // ==================================================
    // MANUALLY MARK STUDENT OUT
    // ==================================================

    if (correctionType === "OUT") {
      const activeMovement = await CollegeMovement.findOne({
        studentId: student._id,
        status: "OUT",
      });

      if (activeMovement) {
        return res.status(400).json({
          success: false,
          message: "Student is already marked OUT for college",
        });
      }

      const movement = await CollegeMovement.create({
        studentId: student._id,
        date: now,
        outTime: now,
        status: "OUT",
        recordedOutBy: req.user.userId,
        isCorrected: true,
        correctionReason: correctionReason.trim(),
        correctedBy: req.user.userId,
        correctedAt: now,
      });

      return res.status(201).json({
        success: true,
        message: "College OUT corrected successfully",
        correctionType: "OUT",
        movement,

        student: {
          id: student._id,
          sbuId: student.sbuId,
          course: student.course,
        },
      });
    }
  } catch (error) {
    console.error("Correct college movement error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while correcting college movement",
    });
  }
};

// ======================================================
// GET LOGGED-IN STUDENT COLLEGE MOVEMENTS
// ======================================================

export const getMyCollegeMovements = async (req, res) => {
  try {
    await closeStaleCollegeMovements();
    // Get logged-in user's ID from JWT
    const userId = req.user.userId;

    // Find the student connected to this user
    const student = await Student.findOne({ userId })
      .populate("userId", "name email phone role")
      .populate("hostelId", "name code")
      .populate("roomId", "roomNumber floor capacity");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    // Get only this student's college movement records
    const movements = await CollegeMovement.find({
      studentId: student._id,
    })
      .populate("recordedOutBy", "name email role")
      .populate("recordedInBy", "name email role")
      .populate("correctedBy", "name email role")
      .sort({ outTime: -1 });

    // Check if the student is currently OUT
    const activeMovement = movements.find(
      (movement) => movement.status === "OUT"
    );

    res.status(200).json({
      success: true,

      student: {
        id: student._id,
        name: student.userId?.name,
        sbuId: student.sbuId,
        email: student.userId?.email,
        phone: student.userId?.phone,
        course: student.course,
        year: student.year,

        hostel: student.hostelId,
        room: student.roomId,
      },

      currentStatus: activeMovement
        ? "OUT"
        : "IN_HOSTEL",

      activeMovement: activeMovement || null,

      count: movements.length,

      movements,
    });
  } catch (error) {
    console.error(
      "Get my college movements error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Server error while fetching your college movements",
    });
  }
};