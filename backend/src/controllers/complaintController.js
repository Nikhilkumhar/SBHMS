import crypto from "crypto";
import mongoose from "mongoose";

import Complaint, {
  COMPLAINT_CATEGORIES,
  COMPLAINT_SEVERITIES,
  COMPLAINT_RECIPIENTS,
  COMPLAINT_STATUSES,
  OPEN_STATUSES,
  SEVERITY_PRIORITY,
} from "../models/complaintModel.js";
import Student from "../models/studentModel.js";
import { notifyDsw } from "../services/complaintNotifier.js";

/* ========== HELPERS ========== */

const makeComplaintNo = () => {
  const yymm = new Date().toISOString().slice(2, 7).replace("-", "");
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();

  return `CMP-${yymm}-${random}`;
};

/*
  WHO CAN RECEIVE A COMPLAINT

  - Normal complaints (room, bathroom, water, laundry, other):
      Warden and/or Admin only.
  - Serious complaints (ragging, or severity HIGH / CRITICAL):
      Warden, Admin and/or DSW - the student chooses.
*/
export const isSeriousComplaint = (category, severity) =>
  category === "RAGGING" || ["HIGH", "CRITICAL"].includes(severity);

const resolveRecipients = (category, severity, requested) => {
  const allowed = isSeriousComplaint(category, severity)
    ? COMPLAINT_RECIPIENTS
    : ["WARDEN", "ADMIN"];

  const list =
    Array.isArray(requested) && requested.length > 0
      ? [...new Set(requested.map(String))]
      : ["WARDEN", "ADMIN"];

  if (list.some((recipient) => !allowed.includes(recipient))) {
    return {
      error: allowed.includes("DSW")
        ? "Invalid recipient selected"
        : "DSW can only be contacted for ragging or serious (high / critical) complaints",
    };
  }

  return { list };
};

const validObjectId = (id) => mongoose.isValidObjectId(id);

const getStudent = (userId) => Student.findOne({ userId });

const STUDENT_POPULATE = {
  path: "studentId",
  select: "sbuId course year hostelId roomId userId",
  populate: [
    { path: "userId", select: "name phone email" },
    { path: "hostelId", select: "name code" },
    { path: "roomId", select: "roomNumber floor" },
  ],
};

const serverError = (res, label, error, message) => {
  console.error(`${label}:`, error);

  return res.status(500).json({ success: false, message });
};

/* ========== STUDENT: SUBMIT A COMPLAINT ========== */

export const createComplaint = async (req, res) => {
  try {
    const { category, severity, sentTo } = req.body;
    const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
    const description =
      typeof req.body.description === "string" ? req.body.description.trim() : "";

    if (!COMPLAINT_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Please choose a valid complaint category",
      });
    }

    if (title.length < 3 || title.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Title must be between 3 and 100 characters",
      });
    }

    if (description.length < 10 || description.length > 1500) {
      return res.status(400).json({
        success: false,
        message: "Description must be between 10 and 1500 characters",
      });
    }

    // Ragging is always treated as critical
    const finalSeverity =
      category === "RAGGING"
        ? "CRITICAL"
        : COMPLAINT_SEVERITIES.includes(severity)
        ? severity
        : "MEDIUM";

    const recipients = resolveRecipients(category, finalSeverity, sentTo);

    if (recipients.error) {
      return res.status(400).json({ success: false, message: recipients.error });
    }

    const student = await getStudent(req.user.userId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    if (student.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Only active hostel students can submit complaints",
      });
    }

    const sendsToDsw = recipients.list.includes("DSW");
    const sentToLabel = recipients.list
      .map((r) => r.charAt(0) + r.slice(1).toLowerCase())
      .join(", ")
      .replace("Dsw", "DSW");

    let complaint;

    // Retry in the (very unlikely) case of a duplicate complaint number
    for (let attempt = 0; attempt < 3 && !complaint; attempt++) {
      try {
        complaint = await Complaint.create({
          complaintNo: makeComplaintNo(),
          studentId: student._id,
          hostelId: student.hostelId,
          roomId: student.roomId,
          category,
          title,
          description,
          severity: finalSeverity,
          priority: SEVERITY_PRIORITY[finalSeverity],
          sentTo: recipients.list,
          status: "PENDING",
          dswEmail: { status: sendsToDsw ? "PENDING" : "NOT_REQUIRED" },
          timeline: [
            {
              action: "CREATED",
              status: "PENDING",
              note: `Complaint submitted to ${sentToLabel}`,
              byUserId: req.user.userId,
              byRole: "STUDENT",
            },
          ],
        });
      } catch (error) {
        if (error.code !== 11000 || attempt === 2) throw error;
      }
    }

    res.status(201).json({
      success: true,
      message: "Complaint submitted successfully",
      complaint,
    });

    // Email the DSW in the background - the student does not wait for it
    if (sendsToDsw) {
      notifyDsw(complaint._id);
    }
  } catch (error) {
    return serverError(
      res,
      "Create complaint error",
      error,
      "Server error while submitting complaint"
    );
  }
};

/* ========== LIST COMPLAINTS ==========
   Student -> own complaints
   Warden / Admin -> complaints sent to their role */

export const getComplaints = async (req, res) => {
  try {
    const { role, userId } = req.user;
    const { status, category, severity } = req.query;

    const query = {};

    if (role === "STUDENT") {
      const student = await getStudent(userId);

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student profile not found",
        });
      }

      query.studentId = student._id;
    } else {
      query.sentTo = role;
    }

    if (COMPLAINT_STATUSES.includes(status)) query.status = status;
    if (COMPLAINT_CATEGORIES.includes(category)) query.category = category;
    if (COMPLAINT_SEVERITIES.includes(severity)) query.severity = severity;

    let finder = Complaint.find(query);

    if (role !== "STUDENT") {
      finder = finder.populate(STUDENT_POPULATE);
    }

    const complaints = await finder
      .sort(role === "STUDENT" ? { createdAt: -1 } : { priority: -1, createdAt: -1 })
      .limit(300);

    res.status(200).json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    return serverError(
      res,
      "Get complaints error",
      error,
      "Server error while fetching complaints"
    );
  }
};

