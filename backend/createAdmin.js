import dotenv from "dotenv";
import bcrypt from "bcryptjs";

import connectDB from "./src/config/db.js";
import User from "./src/models/userModel.js";

dotenv.config();

const createAdmin = async () => {
  try {
    await connectDB();

    const staffId = "ADMIN001";
    const password = "Admin@123";

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      staffId,
    });

    if (existingAdmin) {
      console.log("Admin already exists.");
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const admin = await User.create({
      name: "SBHMS Administrator",
      email: "admin@sbu.ac.in",
      phone: "9999999999",
      staffId,
      password: hashedPassword,
      role: "ADMIN",
      isActive: true,
    });

    console.log("=================================");
    console.log("ADMIN CREATED SUCCESSFULLY");
    console.log("=================================");
    console.log("Staff ID:", admin.staffId);
    console.log("Password:", password);
    console.log("Role:", admin.role);
    console.log("=================================");

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
};

createAdmin();