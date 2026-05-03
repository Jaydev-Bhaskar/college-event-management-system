const express = require("express");
const router = express.Router();

const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getMyEvents,
  addEventManager,
  removeEventManager
} = require("../controllers/eventController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Authenticated routes (specific paths BEFORE parameterized routes)
router.get("/user/my-events", authMiddleware, roleMiddleware(["organizer", "admin", "teacher"]), getMyEvents);
router.post("/", authMiddleware, roleMiddleware(["organizer", "admin", "teacher"]), createEvent);

// Public routes
router.get("/", getEvents);
router.get("/:id", getEventById);

// Update and Delete event
router.put("/:id", authMiddleware, roleMiddleware(["organizer", "admin", "teacher"]), updateEvent);
router.delete("/:id", authMiddleware, roleMiddleware(["organizer", "admin", "teacher"]), deleteEvent);

// Event manager management
router.post("/:id/managers", authMiddleware, roleMiddleware(["organizer", "admin", "teacher"]), addEventManager);
router.delete("/:id/managers", authMiddleware, roleMiddleware(["organizer", "admin", "teacher"]), removeEventManager);

module.exports = router;