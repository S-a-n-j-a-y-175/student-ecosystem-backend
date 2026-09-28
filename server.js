import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";
import path from "path";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  // Ignore in environments where custom DNS servers cannot be set
}
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import classRoutes from "./routes/classes.js";
import subjectRoutes from "./routes/subjects.js";
import noteRoutes from "./routes/notes.js";
import adminRoutes from "./routes/admin.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/student_ecosystem";

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/admin", adminRoutes);

// Root welcome endpoint
app.get("/", (req, res) => {
  res.json({
    status: "online",
    service: "Student Ecosystem - College Notes Sharing Platform API",
    documentation: "https://github.com/S-a-n-j-a-y-175/student-ecosystem-backend",
    healthCheck: "/api/health",
  });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    service: "Student Ecosystem - College Notes Sharing Platform API",
    time: new Date().toISOString(),
  });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  if (err.name === "MulterError") {
    return res.status(400).json({ message: `File upload error: ${err.message}` });
  }
  return res.status(500).json({ message: err.message || "An unexpected server error occurred." });
});

// Connect Database & Start Server
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected successfully to MongoDB at", MONGO_URI);
    app.listen(PORT, () => {
      console.log(`Student Ecosystem Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
