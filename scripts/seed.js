import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import dotenv from "dotenv";

import User from "../models/User.js";
import Class from "../models/Class.js";
import Subject from "../models/Subject.js";
import Note from "../models/Note.js";
import Activity from "../models/Activity.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Helper function to generate genuine readable PDF document
async function createSamplePdf(fileName, subjectName, topicTitle, authorName, unit, summaryPoints) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Draw Header Banner
  page.drawRectangle({
    x: 40,
    y: 750,
    width: 515,
    height: 60,
    color: rgb(0.12, 0.28, 0.53),
  });

  page.drawText("SRI KRISHNA COLLEGE OF ENGINEERING AND TECHNOLOGY", {
    x: 55,
    y: 785,
    size: 13,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText("Department of Electronics and Communication Engineering", {
    x: 55,
    y: 765,
    size: 10,
    font: fontRegular,
    color: rgb(0.85, 0.9, 1),
  });

  // Title section
  page.drawText(topicTitle, {
    x: 40,
    y: 705,
    size: 18,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.25),
  });

  page.drawText(`Subject: ${subjectName} | ${unit}`, {
    x: 40,
    y: 680,
    size: 12,
    font: fontBold,
    color: rgb(0.2, 0.4, 0.7),
  });

  page.drawText(`Contributed by: ${authorName} | Verified Resource`, {
    x: 40,
    y: 660,
    size: 10,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.5),
  });

  // Divider line
  page.drawLine({
    start: { x: 40, y: 645 },
    end: { x: 555, y: 645 },
    thickness: 1.5,
    color: rgb(0.8, 0.85, 0.9),
  });

  // Academic notes summary section
  page.drawText("CORE CONCEPTS & LECTURE SUMMARY:", {
    x: 40,
    y: 615,
    size: 12,
    font: fontBold,
    color: rgb(0.15, 0.2, 0.3),
  });

  let currentY = 585;
  for (const point of summaryPoints) {
    page.drawText("•", {
      x: 50,
      y: currentY,
      size: 12,
      font: fontBold,
      color: rgb(0.15, 0.4, 0.8),
    });

    page.drawText(point, {
      x: 65,
      y: currentY,
      size: 10.5,
      font: fontRegular,
      color: rgb(0.2, 0.25, 0.3),
      maxWidth: 480,
    });
    currentY -= 35;
  }

  // Footer
  page.drawRectangle({
    x: 40,
    y: 40,
    width: 515,
    height: 35,
    color: rgb(0.96, 0.97, 0.98),
  });

  page.drawText("Student Ecosystem Notes Platform — Academic Year 2025-2026", {
    x: 130,
    y: 52,
    size: 9,
    font: fontRegular,
    color: rgb(0.45, 0.5, 0.55),
  });

  const pdfBytes = await pdfDoc.save();
  const filePath = path.join(uploadsDir, fileName);
  fs.writeFileSync(filePath, pdfBytes);
  return {
    fileName,
    size: pdfBytes.length,
  };
}

