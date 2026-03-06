const express = require("express");
const router = express.Router();

const {
  getOrganizerRequests,
  approveRequest,
  rejectRequest
} = require("../controllers/adminController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.get("/organizer-requests", authMiddleware, roleMiddleware(['admin']), getOrganizerRequests);

router.post("/approve-request", authMiddleware, roleMiddleware(['admin']), approveRequest);

router.post("/reject-request", authMiddleware, roleMiddleware(['admin']), rejectRequest);

module.exports = router;