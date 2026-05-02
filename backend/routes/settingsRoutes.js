const express = require("express");
const router = express.Router();

const { getSettings, updateSettings } = require("../controllers/settingsController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// GET /api/settings/public
router.get("/public", getSettings);

// GET /api/settings?department=...
router.get("/", authMiddleware, getSettings);

// PUT /api/settings
router.put("/", authMiddleware, roleMiddleware(["admin"]), updateSettings);

module.exports = router;