async function seed() {
  const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/student_ecosystem";

  console.log("Connecting to MongoDB for seeding...");
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB.");

  // Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    Class.deleteMany({}),
    Subject.deleteMany({}),
    Note.deleteMany({}),
    Activity.deleteMany({}),
  ]);
  console.log("Cleared existing collections.");

  // 1. Create Class
  const defaultClass = await Class.create({
    department: "ECE",
    year: "III",
    section: "C",
    semester: 5,
  });
  console.log("Created Class: III ECE C (Semester 5)");

  // 2. Create Subjects
  const subjectsData = [
    { code: "EC3501", name: "Digital Signal Processing", semester: 5, classId: defaultClass._id },
    { code: "EC3502", name: "Control Systems Engineering", semester: 5, classId: defaultClass._id },
    { code: "EC3503", name: "Embedded Systems & IoT", semester: 5, classId: defaultClass._id },
    { code: "EC3504", name: "Digital Communication", semester: 5, classId: defaultClass._id },
    { code: "EC3505", name: "VLSI Circuit Design", semester: 5, classId: defaultClass._id },
  ];
  const subjects = await Subject.insertMany(subjectsData);
  console.log(`Created ${subjects.length} academic subjects.`);

  const subjectMap = {};
  subjects.forEach((s) => {
    subjectMap[s.code] = s._id;
  });

  // 3. Create Users
  const salt = await bcrypt.genSalt(10);
  const studentPasswordHash = await bcrypt.hash("student123", salt);
  const adminPasswordHash = await bcrypt.hash("admin123", salt);

  const sanjayUser = await User.create({
    name: "Sanjay JN (727724EUEC175)",
    collegeEmail: "sanjay@skcet.ac.in",
    passwordHash: studentPasswordHash,
    role: "student",
    classId: defaultClass._id,
  });

  const kavithaUser = await User.create({
    name: "Kavitha R (727724EUEC180)",
    collegeEmail: "kavitha@skcet.ac.in",
    passwordHash: studentPasswordHash,
    role: "student",
    classId: defaultClass._id,
  });

  const adminUser = await User.create({
    name: "Dr. B Vijayalakshmi (Admin / Supervisor)",
    collegeEmail: "admin@skcet.ac.in",
    passwordHash: adminPasswordHash,
    role: "admin",
    classId: defaultClass._id,
  });

  console.log("Created users: sanjay@skcet.ac.in, kavitha@skcet.ac.in, admin@skcet.ac.in");

  // 4. Generate Sample PDF files
  const pdf1 = await createSamplePdf(
    "dsp-sampling-unit1.pdf",
    "Digital Signal Processing (EC3501)",
    "Sampling Theorem & Discrete-Time Signals",
    "Sanjay JN",
    "Unit 1",
    [
      "Nyquist-Shannon Sampling Theorem criteria: Fs >= 2 * Fmax.",
      "Aliasing distortion and anti-aliasing low pass filter design specifications.",
      "Discrete Fourier Transform (DFT) mathematical formulation and twiddle factors.",
      "Z-Transform ROC (Region of Convergence) properties for stable, causal LTI systems.",
    ]
  );

  const pdf2 = await createSamplePdf(
    "dsp-fir-filters-unit2.pdf",
    "Digital Signal Processing (EC3501)",
    "FIR & IIR Filter Design Techniques",
    "Sanjay JN",
    "Unit 2",
    [
      "Comparison of Linear phase FIR filters with Infinite Impulse Response (IIR) filters.",
      "Windowing methods: Rectangular, Hamming, Hanning, and Blackman windows.",
      "Bilinear Transformation and Impulse Invariance for analog-to-digital mapping.",
      "Frequency response characteristics and pole-zero constellation mapping.",
    ]
  );

  const pdf3 = await createSamplePdf(
    "control-systems-unit1.pdf",
    "Control Systems Engineering (EC3502)",
    "State Space Analysis & Routh-Hurwitz Stability",
    "Kavitha R",
    "Unit 1",
    [
      "Open loop vs closed loop transfer function derivation using block reduction.",
      "Mason's Gain formula with forward paths and non-touching feedback loops.",
      "Routh-Hurwitz algebraic array for absolute stability determination.",
      "State vector differential equation: x_dot = A*x + B*u; y = C*x + D*u.",
    ]
  );

  const pdf4 = await createSamplePdf(
    "embedded-systems-unit1.pdf",
    "Embedded Systems & IoT (EC3503)",
    "ARM Cortex-M Architecture & Peripherals",
    "Sanjay JN",
    "Unit 1",
    [
      "Harvard vs Von-Neumann memory architectures in microcontrollers.",
      "ARM Cortex-M4 register bank: R0-R12 general purpose, SP, LR, and PC.",
      "NVIC (Nested Vectored Interrupt Controller) priority masking and latency.",
      "GPIO pin configuration, UART baud rate generator, and ADC sampling triggers.",
    ]
  );

  const pdf5 = await createSamplePdf(
    "vlsi-design-unit1.pdf",
    "VLSI Circuit Design (EC3505)",
    "CMOS Inverter Characteristics & Stick Diagrams",
    "Sanjay JN",
    "Unit 1",
    [
      "MOSFET regions of operation: Cutoff, Triode, and Saturation equation model.",
      "CMOS inverter DC transfer characteristics and noise margin derivation (VIL, VIH).",
      "Lambda design rules and color coded layout representation.",
      "Euler path method for optimum layout minimization without wire crossing.",
    ]
  );

  // 5. Create Notes
  const notesData = [
    {
      title: "Sampling Theorem & Z-Transform Comprehensive Notes",
      subjectId: subjectMap["EC3501"],
      unit: "Unit 1",
      description: "Classroom lecture summary with derivation of Nyquist rate, aliasing, and Z-transform ROC problems.",
      uploaderId: sanjayUser._id,
      fileKey: pdf1.fileName,
      originalFileName: "DSP_Unit1_Sampling_Theorem.pdf",
      fileSize: pdf1.size,
      version: 1,
      downloadCount: 24,
    },
    {
      title: "FIR and IIR Filter Design Formulation",
      subjectId: subjectMap["EC3501"],
      unit: "Unit 2",
      description: "Detailed steps for Hamming/Hanning window designs and Bilinear Transformation examples.",
      uploaderId: sanjayUser._id,
      fileKey: pdf2.fileName,
      originalFileName: "DSP_Unit2_Filter_Design.pdf",
      fileSize: pdf2.size,
      version: 1,
      downloadCount: 18,
    },
    {
      title: "State Space Analysis & Stability Criteria",
      subjectId: subjectMap["EC3502"],
      unit: "Unit 1",
      description: "Step-by-step solved examples on Routh Hurwitz array and state transition matrices.",
      uploaderId: kavithaUser._id,
      fileKey: pdf3.fileName,
      originalFileName: "ControlSystems_Unit1_StateSpace.pdf",
      fileSize: pdf3.size,
      version: 1,
      downloadCount: 31,
    },
    {
      title: "ARM Cortex Architecture & Peripheral Interfacing",
      subjectId: subjectMap["EC3503"],
      unit: "Unit 1",
      description: "Hardware interfacing diagrams with UART, GPIO, and Timers for lab experiments.",
      uploaderId: sanjayUser._id,
      fileKey: pdf4.fileName,
      originalFileName: "Embedded_Unit1_ARM_Cortex.pdf",
      fileSize: pdf4.size,
      version: 1,
      downloadCount: 42,
    },
    {
      title: "CMOS Inverter Characteristics & Stick Layout",
      subjectId: subjectMap["EC3505"],
      unit: "Unit 1",
      description: "Hand-drawn stick diagrams, lambda layout design rules, and transient timing parameters.",
      uploaderId: sanjayUser._id,
      fileKey: pdf5.fileName,
      originalFileName: "VLSI_Unit1_CMOS_Inverter.pdf",
      fileSize: pdf5.size,
      version: 1,
      downloadCount: 15,
    },
  ];

  const createdNotes = await Note.insertMany(notesData);
  console.log(`Created ${createdNotes.length} initial academic notes.`);

  // 6. Create Activities
  const activities = [
    {
      userId: sanjayUser._id,
      action: "UPLOAD",
      noteId: createdNotes[0]._id,
      details: "Uploaded notes for DSP Unit 1",
      timestamp: new Date(Date.now() - 1000 * 60 * 120),
    },
    {
      userId: kavithaUser._id,
      action: "UPLOAD",
      noteId: createdNotes[2]._id,
      details: "Uploaded notes for Control Systems Unit 1",
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
    },
    {
      userId: sanjayUser._id,
      action: "DOWNLOAD",
      noteId: createdNotes[2]._id,
      details: "Downloaded Control Systems Unit 1 notes",
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
    },
  ];
  await Activity.insertMany(activities);

  console.log("Database seeded successfully!");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
