import mongoose from "mongoose";

const gatePassSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    purpose: {
      type: String,
      required: true,
      trim: true,
    },

    passType: {
      type: String,
      enum: ["HOME", "MARKET"],
      default: "MARKET",
      required: true,
    },

    outDate: {
      type: Date,
      required: true,
    },

    outTime: {
      type: String,
      required: true,
    },

    expectedInDate: {
      type: Date,
      required: true,
    },

    expectedInTime: {
      type: String,
      required: true,
    },

    parentPermission: {
      type: Boolean,
      default: false,
    },

    parentPermissionAt: {
      type: Date,
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "APPROVED",
        "REJECTED",
        "OUT",
        "RETURNED",
        "EXPIRED",
        "CANCELLED",
      ],
      default: "PENDING",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    approvedAt: {
      type: Date,
    },

    qrToken: {
      type: String,
      unique: true,
      sparse: true,
    },

    actualOutTime: {
      type: Date,
    },

    actualInTime: {
      type: Date,
    },

    rejectionReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const GatePass = mongoose.model("GatePass", gatePassSchema);

export default GatePass;