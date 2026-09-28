import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: String, // e.g. "III" or "3"
      required: true,
      trim: true,
    },
    section: {
      type: String, // e.g. "C"
      required: true,
      trim: true,
    },
    semester: {
      type: Number, // e.g. 5
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Class", classSchema);
