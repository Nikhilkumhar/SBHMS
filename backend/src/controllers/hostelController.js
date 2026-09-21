import Hostel from "../models/hostelModel.js";

export const createHostel = async (req, res) => {
  try {
    const { name, code, description } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: "Hostel name and code are required",
      });
    }

    const existingHostel = await Hostel.findOne({
      code: code.toUpperCase(),
    });

    if (existingHostel) {
      return res.status(409).json({
        success: false,
        message: "Hostel with this code already exists",
      });
    }

    const hostel = await Hostel.create({
      name,
      code: code.toUpperCase(),
      description,
    });

    res.status(201).json({
      success: true,
      message: "Hostel created successfully",
      hostel,
    });
  } catch (error) {
    console.error("Create hostel error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while creating hostel",
    });
  }
};

export const getHostels = async (req, res) => {
  try {
    const hostels = await Hostel.find().sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: hostels.length,
      hostels,
    });
  } catch (error) {
    console.error("Get hostels error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching hostels",
    });
  }
};