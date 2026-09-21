import crypto from "crypto";
import GatePass from "../models/gatePassModel.js";
import Student from "../models/studentModel.js";

// ======================================================
// STUDENT APPLIES FOR A GATE PASS
// ======================================================

export const createGatePass = async (req, res) => {
  try {
    const {
      purpose,
      passType,
      outDate,
      outTime,
      expectedInDate,
      expectedInTime,
    } = req.body;

    // Validate required fields
    if (
      !purpose ||
      !passType ||
      !outDate ||
      !outTime ||
      !expectedInDate ||
      !expectedInTime
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Purpose, passType, outDate, outTime, expectedInDate and expectedInTime are required",
      });
    }

    // Validate pass type
    if (!["HOME", "MARKET"].includes(passType)) {
      return res.status(400).json({
        success: false,
        message: "Pass type must be HOME or MARKET",
      });
    }

    // Find student profile using logged-in user
    const student = await Student.findOne({
      userId: req.user.userId,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    // Validate dates
    const outDateTime = new Date(`${outDate}T${outTime}`);

    const expectedInDateTime = new Date(
      `${expectedInDate}T${expectedInTime}`
    );

    if (
      Number.isNaN(outDateTime.getTime()) ||
      Number.isNaN(expectedInDateTime.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid date or time",
      });
    }

    // Return time must be after OUT time
    if (expectedInDateTime <= outDateTime) {
      return res.status(400).json({
        success: false,
        message: "Expected return time must be after out time",
      });
    }

    // Create gate pass
    const gatePass = await GatePass.create({
      studentId: student._id,
      purpose,
      passType,
      outDate: new Date(outDate),
      outTime,
      expectedInDate: new Date(expectedInDate),
      expectedInTime,
      parentPermission: false,
      status: "PENDING",
    });

    res.status(201).json({
      success: true,
      message: "Gate pass application submitted successfully",
      gatePass,
    });
  } catch (error) {
    console.error("Create gate pass error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while creating gate pass",
    });
  }
};


// ======================================================
// GET GATE PASSES
// ======================================================

export const getGatePasses = async (req, res) => {
  try {
    let query = {};

    // Student can see only their own passes
    if (req.user.role === "STUDENT") {
      const student = await Student.findOne({
        userId: req.user.userId,
      });

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student profile not found",
        });
      }

      query.studentId = student._id;
    }

    const gatePasses = await GatePass.find(query)
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
      .populate("approvedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: gatePasses.length,
      gatePasses,
    });
  } catch (error) {
    console.error("Get gate passes error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching gate passes",
    });
  }
};


// ======================================================
// GET ONE GATE PASS
// ======================================================

export const getGatePassById = async (req, res) => {
  try {
    const gatePass = await GatePass.findById(req.params.id)
      .populate({
        path: "studentId",
        populate: {
          path: "userId",
          select: "name email phone",
        },
      })
      .populate("approvedBy", "name email");

    if (!gatePass) {
      return res.status(404).json({
        success: false,
        message: "Gate pass not found",
      });
    }

    // Student can access only their own gate pass
    if (req.user.role === "STUDENT") {
      const student = await Student.findOne({
        userId: req.user.userId,
      });

      if (
        !student ||
        gatePass.studentId._id.toString() !== student._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You can access only your own gate pass",
        });
      }
    }

    res.status(200).json({
      success: true,
      gatePass,
    });
  } catch (error) {
    console.error("Get gate pass error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching gate pass",
    });
  }
};


// ======================================================
// WARDEN RECORDS PARENT PERMISSION
// ======================================================

export const recordParentPermission = async (req, res) => {
  try {
    const gatePass = await GatePass.findById(req.params.id);

    if (!gatePass) {
      return res.status(404).json({
        success: false,
        message: "Gate pass not found",
      });
    }

    if (gatePass.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message:
          "Parent permission can only be recorded for pending requests",
      });
    }

    gatePass.parentPermission = true;
    gatePass.parentPermissionAt = new Date();

    await gatePass.save();

    res.status(200).json({
      success: true,
      message: "Parent permission recorded successfully",
      gatePass,
    });
  } catch (error) {
    console.error("Record parent permission error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while recording parent permission",
    });
  }
};


// ======================================================
// WARDEN APPROVES GATE PASS
// ======================================================

