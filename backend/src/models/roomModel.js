import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
    },

    roomNumber: {
      type: String,
      required: true,
      trim: true,
    },

    floor: {
      type: Number,
      required: true,
    },

    capacity: {
      type: Number,
      required: true,
    },

    currentOccupancy: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["AVAILABLE", "FULL", "MAINTENANCE"],
      default: "AVAILABLE",
    },
  },
  {
    timestamps: true,
  }
);

const Room = mongoose.model("Room", roomSchema);

export default Room;