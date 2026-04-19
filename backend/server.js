require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

// Route imports
const authRoutes = require("./routes/authRoutes");
const organizerRoutes = require("./routes/organizerRoutes");
const adminRoutes = require("./routes/adminRoutes");
const eventRoutes = require("./routes/eventRoutes");
const registrationRoutes = require("./routes/registrationRoutes");
const poBankRoutes = require("./routes/poBankRoutes");
const feedbackFormRoutes = require("./routes/feedbackFormRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const expertRoutes = require("./routes/expertRoutes");
const settingsRoutes = require("./routes/settingsRoutes");

const app = express();
connectDB();

app.use(cors());
app.use(express.json({ limit: "10mb" })); // Increased for QR code data URLs

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/organizer", organizerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/po-bank", poBankRoutes);
app.use("/api/feedback-forms", feedbackFormRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/expert", expertRoutes);
app.use("/api/settings", settingsRoutes);

app.get("/", (req, res) => {
  res.send("College Event Management API running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});