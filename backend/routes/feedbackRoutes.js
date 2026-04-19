const express = require("express");
const router = express.Router();

const {
  submitStudentFeedback,
  submitExpertFeedback,
  getFeedbackAnalytics,
  canGiveFeedback
} = require("../controllers/feedbackController");

const authMiddleware = require("../middleware/authMiddleware");
const expertAuthMiddleware = require("../middleware/expertAuthMiddleware");
const eventAccessMiddleware = require("../middleware/eventAccessMiddleware");

// POST /api/feedback/student — Submit student feedback (attendance required)
router.post("/student", authMiddleware, submitStudentFeedback);

// POST /api/feedback/expert — Submit expert feedback
router.post("/expert", expertAuthMiddleware, submitExpertFeedback);

// GET /api/feedback/analytics/:eventId — Get anonymized analytics (organizer/admin)
router.get("/analytics/:eventId", authMiddleware, eventAccessMiddleware, getFeedbackAnalytics);

// GET /api/feedback/can-submit/:eventId — Check if student can give feedback
router.get("/can-submit/:eventId", authMiddleware, canGiveFeedback);

module.exports = router;
