import mongoose from "mongoose";
import { closeStaleCollegeMovements } from "../services/collegeMovementService.js";
import Attendance from "../models/attendanceModel.js";
import Student from "../models/studentModel.js";
import Hostel from "../models/hostelModel.js";
import GatePass from "../models/gatePassModel.js";
import CollegeMovement from "../models/CollegeMovement.js";

// ======================================================
// MARK SINGLE ATTENDANCE
// ======================================================

export const markAttendance = async (req, res) => {
  try {
    const {
      studentId,
      hostelId,
      date,
      status,
      remarks,
    } = req.body;

    if (!studentId || !hostelId || !date || !status) {
      return res.status(400).json({
        success: false,
        message: "studentId, hostelId, date and status are required",
      });
    }

    if (!["PRESENT", "ABSENT"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be PRESENT or ABSENT",
      });
    }

    if (
      !mongoose.isValidObjectId(studentId) ||
      !mongoose.isValidObjectId(hostelId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid studentId or hostelId",
      });
    }

    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }
    if (student.status === "LEFT") {
      return res.status(400).json({
        success: false,
        message: "This student has left the hostel",
      });
    }

    const hostel = await Hostel.findById(hostelId);

    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: "Hostel not found",
      });
    }

    // Student must belong to the selected hostel
    if (student.hostelId?.toString() !== hostelId.toString()) {
      return res.status(400).json({
        success: false,
        message: "This student does not belong to the selected hostel",
      });
    }

    const attendanceDate = new Date(date);

    if (isNaN(attendanceDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date",
      });
    }

    attendanceDate.setHours(0, 0, 0, 0);

    const existingAttendance = await Attendance.findOne({
      studentId,
      date: attendanceDate,
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message:
          "Attendance already marked for this student on this date",
      });
    }

    const attendance = await Attendance.create({
      studentId,
      hostelId,
      date: attendanceDate,
      status,
      markedBy: req.user.userId,
      markedAt: new Date(),
      remarks,
    });

    await attendance.populate([
      {
        path: "studentId",
        populate: {
          path: "userId",
          select: "name email phone",
        },
      },
      {
        path: "hostelId",
        select: "name code",
      },
      {
        path: "markedBy",
        select: "name email role",
      },
    ]);

    res.status(201).json({
      success: true,
      message: "Attendance marked successfully",
      attendance,
    });
  } catch (error) {
    console.error("Mark attendance error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "Attendance already exists for this student on this date",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while marking attendance",
    });
  }
};


// ======================================================
// MARK BULK ATTENDANCE (save / update)
// ======================================================
// Safe to call many times for the same hostel + date:
//  - students with no record yet  -> a new record is created
//  - students already saved       -> their record is updated
// So a warden can mark the forgotten student later, or correct a mistake.

