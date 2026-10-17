import mongoose from "mongoose";

export const COMPLAINT_CATEGORIES = [
  "ROOM",
  "BATHROOM",
  "WATER",
  "LAUNDRY",
  "RAGGING",
  "OTHER",
];

export const COMPLAINT_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

// Used to sort the most serious complaints first
export const SEVERITY_PRIORITY = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

// Who can receive a complaint
export const COMPLAINT_RECIPIENTS = ["WARDEN", "ADMIN", "DSW"];

export const COMPLAINT_STATUSES = [
  "PENDING",
  "IN_PROGRESS",
  "RESOLVED",
  "REJECTED",
];

export const OPEN_STATUSES = ["PENDING", "IN_PROGRESS"];

/* ========== TRACKING TIMELINE (what the student sees) ========== */

const timelineSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: [
        "CREATED",
        "STATUS_CHANGED",
        "ESCALATED",
        "DSW_EMAILED",
        "DSW_EMAIL_FAILED",
      ],
      required: true,
    },

    status: {
      type: String,
      enum: COMPLAINT_STATUSES,
      required: true,
    },

    note: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    byUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // STUDENT / WARDEN / ADMIN / SYSTEM
    byRole: {
      type: String,
      trim: true,
    },

    at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

/* ========== COMPLAINT ========== */

const complaintSchema = new mongoose.Schema(
  {
    // Human friendly number, e.g. CMP-2610-A1B2C3
    complaintNo: {
      type: String,
      required: true,
      unique: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },

    // Saved at the time of the complaint (student may move rooms later)
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
    },

    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
    },

    category: {
      type: String,
      enum: COMPLAINT_CATEGORIES,
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1500,
    },

    severity: {
      type: String,
      enum: COMPLAINT_SEVERITIES,
      default: "MEDIUM",
      required: true,
    },

    // 1 (low) to 4 (critical) - makes sorting easy
    priority: {
      type: Number,
      default: 2,
      index: true,
    },

    // Who this complaint was sent to
    sentTo: {
      type: [{ type: String, enum: COMPLAINT_RECIPIENTS }],
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: "A complaint must be sent to at least one authority",
      },
      index: true,
    },

    status: {
      type: String,
      enum: COMPLAINT_STATUSES,
      default: "PENDING",
      index: true,
    },

    // DSW does not log in to the website - it gets an email
    dswEmail: {
      status: {
        type: String,
        enum: ["NOT_REQUIRED", "PENDING", "SENT", "FAILED"],
        default: "NOT_REQUIRED",
      },
      sentAt: { type: Date },
      error: { type: String, trim: true },
    },

    timeline: {
      type: [timelineSchema],
      default: [],
    },

    resolutionNote: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Complaint = mongoose.model("Complaint", complaintSchema);

export default Complaint;