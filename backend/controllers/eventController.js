const Event = require("../models/Event");


// Create event (Organizer only)
exports.createEvent = async (req, res) => {
  try {

    const { title, description, category, date, time, location, maxParticipants } = req.body;

    const event = new Event({
      title,
      description,
      category,
      date,
      time,
      location,
      maxParticipants,
      organizerId: req.user.id
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


// Get all events
exports.getEvents = async (req, res) => {
  try {

    const events = await Event.find().populate("organizerId", "name email");

    res.json(events);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Get single event
exports.getEventById = async (req, res) => {
  try {

    const event = await Event.findById(req.params.id).populate("organizerId", "name email");

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(event);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};