export const markBulkAttendance = async (req, res) => {
  try {
    const { hostelId, date, attendance } = req.body;

    if (!hostelId || !date || !attendance) {
      return res.status(400).json({
        success: false,
        message: "hostelId, date and attendance are required",
      });
    }

    if (!Array.isArray(attendance) || attendance.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Attendance must be a non-empty array",
      });
    }

    if (!mongoose.isValidObjectId(hostelId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hostel ID",
      });
    }

    const hostel = await Hostel.findById(hostelId);

    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: "Hostel not found",
      });
    }

    const attendanceDate = new Date(date);

    if (isNaN(attendanceDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date",
      });
    }

    attendanceDate.setHours(0, 0, 0, 0);

    for (const item of attendance) {
      if (!item.studentId || !item.status) {
        return res.status(400).json({
          success: false,
          message: "Every attendance item must contain studentId and status",
        });
      }

      if (!mongoose.isValidObjectId(item.studentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid student ID in attendance list",
        });
      }

      if (!["PRESENT", "ABSENT"].includes(item.status)) {
        return res.status(400).json({
          success: false,
          message: "Attendance status must be PRESENT or ABSENT",
        });
      }
    }

    const studentIds = attendance.map((item) => item.studentId);

    if (new Set(studentIds).size !== studentIds.length) {
      return res.status(400).json({
        success: false,
        message: "Duplicate studentId found in attendance request",
      });
    }

    const students = await Student.find({ _id: { $in: studentIds } });

    if (students.length !== studentIds.length) {
      return res.status(404).json({
        success: false,
        message: "One or more students were not found",
      });
    }

    const studentsFromOtherHostel = students.filter(
      (student) => student.hostelId?.toString() !== hostelId.toString()
    );

    if (studentsFromOtherHostel.length > 0) {
      return res.status(400).json({
        success: false,
        message: "One or more students do not belong to the selected hostel",
        studentIds: studentsFromOtherHostel.map((student) => student._id),
      });
    }

    if (students.some((student) => student.status === "LEFT")) {
      return res.status(400).json({
        success: false,
        message: "One or more students have left the hostel",
      });
    }

    // Create new records, or update the ones that already exist
    const now = new Date();

    const operations = attendance.map((item) => {
      const remarks =
        typeof item.remarks === "string" ? item.remarks.trim() : "";

      const update = {
        $set: {
          hostelId,
          status: item.status,
          markedBy: req.user.userId,
          markedAt: now,
        },
      };

      if (remarks) {
        update.$set.remarks = remarks;
      } else {
        update.$unset = { remarks: "" };
      }

      return {
        updateOne: {
          filter: { studentId: item.studentId, date: attendanceDate },
          update,
          upsert: true,
        },
      };
    });

    const result = await Attendance.bulkWrite(operations);

    const newlyMarked = result.upsertedCount || 0;
    const updated = attendance.length - newlyMarked;

    res.status(200).json({
      success: true,
      message:
        updated > 0
          ? `Attendance saved (${newlyMarked} new, ${updated} updated)`
          : `Attendance saved for ${newlyMarked} student${
              newlyMarked === 1 ? "" : "s"
            }`,
      summary: {
        totalMarked: attendance.length,
        newlyMarked,
        updated,
        present: attendance.filter((item) => item.status === "PRESENT").length,
        absent: attendance.filter((item) => item.status === "ABSENT").length,
      },
    });
  } catch (error) {
    console.error("Mark bulk attendance error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while saving attendance",
    });
  }
};


// ======================================================
// GET ATTENDANCE ROSTER
// ======================================================

