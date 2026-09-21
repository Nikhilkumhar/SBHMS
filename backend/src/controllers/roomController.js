import Room from "../models/roomModel.js";
import Hostel from "../models/hostelModel.js";

export const createRoom = async (req, res) => {
  try {
    const {
      hostelId,
      roomNumber,
      floor,
      capacity,
    } = req.body;

    if (!hostelId || !roomNumber || floor === undefined || !capacity) {
      return res.status(400).json({
        success: false,
        message: "Hostel, room number, floor and capacity are required",
      });
    }

    // Check hostel exists
    const hostel = await Hostel.findById(hostelId);

    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: "Hostel not found",
      });
    }

    // Check duplicate room in the same hostel
    const existingRoom = await Room.findOne({
      hostelId,
      roomNumber,
    });

    if (existingRoom) {
      return res.status(409).json({
        success: false,
        message: "Room already exists in this hostel",
      });
    }

    const room = await Room.create({
      hostelId,
      roomNumber,
      floor,
      capacity,
      currentOccupancy: 0,
      status: "AVAILABLE",
    });

    res.status(201).json({
      success: true,
      message: "Room created successfully",
      room,
    });
  } catch (error) {
    console.error("Create room error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while creating room",
    });
  }
};

export const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find()
      .populate("hostelId", "name code")
      .sort({ hostelId: 1, roomNumber: 1 });

    res.status(200).json({
      success: true,
      count: rooms.length,
      rooms,
    });
  } catch (error) {
    console.error("Get rooms error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching rooms",
    });
  }
};