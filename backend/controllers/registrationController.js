const Registration = require("../models/Registration");


// Register for an event
exports.registerForEvent = async (req, res) => {
  try {

    const { eventId } = req.body;

    const existingRegistration = await Registration.findOne({
      userId: req.user.id,
      eventId
    });

    if (existingRegistration) {
      return res.status(400).json({
        message: "You already registered for this event"
      });
    }

    const qrData = JSON.stringify({
      userId: req.user.id,
      eventId
    });

    const qrCode = await QRCode.toDataURL(qrData);

    const registration = new Registration({
      userId: req.user.id,
      eventId,
      qrCode
    });

    await registration.save();

    res.status(201).json({
      message: "Event registration successful",
      qrCode,
      registration
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get events registered by a user
exports.getMyRegistrations = async (req, res) => {
  try {

    const registrations = await Registration.find({
      userId: req.user.id
    }).populate("eventId");

    res.json(registrations);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Get participants for an event (organizer view)
exports.getEventParticipants = async (req, res) => {
  try {

    const participants = await Registration.find({
      eventId: req.params.eventId
    }).populate("userId", "name email");

    res.json(participants);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.markAttendance = async (req, res) => {
  try {

    const { registrationId } = req.body;

    const registration = await Registration.findById(registrationId);

    if (!registration) {
      return res.status(404).json({
        message: "Registration not found"
      });
    }

    registration.attendanceStatus = "present";

    await registration.save();

    res.json({
      message: "Attendance marked successfully"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};