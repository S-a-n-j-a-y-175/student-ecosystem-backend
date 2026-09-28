import express from "express";
import Class from "../models/Class.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Get all classes
router.get("/", async (req, res) => {
  try {
    const classes = await Class.find().sort({ department: 1, semester: 1 });
    return res.json(classes);
  } catch (error) {
    console.error("Fetch classes error:", error);
    return res.status(500).json({ message: "Failed to fetch classes" });
  }
});

// Create class (Admin only)
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { department, year, section, semester } = req.body;
    if (!department || !year || !section || !semester) {
      return res.status(400).json({ message: "All class fields are required." });
    }

    const newClass = new Class({
      department: department.trim().toUpperCase(),
      year: year.trim(),
      section: section.trim().toUpperCase(),
      semester: Number(semester),
    });

    await newClass.save();
    return res.status(201).json(newClass);
  } catch (error) {
    console.error("Create class error:", error);
    return res.status(500).json({ message: "Failed to create class" });
  }
});

export default router;
