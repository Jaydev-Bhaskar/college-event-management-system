const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Event = require("../models/Event");
const OrganizerRequest = require("../models/OrganizerRequest");

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

    if (user.role === "organizer") {
      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setUTCHours(0, 0, 0, 0);

      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setUTCDate(now.getUTCDate() - 30);

      // Check for any recently approved matching requests or upcoming valid proposed dates
      const activeRequests = await OrganizerRequest.countDocuments({
        userId: user._id,
        status: "approved",
        $or: [
          { proposedDate: { $gte: startOfDay } },
          { proposedDate: null, updatedAt: { $gte: thirtyDaysAgo } },
          { proposedDate: { $exists: false }, updatedAt: { $gte: thirtyDaysAgo } }
        ]
      });

      // Check for strictly created events
      const upcomingEvents = await Event.countDocuments({
        organizerId: user._id,
        date: { $gte: startOfDay }
      });

      // If no events remaining and no valid active requests, revoke role
      if (activeRequests === 0 && upcomingEvents === 0) {
        user.role = "student";
        await user.save();
      }
    }

    req.user = user;

    next();

  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }

};

module.exports = authMiddleware;