const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Event = require("../models/Event");

const authMiddleware = async (req, res, next) => {

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Organizer auto-revert with 30-day grace period
    if (user.role === "organizer" && user.privileges && user.privileges.isOrganizer) {
      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setUTCHours(0, 0, 0, 0);

      // Check for any upcoming or in-progress events
      const activeEvents = await Event.countDocuments({
        organizerId: user._id,
        date: { $gte: startOfDay }
      });

      if (activeEvents === 0) {
        // No active events — check grace period
        if (!user.privileges.organizerGraceStart) {
          // Start grace period now
          user.privileges.organizerGraceStart = now;
          await user.save();
        } else {
          // Check if 30 days have passed since grace started
          const graceDays = 30;
          const graceEnd = new Date(user.privileges.organizerGraceStart);
          graceEnd.setDate(graceEnd.getDate() + graceDays);

          if (now > graceEnd) {
            // Grace period expired — revert to base role
            user.role = user.baseRole || "student";
            user.privileges.isOrganizer = false;
            user.privileges.organizerGraceStart = null;
            await user.save();
          }
        }
      } else {
        // Has active events — clear any grace period
        if (user.privileges.organizerGraceStart) {
          user.privileges.organizerGraceStart = null;
          await user.save();
        }
      }
    }

    req.user = user;

    next();

  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }

};

module.exports = authMiddleware;