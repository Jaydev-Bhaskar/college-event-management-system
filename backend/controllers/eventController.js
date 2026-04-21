const Event = require("../models/Event");
const SystemSettings = require("../models/SystemSettings");
const User = require("../models/User");


// Create event (Organizer or Admin)
exports.createEvent = async (req, res) => {
  try {

    const {
      title, description, category, date, time, endDate, endTime, location,
      maxParticipants, posterImage, targetClass, subjectName,
      sessionCoordinator, department, agenda, objectives, status
    } = req.body;

    const event = new Event({
      title,
      description,
      category,
      date,
      time,
      endDate,
      endTime,
      location,
      maxParticipants,
      organizerId: req.user._id,
      posterImage,
      status: status || "draft",
      targetClass,
      subjectName,
      sessionCoordinator: sessionCoordinator || req.user.name,
      department: department || req.user.department,
      agenda,
      objectives
    });

    await event.save();

    res.status(201).json({
      message: "Event created successfully",
      event
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Get all events (public — only published)
exports.getEvents = async (req, res) => {
  try {
    const filter = {};

    // Public view shows only published events
    if (!req.headers.authorization) {
      filter.status = "published";
    }

    const events = await Event.find(filter).populate("organizerId", "name email department");

    res.json(events);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Get single event
exports.getEventById = async (req, res) => {
  try {

    const event = await Event.findById(req.params.id)
      .populate("organizerId", "name email department")
      .populate("eventManagers", "name email");

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(event);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Update event (Organizer only for own events, Admin for any)
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (req.user.role !== "admin" && event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the event organizer can update this event" });
    }

    const allowedFields = [
      "title", "description", "category", "date", "time", "endDate", "endTime", "location",
      "maxParticipants", "posterImage", "status", "targetClass",
      "subjectName", "sessionCoordinator", "department", "agenda", "objectives", "reportImages"
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        event[field] = req.body[field];
      }
    });

    await event.save();

    res.json({ message: "Event updated", event });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete event (Admin only or Event Owner)
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Ensure user has permission
    if (event.organizerId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this event" });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Get organizer's own events
exports.getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ organizerId: req.user._id })
      .populate("organizerId", "name email")
      .sort({ date: -1 });

    res.json(events);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Add event manager (with admin-configured limit check)
exports.addEventManager = async (req, res) => {
  try {
    const { userId } = req.body;
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (req.user.role !== "admin" && event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the event organizer can add managers" });
    }

    // Check max limit from settings
    const settings = await SystemSettings.findOne({ department: event.department });
    const maxManagers = settings ? settings.maxEventManagers : 5;

    if (event.eventManagers.length >= maxManagers) {
      return res.status(400).json({
        message: `Maximum ${maxManagers} event managers allowed (set by admin)`
      });
    }

    // Check if already a manager
    if (event.eventManagers.some(m => m.toString() === userId)) {
      return res.status(400).json({ message: "User is already an event manager for this event" });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    event.eventManagers.push(userId);
    await event.save();

    // Add event to user's managed events
    if (!user.privileges) user.privileges = {};
    if (!user.privileges.managedEvents) user.privileges.managedEvents = [];
    user.privileges.managedEvents.push(event._id);
    await user.save();

    res.json({ message: `${user.name} added as event manager`, event });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Remove event manager
exports.removeEventManager = async (req, res) => {
  try {
    const { userId } = req.body;
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (req.user.role !== "admin" && event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the event organizer can remove managers" });
    }

    event.eventManagers = event.eventManagers.filter(m => m.toString() !== userId);
    await event.save();

    // Remove from user's managed events
    const user = await User.findById(userId);
    if (user && user.privileges && user.privileges.managedEvents) {
      user.privileges.managedEvents = user.privileges.managedEvents.filter(
        e => e.toString() !== event._id.toString()
      );
      await user.save();
    }

    res.json({ message: "Event manager removed", event });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};