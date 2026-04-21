const express = require("express");
const router = express.Router();

const {
  createFeedbackForm,
  updateFeedbackForm,
  getFeedbackForm,
  getFeedbackFormById,
  deleteFeedbackForm,
  getExpertFormPublic
} = require("../controllers/feedbackFormController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// PUBLIC: Get expert feedback form section (no auth)
router.get("/expert-form/:eventId", getExpertFormPublic);

// POST /api/feedback-forms — Create a new feedback form
router.post("/", authMiddleware, roleMiddleware(["organizer", "admin"]), createFeedbackForm);

// PUT /api/feedback-forms/:formId — Update a feedback form
router.put("/:formId", authMiddleware, roleMiddleware(["organizer", "admin"]), updateFeedbackForm);

// GET /api/feedback-forms/event/:eventId — Get form by event
router.get("/event/:eventId", authMiddleware, getFeedbackForm);

// GET /api/feedback-forms/:formId — Get form by ID
router.get("/:formId", authMiddleware, getFeedbackFormById);

// DELETE /api/feedback-forms/:formId — Delete a form
router.delete("/:formId", authMiddleware, roleMiddleware(["organizer", "admin"]), deleteFeedbackForm);

module.exports = router;
