const OrganizerRequest = require("../models/OrganizerRequest");

// Create organizer request
exports.createRequest = async (req, res) => {
  try {

    const { title, description, category, date, time, location, maxParticipants } = req.body;

    const request = new OrganizerRequest({
      userId: req.user.id,
      department: req.user.department,
      title,
      description,
      category,
      date,
      time,
      location,
      maxParticipants
    });

    await request.save();

    res.status(201).json({
      message: "Organizer request submitted"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};