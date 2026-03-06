const express = require("express");
const router = express.Router();

const {
  registerForEvent,
  getMyRegistrations,
  getEventParticipants
} = require("../controllers/registrationController");

const authMiddleware = require("../middleware/authMiddleware");

const { markAttendance } = require("../controllers/registrationController");

router.post("/register", authMiddleware, registerForEvent);

router.get("/my-events", authMiddleware, getMyRegistrations);

router.get("/event/:eventId", authMiddleware, getEventParticipants);

router.post("/attendance", authMiddleware, markAttendance);

module.exports = router;