/* ========== ONE COMPLAINT (with full tracking timeline) ========== */

export const getComplaintById = async (req, res) => {
  try {
    if (!validObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid complaint id" });
    }

    const complaint = await Complaint.findById(req.params.id).populate(STUDENT_POPULATE);

    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    if (req.user.role === "STUDENT") {
      const student = await getStudent(req.user.userId);

      if (!student || complaint.studentId._id.toString() !== student._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You can access only your own complaints",
        });
      }
    } else if (!complaint.sentTo.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "This complaint was not sent to you",
      });
    }

    res.status(200).json({ success: true, complaint });
  } catch (error) {
    return serverError(
      res,
      "Get complaint error",
      error,
      "Server error while fetching complaint"
    );
  }
};

/* ========== WARDEN / ADMIN: UPDATE STATUS ==========
   PENDING -> IN_PROGRESS -> RESOLVED / REJECTED */

export const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const note = typeof req.body.note === "string" ? req.body.note.trim() : "";

    if (!validObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid complaint id" });
    }

    if (!["IN_PROGRESS", "RESOLVED", "REJECTED"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be IN_PROGRESS, RESOLVED or REJECTED",
      });
    }

    // The student sees this note, so closing a complaint needs one
    if (["RESOLVED", "REJECTED"].includes(status) && note.length < 3) {
      return res.status(400).json({
        success: false,
        message:
          status === "RESOLVED"
            ? "Please describe how the complaint was resolved"
            : "Please give a reason for rejecting the complaint",
      });
    }

    if (note.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Note must be 500 characters or less",
      });
    }

    const closing = ["RESOLVED", "REJECTED"].includes(status);

    // Atomic: only open complaints sent to this role can be changed
    const updated = await Complaint.findOneAndUpdate(
      {
        _id: id,
        sentTo: req.user.role,
        status: { $in: OPEN_STATUSES },
      },
      {
        $set: {
          status,
          ...(closing && {
            resolutionNote: note,
            resolvedBy: req.user.userId,
            resolvedAt: new Date(),
          }),
        },
        $push: {
          timeline: {
            action: "STATUS_CHANGED",
            status,
            note: note || undefined,
            byUserId: req.user.userId,
            byRole: req.user.role,
          },
        },
      },
      { new: true }
    ).populate(STUDENT_POPULATE);

    if (!updated) {
      const exists = await Complaint.findById(id).select("sentTo status");

      if (!exists || !exists.sentTo.includes(req.user.role)) {
        return res.status(404).json({ success: false, message: "Complaint not found" });
      }

      return res.status(400).json({
        success: false,
        message: `This complaint is already ${exists.status.replace("_", " ").toLowerCase()}`,
      });
    }

    res.status(200).json({
      success: true,
      message: "Complaint updated successfully",
      complaint: updated,
    });
  } catch (error) {
    return serverError(
      res,
      "Update complaint error",
      error,
      "Server error while updating complaint"
    );
  }
};

/* ========== WARDEN: ESCALATE TO ADMIN ==========
   (e.g. a ragging case the student sent only to the warden) */

export const escalateComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const note = typeof req.body.note === "string" ? req.body.note.trim() : "";

    if (!validObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid complaint id" });
    }

    const complaint = await Complaint.findOne({
      _id: id,
      sentTo: "WARDEN",
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    if (complaint.sentTo.includes("ADMIN")) {
      return res.status(400).json({
        success: false,
        message: "This complaint is already visible to the admin",
      });
    }

    if (!OPEN_STATUSES.includes(complaint.status)) {
      return res.status(400).json({
        success: false,
        message: "Only open complaints can be escalated",
      });
    }

    complaint.sentTo.push("ADMIN");
    complaint.timeline.push({
      action: "ESCALATED",
      status: complaint.status,
      note: note ? `Escalated to Admin: ${note}` : "Escalated to Admin by the Warden",
      byUserId: req.user.userId,
      byRole: "WARDEN",
    });

    await complaint.save();

    res.status(200).json({
      success: true,
      message: "Complaint escalated to the admin",
      complaint,
    });
  } catch (error) {
    return serverError(
      res,
      "Escalate complaint error",
      error,
      "Server error while escalating complaint"
    );
  }
};

/* ========== RETRY THE DSW EMAIL (after a failure) ==========
   Student (own complaint) or Admin (if sent to admin) */

export const resendDswEmail = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid complaint id" });
    }

    const filter = {
      _id: id,
      sentTo: "DSW",
      "dswEmail.status": "FAILED",
    };

    if (req.user.role === "STUDENT") {
      const student = await getStudent(req.user.userId);

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student profile not found",
        });
      }

      filter.studentId = student._id;
    } else {
      filter.sentTo = { $all: ["DSW", req.user.role] };
    }

    // Atomic: only one retry can start at a time
    const complaint = await Complaint.findOneAndUpdate(
      filter,
      { $set: { "dswEmail.status": "PENDING" } },
      { new: true }
    );

    if (!complaint) {
      return res.status(400).json({
        success: false,
        message: "There is no failed DSW email to retry for this complaint",
      });
    }

    res.status(200).json({
      success: true,
      message: "Retrying the email to the DSW",
      complaint,
    });

    notifyDsw(complaint._id);
  } catch (error) {
    return serverError(
      res,
      "Resend DSW email error",
      error,
      "Server error while retrying the DSW email"
    );
  }
};