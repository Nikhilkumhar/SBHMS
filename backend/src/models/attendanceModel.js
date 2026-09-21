import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    // Student whose attendance is being marked
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    // Hostel
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
    },

    // Attendance date
    date: {
      type: Date,
      required: true,
    },

    // Present or Absent
    status: {
      type: String,
      enum: ["PRESENT", "ABSENT"],
      required: true,
    },

    // Who marked the attendance
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Time when attendance was marked
    markedAt: {
      type: Date,
      default: Date.now,
    },

    // Optional remarks
    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// One attendance record per student per day
attendanceSchema.index(
  {
    studentId: 1,
    date: 1,
  },
  {
    unique: true,
  }
);

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;