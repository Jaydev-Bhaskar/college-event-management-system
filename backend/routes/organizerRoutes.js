const express = require("express");
const router = express.Router();

const { createRequest } = require("../controllers/organizerController");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/request", authMiddleware, createRequest);

module.exports = router;