export const approveGatePass = async (req, res) => {
  try {
    const gatePass = await GatePass.findById(req.params.id);

    if (!gatePass) {
      return res.status(404).json({
        success: false,
        message: "Gate pass not found",
      });
    }

    if (gatePass.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Only pending gate passes can be approved",
      });
    }

    if (!gatePass.parentPermission) {
      return res.status(400).json({
        success: false,
        message: "Parent permission is required before approval",
      });
    }

    // Generate secure unique QR token
    const qrToken = crypto.randomBytes(32).toString("hex");

    gatePass.status = "APPROVED";
    gatePass.approvedBy = req.user.userId;
    gatePass.approvedAt = new Date();
    gatePass.qrToken = qrToken;

    await gatePass.save();

    res.status(200).json({
      success: true,
      message: "Gate pass approved successfully",
      gatePass: {
        id: gatePass._id,
        studentId: gatePass.studentId,
        purpose: gatePass.purpose,
        passType: gatePass.passType,
        outDate: gatePass.outDate,
        outTime: gatePass.outTime,
        expectedInDate: gatePass.expectedInDate,
        expectedInTime: gatePass.expectedInTime,
        status: gatePass.status,
        qrToken: gatePass.qrToken,
      },
    });
  } catch (error) {
    console.error("Approve gate pass error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while approving gate pass",
    });
  }
};


// ======================================================
// WARDEN REJECTS GATE PASS
// ======================================================

export const rejectGatePass = async (req, res) => {
  try {
    const gatePass = await GatePass.findById(req.params.id);

    if (!gatePass) {
      return res.status(404).json({
        success: false,
        message: "Gate pass not found",
      });
    }

    if (gatePass.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Only pending gate passes can be rejected",
      });
    }

    gatePass.status = "REJECTED";

    gatePass.rejectionReason =
      req.body.reason || "Gate pass rejected";

    gatePass.approvedBy = req.user.userId;
    gatePass.approvedAt = new Date();

    await gatePass.save();

    res.status(200).json({
      success: true,
      message: "Gate pass rejected successfully",
      gatePass,
    });
  } catch (error) {
    console.error("Reject gate pass error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while rejecting gate pass",
    });
  }
};


// ======================================================
// GUARD RECORDS STUDENT OUT
// ======================================================

export const markGatePassOut = async (req, res) => {
  try {
    const { qrToken } = req.body;

    if (!qrToken) {
      return res.status(400).json({
        success: false,
        message: "QR token is required",
      });
    }

    const gatePass = await GatePass.findOne({ qrToken });

    if (!gatePass) {
      return res.status(404).json({
        success: false,
        message: "Invalid QR token",
      });
    }

    if (gatePass.status !== "APPROVED") {
      return res.status(400).json({
        success: false,
        message: `Gate pass cannot be used. Current status: ${gatePass.status}`,
      });
    }

    const now = new Date();

    const outDate = new Date(gatePass.outDate);

    const outDateString = outDate.toISOString().split("T")[0];

    const currentDateString = now.toISOString().split("T")[0];

    if (currentDateString !== outDateString) {
      return res.status(400).json({
        success: false,
        message: "Gate pass is not valid for today",
      });
    }

    gatePass.status = "OUT";
    gatePass.actualOutTime = now;

    await gatePass.save();

    res.status(200).json({
      success: true,
      message: "Student OUT recorded successfully",
      gatePass: {
        id: gatePass._id,
        studentId: gatePass.studentId,
        purpose: gatePass.purpose,
        passType: gatePass.passType,
        status: gatePass.status,
        actualOutTime: gatePass.actualOutTime,
      },
    });
  } catch (error) {
    console.error("Mark gate pass OUT error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while recording student OUT",
    });
  }
};


// ======================================================
// GUARD RECORDS STUDENT IN / RETURN
// ======================================================

export const markGatePassIn = async (req, res) => {
  try {
    const { qrToken } = req.body;

    if (!qrToken) {
      return res.status(400).json({
        success: false,
        message: "QR token is required",
      });
    }

    const gatePass = await GatePass.findOne({ qrToken });

    if (!gatePass) {
      return res.status(404).json({
        success: false,
        message: "Invalid QR token",
      });
    }

    // Student must be OUT before returning
    if (gatePass.status !== "OUT") {
      return res.status(400).json({
        success: false,
        message: `Student cannot be marked IN. Current status: ${gatePass.status}`,
      });
    }

    gatePass.status = "RETURNED";
    gatePass.actualInTime = new Date();

    await gatePass.save();

    res.status(200).json({
      success: true,
      message: "Student IN recorded successfully",
      gatePass: {
        id: gatePass._id,
        studentId: gatePass.studentId,
        purpose: gatePass.purpose,
        passType: gatePass.passType,
        status: gatePass.status,
        actualOutTime: gatePass.actualOutTime,
        actualInTime: gatePass.actualInTime,
      },
    });
  } catch (error) {
    console.error("Mark gate pass IN error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while recording student IN",
    });
  }
};