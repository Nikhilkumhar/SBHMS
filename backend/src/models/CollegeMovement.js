import mongoose from "mongoose";

const collegeMovementSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    date: {
      type: Date,
      required: true,
      default: Date.now,
    },

    outTime: {
      type: Date,
      required: true,
    },

    inTime: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["OUT", "IN"],
      default: "OUT",
    },

    recordedOutBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    recordedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    remarks: {
      type: String,
      trim: true,
    },


    // True when the system closed an unfinished OUT from a previous day
    autoClosed: {
      type: Boolean,
      default: false,
    },

    // Manual correction details
    isCorrected: {
      type: Boolean,
      default: false,
    },

    correctionReason: {
      type: String,
      trim: true,
    },

    correctedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    correctedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const CollegeMovement = mongoose.model(
  "CollegeMovement",
  collegeMovementSchema
);

export default CollegeMovement;