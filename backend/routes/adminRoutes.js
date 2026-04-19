const express = require("express");
const router = express.Router();

const {
  getOrganizerRequests,
  approveRequest,
  rejectRequest,
  getDashboardStats,
  getUsers,
  getAllEvents
} = require("../controllers/adminController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Dashboard stats
router.get("/stats", authMiddleware, roleMiddleware(['admin']), getDashboardStats);

// Organizer requests
router.get("/organizer-requests", authMiddleware, roleMiddleware(['admin']), getOrganizerRequests);
router.post("/approve-request", authMiddleware, roleMiddleware(['admin']), approveRequest);
router.post("/reject-request", authMiddleware, roleMiddleware(['admin']), rejectRequest);

// User management
router.get("/users", authMiddleware, roleMiddleware(['admin']), getUsers);

// Event management (department-scoped)
router.get("/events", authMiddleware, roleMiddleware(['admin']), getAllEvents);

module.exports = router;