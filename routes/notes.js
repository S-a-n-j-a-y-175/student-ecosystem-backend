import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import Note from "../models/Note.js";
import Activity from "../models/Activity.js";
import Subject from "../models/Subject.js";
import { requireAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "..", "uploads");

// 1. Search and list notes
router.get("/", async (req, res) => {
  try {
    const { search, subjectId, unit, uploaderId, sort } = req.query;
    const filter = {};

    if (subjectId) {
      filter.subjectId = subjectId;
    }

    if (unit && unit !== "All") {
      filter.unit = unit;
    }

    if (uploaderId) {
      filter.uploaderId = uploaderId;
    }

    if (search && search.trim() !== "") {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [
        { title: { $regex: regex } },
        { description: { $regex: regex } },
        { unit: { $regex: regex } },
      ];
    }

    let sortOption = { createdAt: -1 }; // default most recent
    if (sort === "downloads") {
      sortOption = { downloadCount: -1 };
    } else if (sort === "title") {
      sortOption = { title: 1 };
    } else if (sort === "oldest") {
      sortOption = { createdAt: 1 };
    }

    const notes = await Note.find(filter)
      .populate({
        path: "subjectId",
        populate: { path: "classId" },
      })
      .populate("uploaderId", "name collegeEmail role")
      .sort(sortOption);

    return res.json(notes);
  } catch (error) {
    console.error("Fetch notes error:", error);
    return res.status(500).json({ message: "Failed to fetch notes" });
  }
});

// 2. Get single note details
router.get("/:id", async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate({
        path: "subjectId",
        populate: { path: "classId" },
      })
      .populate("uploaderId", "name collegeEmail role");

    if (!note) {
      return res.status(404).json({ message: "Note not found." });
    }

    return res.json(note);
  } catch (error) {
    console.error("Fetch note error:", error);
    return res.status(500).json({ message: "Failed to fetch note" });
  }
});

// 3. Upload new note (PDF + Metadata)
router.post("/", requireAuth, upload.single("file"), async (req, res) => {
  try {
    const { title, subjectId, unit, description } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "A PDF document file is required." });
    }

    if (!title || !subjectId || !unit) {
      // Clean up uploaded file if missing required metadata
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: "Title, subject, and unit are required fields." });
    }

    // Verify subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: "Invalid subject selected." });
    }

    const newNote = new Note({
      title: title.trim(),
      subjectId,
      unit: unit.trim(),
      description: description ? description.trim() : "",
      uploaderId: req.user.userId,
      fileKey: req.file.filename,
      originalFileName: req.file.originalname,
      fileSize: req.file.size,
      version: 1,
      downloadCount: 0,
    });

    await newNote.save();

    await Activity.create({
      userId: req.user.userId,
      action: "UPLOAD",
      noteId: newNote._id,
      details: `Uploaded notes "${newNote.title}" for ${subject.code} (${newNote.unit})`,
    });

    const populatedNote = await Note.findById(newNote._id)
      .populate({
        path: "subjectId",
        populate: { path: "classId" },
      })
      .populate("uploaderId", "name collegeEmail role");

    return res.status(201).json(populatedNote);
  } catch (error) {
    console.error("Upload note error:", error);
    return res.status(500).json({ message: "Failed to upload note", error: error.message });
  }
});

// 4. Update / Replace Note (with version bumping on PDF replacement)
router.put("/:id", requireAuth, upload.single("file"), async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ message: "Note not found." });
    }

    // Check ownership or admin role (Security Test Case ST03)
    const isOwner = note.uploaderId.toString() === req.user.userId;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(403).json({ message: "You do not have permission to modify this note." });
    }

    const { title, subjectId, unit, description } = req.body;

    if (title) note.title = title.trim();
    if (subjectId) note.subjectId = subjectId;
    if (unit) note.unit = unit.trim();
    if (description !== undefined) note.description = description.trim();

    let actionType = "UPDATE";

    // If a new PDF file is uploaded, replace file and increment version (Report Chapter 4.2.5)
    if (req.file) {
      // Clean up previous file if exists
      const oldFilePath = path.join(uploadsDir, note.fileKey);
      if (fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath);
        } catch (e) {
          console.warn("Could not delete old file:", e.message);
        }
      }

      note.fileKey = req.file.filename;
      note.originalFileName = req.file.originalname;
      note.fileSize = req.file.size;
      note.version += 1; // Increment version
      actionType = "REPLACE_PDF";
    }

    await note.save();

    await Activity.create({
      userId: req.user.userId,
      action: actionType,
      noteId: note._id,
      details: `${actionType === "REPLACE_PDF" ? "Replaced PDF (v" + note.version + ")" : "Updated metadata"} for "${note.title}"`,
    });

    const populatedNote = await Note.findById(note._id)
      .populate({
        path: "subjectId",
        populate: { path: "classId" },
      })
      .populate("uploaderId", "name collegeEmail role");

    return res.json(populatedNote);
  } catch (error) {
    console.error("Update note error:", error);
    return res.status(500).json({ message: "Failed to update note", error: error.message });
  }
});

// 5. Delete Note
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: "Note not found." });
    }

    const isOwner = note.uploaderId.toString() === req.user.userId;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "You do not have permission to delete this note." });
    }

    // Delete associated physical file
    const filePath = path.join(uploadsDir, note.fileKey);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.warn("Could not delete physical file:", e.message);
      }
    }

    await Note.findByIdAndDelete(req.params.id);

    await Activity.create({
      userId: req.user.userId,
      action: "DELETE",
      details: `Deleted note "${note.title}"`,
    });

    return res.json({ message: "Note removed successfully." });
  } catch (error) {
    console.error("Delete note error:", error);
    return res.status(500).json({ message: "Failed to delete note" });
  }
});

// 6. View PDF inline (Chapter 4.2.4 - View permitted note)
router.get("/:id/view", async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: "Note not found." });
    }

    const filePath = path.join(uploadsDir, note.fileKey);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "PDF document file not found on server." });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(note.originalFileName || "document.pdf")}"`);
    const fileStream = fs.createReadStream(filePath);
    return fileStream.pipe(res);
  } catch (error) {
    console.error("View note error:", error);
    return res.status(500).json({ message: "Failed to stream PDF" });
  }
});

// 7. Download PDF (Chapter 4.2.6 - Download permitted note with metric increment)
router.get("/:id/download", async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: "Note not found." });
    }

    const filePath = path.join(uploadsDir, note.fileKey);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "PDF document file not found on server." });
    }

    // Increment download counter
    note.downloadCount = (note.downloadCount || 0) + 1;
    await note.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(note.originalFileName || "note.pdf")}"`);
    const fileStream = fs.createReadStream(filePath);
    return fileStream.pipe(res);
  } catch (error) {
    console.error("Download note error:", error);
    return res.status(500).json({ message: "Failed to download PDF" });
  }
});

export default router;
