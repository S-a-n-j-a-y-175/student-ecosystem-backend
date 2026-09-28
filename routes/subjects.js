import express from "express";
import Subject from "../models/Subject.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Get all subjects
router.get("/", async (req, res) => {
  try {
    const { classId, semester } = req.query;
    const filter = {};

    if (classId) {
      filter.classId = classId;
    }
    if (semester) {
      filter.semester = Number(semester);
    }

    const subjects = await Subject.find(filter).populate("classId").sort({ code: 1 });
    return res.json(subjects);
  } catch (error) {
    console.error("Fetch subjects error:", error);
    return res.status(500).json({ message: "Failed to fetch subjects" });
  }
});

// Create subject (Admin only)
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { code, name, semester, classId } = req.body;

    if (!code || !name || !semester || !classId) {
      return res.status(400).json({ message: "Code, name, semester, and classId are required." });
    }

    const newSubject = new Subject({
      code: code.trim().toUpperCase(),
      name: name.trim(),
      semester: Number(semester),
      classId,
    });

    await newSubject.save();
    const populatedSubject = await Subject.findById(newSubject._id).populate("classId");
    return res.status(201).json(populatedSubject);
  } catch (error) {
    console.error("Create subject error:", error);
    return res.status(500).json({ message: "Failed to create subject" });
  }
});

export default router;
