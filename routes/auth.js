import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Activity from "../models/Activity.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

const signToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      name: user.name,
      collegeEmail: user.collegeEmail,
      role: user.role,
      classId: user.classId,
    },
    process.env.JWT_SECRET || "skcet_student_ecosystem_secret_key_2026_super_secure",
    { expiresIn: "7d" }
  );
};

// Register endpoint
router.post("/register", async (req, res) => {
  try {
    const { name, collegeEmail, password, role, classId } = req.body;

    if (!name || !collegeEmail || !password) {
      return res.status(400).json({ message: "Name, college email, and password are required." });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(collegeEmail)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    const existingUser = await User.findOne({ collegeEmail: collegeEmail.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "An account with this email already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      name: name.trim(),
      collegeEmail: collegeEmail.toLowerCase().trim(),
      passwordHash,
      role: role === "admin" ? "admin" : "student",
      classId: classId || null,
    });

    await newUser.save();

    const token = signToken(newUser);

    await Activity.create({
      userId: newUser._id,
      action: "LOGIN",
      details: "Registered and logged in",
    });

    return res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        collegeEmail: newUser.collegeEmail,
        role: newUser.role,
        classId: newUser.classId,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Server error during registration", error: error.message });
  }
});

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const { collegeEmail, password } = req.body;

    if (!collegeEmail || !password) {
      return res.status(400).json({ message: "College email and password are required." });
    }

    const user = await User.findOne({ collegeEmail: collegeEmail.toLowerCase().trim() }).populate("classId");
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = signToken(user);

    await Activity.create({
      userId: user._id,
      action: "LOGIN",
      details: `User ${user.name} logged in`,
    });

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        collegeEmail: user.collegeEmail,
        role: user.role,
        classId: user.classId,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error during login", error: error.message });
  }
});

// Me endpoint
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-passwordHash").populate("classId");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    return res.json(user);
  } catch (error) {
    console.error("Me error:", error);
    return res.status(500).json({ message: "Server error fetching user profile" });
  }
});

export default router;
