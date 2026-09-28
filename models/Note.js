import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    unit: {
      type: String,
      required: true,
      trim: true, // e.g., "Unit 1", "Unit 2", "Unit 3", "Unit 4", "Unit 5"
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    uploaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fileKey: {
      type: String,
      required: true,
    },
    originalFileName: {
      type: String,
      default: "note.pdf",
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    version: {
      type: Number,
      default: 1,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Search index for fast discovery as outlined in Chapter 7.4.1
noteSchema.index({ title: "text", description: "text" });

export default mongoose.model("Note", noteSchema);
