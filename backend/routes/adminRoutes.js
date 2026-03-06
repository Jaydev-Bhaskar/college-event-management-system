const express = require("express");
const router = express.Router();

const {
  getOrganizerRequests,
  approveRequest,
  rejectRequest
} = require("../controllers/adminController");

const authMiddleware = require("../middleware/authMiddleware");

router.get("/organizer-requests", authMiddleware, getOrganizerRequests);

router.post("/approve-request", authMiddleware, approveRequest);

router.post("/reject-request", authMiddleware, rejectRequest);

module.exports = router;