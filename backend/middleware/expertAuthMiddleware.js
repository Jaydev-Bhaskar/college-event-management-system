const jwt = require("jsonwebtoken");
const ExpertAccount = require("../models/ExpertAccount");

/**
 * Authenticates expert users with temporary credentials.
 * Expert tokens have { expertId, eventId } payload.
 */
const expertAuthMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Expert tokens have expertId field
    if (!decoded.expertId) {
      return res.status(401).json({ message: "Invalid expert token" });
    }

    const expert = await ExpertAccount.findById(decoded.expertId);

    if (!expert) {
      return res.status(401).json({ message: "Expert account not found or expired" });
    }

    if (!expert.isActive || new Date() > expert.expiresAt) {
      return res.status(401).json({ message: "Expert credentials have expired" });
    }

    req.expert = expert;
    req.expertEventId = expert.eventId;

    next();

  } catch (error) {
    return res.status(401).json({ message: "Invalid expert token" });
  }
};

module.exports = expertAuthMiddleware;
