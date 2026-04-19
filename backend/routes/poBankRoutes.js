const express = require("express");
const router = express.Router();

const {
  getPOBank,
  upsertPOBank,
  addPO,
  removePO
} = require("../controllers/poBankController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// GET /api/po-bank?department=Computer Engineering
router.get("/", authMiddleware, getPOBank);

// PUT /api/po-bank — Create or update entire PO bank
router.put("/", authMiddleware, roleMiddleware(["admin"]), upsertPOBank);

// POST /api/po-bank/add — Add a single PO/PSO
router.post("/add", authMiddleware, roleMiddleware(["admin"]), addPO);

// POST /api/po-bank/remove — Remove a single PO/PSO
router.post("/remove", authMiddleware, roleMiddleware(["admin"]), removePO);

module.exports = router;
