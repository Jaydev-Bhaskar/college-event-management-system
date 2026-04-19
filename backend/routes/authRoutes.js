const express = require("express");
const router = express.Router();

const { registerUser, loginUser, getMe, setupAccount } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", authMiddleware, getMe);

// [DEV ONLY] — Remove before production
router.post("/setup-account", setupAccount);

module.exports = router;