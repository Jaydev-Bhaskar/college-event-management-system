const express = require("express");
const router = express.Router();

const {
  registerForEvent,
  getMyRegistrations,
  getEventParticipants,
  markAttendance,
  markAttendanceByQR,
  updateRegistrationStatus,
  updateTeamMembers,
  getMyInvitations,
  respondToInvitation
} = require("../controllers/registrationController");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", authMiddleware, registerForEvent);
router.put("/:id/members", authMiddleware, updateTeamMembers);
router.get("/invitations", authMiddleware, getMyInvitations);
router.post("/invitations/respond", authMiddleware, respondToInvitation);

router.get("/my-events", authMiddleware, getMyRegistrations);

router.get("/event/:eventId", authMiddleware, getEventParticipants);

router.put("/status", authMiddleware, updateRegistrationStatus);

router.post("/attendance", authMiddleware, markAttendance);

router.post("/attendance/qr", authMiddleware, markAttendanceByQR);

module.exports = router;