export const getAttendanceRoster = async (req, res) => {
  try {
    await closeStaleCollegeMovements();
    const { date, hostelId } = req.query;

    if (!hostelId) {
      return res.status(400).json({
        success: false,
        message: "hostelId is required",
      });
    }

    const hostel = await Hostel.findById(hostelId);

    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: "Hostel not found",
      });
    }

    // --------------------------------------------------
    // Attendance date
    // --------------------------------------------------

    const rosterDate = date
      ? new Date(date)
      : new Date();

    if (isNaN(rosterDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date",
      });
    }

    rosterDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(rosterDate);
    nextDay.setDate(nextDay.getDate() + 1);


    // --------------------------------------------------
    // Get all hostel students
    // --------------------------------------------------

    const students = await Student.find({
      hostelId,
      status: { $ne: "LEFT" },
    })
      .populate({
        path: "userId",
        select: "name email phone",
      })
      .populate({
        path: "roomId",
        select: "roomNumber floor",
      })
      .sort({ createdAt: 1 });


    // --------------------------------------------------
    // HOME gate passes currently OUT
    //
    // ONLY these students are excluded
    // from hostel attendance.
    // --------------------------------------------------

    const homeOutsidePasses = await GatePass.find({
      studentId: {
        $in: students.map((student) => student._id),
      },
      passType: "HOME",
      status: "OUT",
    }).select(
      "studentId purpose outDate expectedInDate expectedInTime actualOutTime"
    );

    const homeOutsideIds = new Set(
      homeOutsidePasses.map(
        (pass) => pass.studentId.toString()
      )
    );


    // --------------------------------------------------
    // MARKET students currently OUT
    //
    // Informational only.
    // They ARE counted in attendance.
    // --------------------------------------------------

    const marketOutsidePasses = await GatePass.find({
      studentId: {
        $in: students.map((student) => student._id),
      },
      passType: "MARKET",
      status: "OUT",
    }).select("studentId purpose actualOutTime");

    const marketOutsideIds = new Set(
      marketOutsidePasses.map(
        (pass) => pass.studentId.toString()
      )
    );


    // --------------------------------------------------
    // COLLEGE students currently OUT
    //
    // Informational only.
    // They ARE counted in attendance.
    // --------------------------------------------------

    const collegeOutsideMovements =
      await CollegeMovement.find({
        studentId: {
          $in: students.map((student) => student._id),
        },
        status: "OUT",
      }).select(
        "studentId outTime"
      );

    const collegeOutsideIds = new Set(
      collegeOutsideMovements.map(
        (movement) => movement.studentId.toString()
      )
    );


    // --------------------------------------------------
    // Existing attendance
    // --------------------------------------------------

    const existingAttendance = await Attendance.find({
      hostelId,
      date: rosterDate,
    }).select(
      "studentId status markedAt remarks"
    );

    const attendanceMap = new Map();

    existingAttendance.forEach((record) => {
      attendanceMap.set(
        record.studentId.toString(),
        record
      );
    });


    // --------------------------------------------------
    // Create attendance roster
    // --------------------------------------------------

    const roster = [];

    const excludedHomeStudents = [];

    for (const student of students) {
      const studentId = student._id.toString();

      const isHomeOutside =
        homeOutsideIds.has(studentId);

      const isMarketOutside =
        marketOutsideIds.has(studentId);

      const isCollegeOutside =
        collegeOutsideIds.has(studentId);

      // ----------------------------------------------
      // HOME + OUT
      // Exclude from attendance roster
      // ----------------------------------------------

      if (isHomeOutside) {
        const homePass = homeOutsidePasses.find(
          (pass) =>
            pass.studentId.toString() === studentId
        );

        excludedHomeStudents.push({
          studentId: student._id,
          name: student.userId?.name,
          sbuId: student.sbuId,
          roomNumber: student.roomId?.roomNumber,
          purpose: homePass?.purpose,
          outDate: homePass?.outDate,
          expectedInDate: homePass?.expectedInDate,
          expectedInTime: homePass?.expectedInTime,
          actualOutTime: homePass?.actualOutTime,
        });

        continue;
      }


      // ----------------------------------------------
      // Everyone else is expected for attendance
      // ----------------------------------------------

      const attendanceRecord =
        attendanceMap.get(studentId);

      roster.push({
        studentId: student._id,
        name: student.userId?.name,
        sbuId: student.sbuId,
        phone: student.userId?.phone,
        roomNumber: student.roomId?.roomNumber,
        floor: student.roomId?.floor,

        // Attendance status
        attendanceStatus:
          attendanceRecord?.status || "NOT_MARKED",

        attendanceId:
          attendanceRecord?._id || null,

        markedAt:
          attendanceRecord?.markedAt || null,

        remarks:
          attendanceRecord?.remarks || null,

        // Movement information
        isMarketOutside,
        isCollegeOutside,

        movementStatus:
          isMarketOutside
            ? "MARKET_OUT"
            : isCollegeOutside
              ? "COLLEGE_OUT"
              : "HOSTEL",
      });
    }


    // --------------------------------------------------
    // Final summary
    // --------------------------------------------------

    const totalStudents = students.length;

    const homeOutside =
      homeOutsideIds.size;

    const marketOutside =
      marketOutsideIds.size;

    const collegeCurrentlyOut =
      collegeOutsideIds.size;

    const expectedAttendance =
      totalStudents - homeOutside;

    const markedAttendance =
      roster.filter(
        (student) =>
          student.attendanceStatus !== "NOT_MARKED"
      ).length;

    const present =
      roster.filter(
        (student) =>
          student.attendanceStatus === "PRESENT"
      ).length;

    const absent =
      roster.filter(
        (student) =>
          student.attendanceStatus === "ABSENT"
      ).length;

    const notMarked =
      roster.filter(
        (student) =>
          student.attendanceStatus === "NOT_MARKED"
      ).length;


    res.status(200).json({
      success: true,

      date: rosterDate,

      hostel: {
        id: hostel._id,
        name: hostel.name,
        code: hostel.code,
      },

      summary: {
        totalStudents,

        // Only HOME + OUT is deducted
        homeOutside,

        // These are NOT deducted
        marketOutside,
        collegeCurrentlyOut,

        expectedAttendance,

        markedAttendance,
        present,
        absent,
        notMarked,
      },

      // Students who should be included
      roster,

      // Students excluded because they are HOME + OUT
      excludedHomeStudents,
    });

  } catch (error) {
    console.error(
      "Get attendance roster error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Server error while generating attendance roster",
    });
  }
};


