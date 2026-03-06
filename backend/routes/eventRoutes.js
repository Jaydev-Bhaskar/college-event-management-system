const express = require("express");
const router = express.Router();

const {
  createEvent,
  getEvents,
  getEventById
} = require("../controllers/eventController");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, createEvent);
router.get("/", getEvents);
router.get("/:id", getEventById);

module.exports = router;