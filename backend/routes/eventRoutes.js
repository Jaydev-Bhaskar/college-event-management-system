const express = require("express");
const router = express.Router();

const {
  createEvent,
  getEvents,
  getEventById
} = require("../controllers/eventController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.post("/", authMiddleware, roleMiddleware(["organizer", "admin"]), createEvent);
router.get("/", getEvents);
router.get("/:id", getEventById);

module.exports = router;