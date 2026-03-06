const OrganizerRequest = require("../models/OrganizerRequest");

// Create organizer request
exports.createRequest = async (req, res) => {
  try {

    const { eventTitle, eventDescription, proposedDate, expectedParticipants } = req.body;

    const request = new OrganizerRequest({
      userId: req.user.id,
      eventTitle,
      eventDescription,
      proposedDate,
      expectedParticipants
    });

    await request.save();

    res.status(201).json({
      message: "Organizer request submitted"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};