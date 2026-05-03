const express = require("express");
const router = express.Router();

const {
  generateExpertCredentials,
  expertLogin,
  getExpertDashboard,
  updateSessionNotes,
  updateExpertProfile,
  getEventExperts
} = require("../controllers/expertController");

const authMiddleware = require("../middleware/authMiddleware");
const expertAuthMiddleware = require("../middleware/expertAuthMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// POST /api/expert/login — Expert login with temp credentials
router.post("/login", expertLogin);

// POST /api/expert/generate — Generate expert credentials (organizer action)
router.post("/generate", authMiddleware, roleMiddleware(["organizer", "admin", "teacher"]), generateExpertCredentials);

// GET /api/expert/dashboard — Expert dashboard (expert JWT)
router.get("/dashboard", expertAuthMiddleware, getExpertDashboard);

// PUT /api/expert/notes — Update session notes (expert JWT)
router.put("/notes", expertAuthMiddleware, updateSessionNotes);

// PUT /api/expert/profile — Update expert profile (expert JWT)
router.put("/profile", expertAuthMiddleware, updateExpertProfile);

// GET /api/expert/event/:eventId — List experts for an event (organizer view)
router.get("/event/:eventId", authMiddleware, roleMiddleware(["organizer", "admin", "teacher"]), getEventExperts);

module.exports = router;
