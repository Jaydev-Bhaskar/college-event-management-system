# 🚀 UniEvents - Integrated College Event Management System

**UniEvents** is a premium, full-stack event management platform tailored for academic institutions. It streamlines everything from event proposal and approval to live attendance tracking, team collaborations, and automated certificate distribution.

![Version](https://img.shields.io/badge/version-2.1.0-blue.svg)
![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB.svg)
![Node](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933.svg)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248.svg)

---

## ✨ Key Features

### 🏆 Automated Professional Certificates
- **Dynamic Rendering:** High-fidelity certificates generated using React components.
- **A4 landscape PDF:** Professional export with Navy Blue & Gold aesthetic.
- **Smart Gating:** Certificates unlock only after attendance confirmation and feedback submission.

### 👥 Real-time Team Collaboration
- **Invitation Workflow:** Cross-role invitations via Student ID or Name.
- **Synced Dashboards:** Real-time updates for all team members upon joining.
- **Role Permissions:** Distinction between Team Leaders and Members.

### 📱 Live QR Attendance System
- **Dynamic Ticket Generation:** Every registration generates a unique QR Ticket.
- **Organizer Scanner:** Built-in scanner for instant, gate-side attendance marking.
- **Anti-Fraud:** Verification IDs ensure ticket and certificate authenticity.

### 👨‍🏫 External Expert Engagement
- **Temporary Access:** Secure, auto-expiring credentials for guest speakers.
- **Expert Dashboard:** Scoped access to event analytics, attendee breakdown, and session notes.

### 🎓 Academic Accreditation (PO/PSO)
- **NBA/NAAC Ready:** Tools to map events to Program Outcomes and Specific Outcomes.
- **Department Analytics:** Participation and feedback breakdown by department.

---

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Framer Motion (Animations), Lucide React (Icons).
- **Backend:** Node.js, Express, Mongoose.
- **Database:** MongoDB Atlas.
- **PDF Engine:** html2canvas, jsPDF.
- **Auth:** JWT (JSON Web Tokens), Bcrypt (Hashing).

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB (Local or Atlas)

### 1. Clone the repository
```bash
git clone https://github.com/Jaydev-Bhaskar/college-event-management-system.git
cd college-event-management-system
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` folder:
```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
```
Run the server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```

---

## 🏗️ Project Structure

```text
├── backend/
│   ├── controllers/   # Business logic (Expert, PO Bank, Certificates)
│   ├── models/        # Database schemas (User, Event, Registration)
│   ├── routes/        # API Endpoints
│   └── server.js      # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/# Reusable UI (Certificate, Sidebar, Toast)
│   │   ├── pages/     # Main Views (Dashboards, Event Details)
│   │   └── App.jsx    # Routing & Context
```

---

## 🎨 Design Philosophy
UniEvents follows a **Glassmorphism** design language, using translucent panels, vibrant gradients, and micro-animations to create a premium, modern academic experience.

---

## 📝 License
Distributed under the MIT License. See `LICENSE` for more information.

---

**Built with ❤️ for Modern Campuses.**