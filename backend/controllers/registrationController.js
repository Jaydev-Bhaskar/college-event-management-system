const Registration = require("../models/Registration");
const Event = require("../models/Event");
const QRCode = require("qrcode");

// Register for an event
exports.registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const existingRegistration = await Registration.findOne({
      userId: req.user.id,
      eventId
    });

    if (existingRegistration) {
      return res.status(400).json({
        message: "You already registered for this event"
      });
    }

    if (event.maxParticipants) {
      const currentRegistrations = await Registration.countDocuments({ eventId });
      if (currentRegistrations >= event.maxParticipants) {
        return res.status(400).json({ message: "Event is full" });
      }
    }

    const registration = new Registration({
      userId: req.user.id,
      eventId
    });

    const qrData = JSON.stringify({
      registrationId: registration._id,
      eventId: event._id
    });

    const qrCode = await QRCode.toDataURL(qrData);
    registration.qrCode = qrCode;

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
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (req.user.role !== "admin" && event.organizerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access forbidden: Only event organizer can view participants" });
    }

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

    const registration = await Registration.findById(registrationId).populate("eventId");

    if (!registration) {
      return res.status(404).json({
        message: "Registration not found"
      });
    }

    const event = registration.eventId;

    if (req.user.role !== "admin" && event.organizerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access forbidden: Only event organizer can mark attendance" });
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