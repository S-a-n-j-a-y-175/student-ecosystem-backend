# Student Ecosystem - College Notes Sharing Platform (Backend API)

> Secure, scalable REST API built with **Node.js**, **Express.js**, **MongoDB**, and **JWT Authentication** for Sri Krishna College of Engineering and Technology (SKCET).

[![Backend Repo](https://img.shields.io/badge/Backend_Repo-GitHub-blue?style=for-the-badge&logo=github)](https://github.com/S-a-n-j-a-y-175/student-ecosystem-backend)
[![Frontend Repo](https://img.shields.io/badge/Frontend_Repo-GitHub-purple?style=for-the-badge&logo=github)](https://github.com/S-a-n-j-a-y-175/student-ecosystem-frontend)
[![Live Frontend](https://img.shields.io/badge/Live_App-GitHub_Pages-brightgreen?style=for-the-badge&logo=github)](https://s-a-n-j-a-y-175.github.io/student-ecosystem-frontend/)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-4.21-lightgrey?style=for-the-badge&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_8.9-brightgreen?style=for-the-badge&logo=mongodb)](https://mongoosejs.com/)

---

## 🔗 Project Links

- **Backend GitHub Repository**: [https://github.com/S-a-n-j-a-y-175/student-ecosystem-backend](https://github.com/S-a-n-j-a-y-175/student-ecosystem-backend)
- **Frontend GitHub Repository**: [https://github.com/S-a-n-j-a-y-175/student-ecosystem-frontend](https://github.com/S-a-n-j-a-y-175/student-ecosystem-frontend)
- **Live Frontend App**: [https://s-a-n-j-a-y-175.github.io/student-ecosystem-frontend/](https://s-a-n-j-a-y-175.github.io/student-ecosystem-frontend/)

---

## 🎓 Capstone Project Information

- **Student Name**: Sanjay JN
- **Roll Number / Register ID**: 727724EUEC175
- **Department**: Department of Electronics and Communication Engineering (ECE)
- **Institution**: Sri Krishna College of Engineering and Technology (SKCET)

---

## 🏗️ Architecture & Features

- **JWT Authentication & Authorization**:
  - Secure bcrypt password hashing.
  - Institutional domain validation (`@skcet.ac.in`).
  - Role-based route protection (`student`, `faculty`, `admin`).
- **RESTful Resource Controllers**:
  - Academic hierarchy: Classes ➔ Subjects ➔ Notes.
  - Granular note filtering by class ID, subject ID, syllabus unit (1 to 5), and keyword search.
- **Multer File Storage & PDF Engine**:
  - Upload validation enforcing PDF MIME type and size constraints.
  - Version increments on note file update.
  - Inline PDF streaming (`/view`) and attachment download counter (`/download`).
- **Database Automated Seeder**:
  - Integrated script (`npm run seed`) utilizing `pdf-lib` to dynamically generate authentic, formatted institutional sample PDFs with college banner and typography.

---

## 📋 API Endpoints Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new student/faculty with college domain | Public |
| `POST` | `/api/auth/login` | Authenticate and obtain JWT bearer token | Public |
| `GET` | `/api/auth/me` | Fetch profile information for authenticated user | Authenticated |

### Academic Hierarchy (`/api/classes` & `/api/subjects`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/classes` | Retrieve all registered classes/semesters | Authenticated |
| `POST` | `/api/classes` | Create a new class curriculum entry | Admin only |
| `GET` | `/api/subjects` | Fetch subjects (filter by `classId` or `department`) | Authenticated |
| `POST` | `/api/subjects` | Create an academic subject code & syllabus | Admin / Faculty |

### Notes Repository (`/api/notes`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/notes` | List notes with optional `subjectId`, `classId`, `unit`, `search` | Authenticated |
| `GET` | `/api/notes/:id` | Fetch specific note metadata & stats | Authenticated |
| `POST` | `/api/notes` | Upload new PDF note (multipart/form-data) | Faculty / Admin |
| `PUT` | `/api/notes/:id` | Update note details or replace PDF document | Note Author / Admin |
| `DELETE` | `/api/notes/:id` | Delete note and associated disk file | Note Author / Admin |
| `GET` | `/api/notes/:id/view` | Stream PDF for in-browser inline preview | Authenticated |
| `GET` | `/api/notes/:id/download` | Download PDF file and increment analytics counter | Authenticated |
| `POST` | `/api/notes/:id/rate` | Submit user star rating (1–5) | Student / Faculty |

### Administration (`/api/admin`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/admin/overview` | Platform KPI statistics (total users, notes, downloads) | Admin only |
| `GET` | `/api/admin/users` | List institutional user accounts | Admin only |
| `PATCH` | `/api/admin/users/:id/role` | Elevate or modify user permission role | Admin only |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v24)
- **MongoDB**: Active service on `mongodb://127.0.0.1:27017` or MongoDB Atlas URI

### 2. Installation
```bash
git clone https://github.com/S-a-n-j-a-y-175/student-ecosystem-backend.git
cd student-ecosystem-backend
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env` and configure your settings:
```bash
cp .env.example .env
```
Ensure your `MONGO_URI` and `JWT_SECRET` are properly defined.

### 4. Database Seeding
Populate classes, subjects, seed accounts, and generate sample PDF notes:
```bash
npm run seed
```

### 5. Start Server
```bash
npm start
```
The REST API server will start listening on `http://localhost:5000`.

---

## 📄 License
Developed for academic submission and evaluation at Sri Krishna College of Engineering and Technology (SKCET).
