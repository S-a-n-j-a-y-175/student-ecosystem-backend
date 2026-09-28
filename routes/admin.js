import express from "express";
import User from "../models/User.js";
import Note from "../models/Note.js";
import Subject from "../models/Subject.js";
import Class from "../models/Class.js";
import Activity from "../models/Activity.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Admin Overview Analytics
router.get("/overview", requireAuth, requireAdmin, async (req, res) => {
  try {
    const [totalUsers, totalNotes, totalSubjects, totalClasses, notesStats, recentActivity] =
      await Promise.all([
        User.countDocuments(),
        Note.countDocuments(),
        Subject.countDocuments(),
        Class.countDocuments(),
        Note.aggregate([
          {
            $group: {
              _id: null,
              totalDownloads: { $sum: "$downloadCount" },
            },
          },
        ]),
        Activity.find()
          .populate("userId", "name collegeEmail role")
          .populate("noteId", "title")
          .sort({ timestamp: -1 })
          .limit(10),
      ]);

    const totalDownloads = notesStats.length > 0 ? notesStats[0].totalDownloads : 0;

    return res.json({
      totalUsers,
      totalNotes,
      totalSubjects,
      totalClasses,
      totalDownloads,
      recentActivity,
    });
  } catch (error) {
    console.error("Admin overview error:", error);
    return res.status(500).json({ message: "Failed to fetch admin statistics" });
  }
});

// Admin list all users
router.get("/users", requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .select("-passwordHash")
      .populate("classId")
      .sort({ createdAt: -1 });
    return res.json(users);
  } catch (error) {
    console.error("Admin users fetch error:", error);
    return res.status(500).json({ message: "Failed to fetch users" });
  }
});

// Admin toggle or change role
router.put("/users/:id/role", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !["student", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role specified." });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json(user);
  } catch (error) {
    console.error("Change role error:", error);
    return res.status(500).json({ message: "Failed to update user role" });
  }
});

export default router;