// ======================================================
// GET ATTENDANCE BY DATE
// ======================================================

export const getAttendanceByDate = async (req, res) => {
  try {
    const { date, hostelId } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required",
      });
    }

    const attendanceDate = new Date(date);

    if (isNaN(attendanceDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date",
      });
    }

    attendanceDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(attendanceDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const filter = {
      date: {
        $gte: attendanceDate,
        $lt: nextDay,
      },
    };

    if (hostelId) {
      filter.hostelId = hostelId;
    }

    const attendance = await Attendance.find(filter)
      .populate({
        path: "studentId",
        populate: [
          {
            path: "userId",
            select: "name email phone",
          },
          {
            path: "roomId",
            select: "roomNumber floor",
          },
        ],
      })
      .populate("hostelId", "name code")
      .populate("markedBy", "name email role")
      .sort({ createdAt: 1 });

    const present = attendance.filter(
      (item) => item.status === "PRESENT"
    ).length;

    const absent = attendance.filter(
      (item) => item.status === "ABSENT"
    ).length;

    res.status(200).json({
      success: true,
      date,
      summary: {
        totalMarked: attendance.length,
        present,
        absent,
      },
      attendance,
    });
  } catch (error) {
    console.error(
      "Get attendance by date error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Server error while fetching attendance",
    });
  }
};


// ======================================================
// GET STUDENT ATTENDANCE
// ======================================================

export const getStudentAttendance = async (req, res) => {
  try {
    let { studentId } = req.params;

    // A student can only see THEIR OWN attendance
    if (req.user.role === "STUDENT") {
      const myProfile = await Student.findOne({
        userId: req.user.userId,
      }).select("_id");

      if (!myProfile) {
        return res.status(404).json({
          success: false,
          message: "Student profile not found",
        });
      }

      if (studentId !== myProfile._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You can view only your own attendance",
        });
      }
    }

    // Warden / Admin: check the ID is valid
    if (!mongoose.isValidObjectId(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    const attendance = await Attendance.find({ studentId })
      .populate("hostelId", "name code")
      .populate("markedBy", "name email role")
      .sort({ date: -1 });

    const present = attendance.filter(
      (item) => item.status === "PRESENT"
    ).length;

    const absent = attendance.length - present;

    res.status(200).json({
      success: true,
      count: attendance.length,
      summary: {
        total: attendance.length,
        present,
        absent,
        percentage:
          attendance.length > 0
            ? Math.round((present / attendance.length) * 100)
            : 0,
      },
      attendance,
    });
  } catch (error) {
    console.error("Get student attendance error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching student attendance",
    });
  }
};