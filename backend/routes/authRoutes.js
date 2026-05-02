const express = require("express");
const router = express.Router();

const { registerUser, loginUser, getMe, setupAccount } = require("../controllers/authController");
const { searchStudents } = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", authMiddleware, getMe);
router.get("/search-students", authMiddleware, searchStudents);

// [DEV ONLY] — Remove before production
router.post("/setup-account", setupAccount);

module.exports = router;