const Event = require("../models/Event");

/**
 * Checks if the current user has access to the specified event.
 * Access is granted if user is:
 * - Admin
 * - The event's organizer
 * - An assigned event manager for that event
 */
const eventAccessMiddleware = async (req, res, next) => {
  try {
    const eventId = req.params.eventId || req.params.id || req.body.eventId;

    if (!eventId) {
      return res.status(400).json({ message: "Event ID is required" });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const userId = req.user._id.toString();

    // Admin always has access
    if (req.user.role === "admin") {
      req.event = event;
      return next();
    }

    // Event organizer has access
    if (event.organizerId.toString() === userId) {
      req.event = event;
      return next();
    }

    // Event manager has access
    if (event.eventManagers && event.eventManagers.some(m => m.toString() === userId)) {
      req.event = event;
      req.isEventManager = true;
      return next();
    }

    return res.status(403).json({ message: "Access forbidden: You don't have access to this event" });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = eventAccessMiddleware;
