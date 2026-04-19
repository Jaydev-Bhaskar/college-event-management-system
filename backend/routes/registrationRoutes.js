const express = require("express");
const router = express.Router();

const {
  registerForEvent,
  getMyRegistrations,
  getEventParticipants,
  markAttendance,
  markAttendanceByQR
} = require("../controllers/registrationController");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", authMiddleware, registerForEvent);

router.get("/my-events", authMiddleware, getMyRegistrations);

router.get("/event/:eventId", authMiddleware, getEventParticipants);

router.post("/attendance", authMiddleware, markAttendance);

router.post("/attendance/qr", authMiddleware, markAttendanceByQR);

module.exports = router;