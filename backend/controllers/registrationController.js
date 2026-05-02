const Registration = require("../models/Registration");
const Event = require("../models/Event");
const QRCode = require("qrcode");

// Register for an event (any authenticated user, including organizers for their own events)
exports.registerForEvent = async (req, res) => {
  try {
    const { eventId, teamName, teamMembers, paymentScreenshot, transactionId } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const existingRegistration = await Registration.findOne({
      userId: req.user._id,
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

    if (event.registrationType === "team" && !teamName) {
      return res.status(400).json({ message: "Team name is required for this event" });
    }

    if (event.isPaid && !paymentScreenshot) {
      return res.status(400).json({ message: "Payment proof is required for this event" });
    }

    const registration = new Registration({
      userId: req.user._id,
      eventId,
      teamName: teamName || "",
      teamMembers: teamMembers || [],
      isTeamLeader: !!teamName,
      paymentScreenshot,
      transactionId,
      registrationStatus: (event.requiresApproval || event.isPaid) ? "pending" : "confirmed"
    });

    const qrData = JSON.stringify({
      registrationId: registration._id,
      eventId: event._id,
      userId: req.user._id
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
    if (error.code === 11000) {
      return res.status(400).json({ message: "You already registered for this event" });
    }
    res.status(500).json({ error: error.message });
  }
};

// Get current user's registrations (as leader or accepted teammate)
exports.getMyRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({
      $or: [
        { userId: req.user._id },
        { "teamMembers": { $elemMatch: { userId: req.user._id, status: "accepted" } } }
      ]
    }).populate("eventId");

    res.json(registrations);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Get participants for an event (organizer, event manager, or admin)
exports.getEventParticipants = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const userId = req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    const isOrganizer = event.organizerId.toString() === userId;
    const isManager = event.eventManagers && event.eventManagers.some(m => m.toString() === userId);

    if (!isAdmin && !isOrganizer && !isManager) {
      return res.status(403).json({ message: "Access forbidden: Insufficient permissions" });
    }

    const participants = await Registration.find({
      eventId: req.params.eventId
    }).populate("userId", "name email department studentId");

    res.json(participants);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark attendance (organizer, event manager, or admin)
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
    const userId = req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    const isOrganizer = event.organizerId.toString() === userId;
    const isManager = event.eventManagers && event.eventManagers.some(m => m.toString() === userId);

    if (!isAdmin && !isOrganizer && !isManager) {
      return res.status(403).json({ message: "Access forbidden: Only event organizer or managers can mark attendance" });
    }

    registration.attendanceStatus = "present";
    registration.attendanceMarkedBy = req.user._id;
    registration.attendanceTimestamp = new Date();

    await registration.save();

    res.json({
      message: "Attendance marked successfully"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark attendance by QR scan data
exports.markAttendanceByQR = async (req, res) => {
  try {
    const { qrData } = req.body;

    let parsed;
    try {
      parsed = JSON.parse(qrData);
    } catch (e) {
      return res.status(400).json({ message: "Invalid QR code data" });
    }

    const registration = await Registration.findById(parsed.registrationId).populate("eventId");

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    // Verify the eventId matches
    if (registration.eventId._id.toString() !== parsed.eventId) {
      return res.status(400).json({ message: "QR code does not match this event" });
    }

    const event = registration.eventId;
    const userId = req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    const isOrganizer = event.organizerId.toString() === userId;
    const isManager = event.eventManagers && event.eventManagers.some(m => m.toString() === userId);

    if (!isAdmin && !isOrganizer && !isManager) {
      return res.status(403).json({ message: "Access forbidden" });
    }

    if (registration.attendanceStatus === "present") {
      return res.status(400).json({ message: "Attendance already marked" });
    }

    registration.attendanceStatus = "present";
    registration.attendanceMarkedBy = req.user._id;
    registration.attendanceTimestamp = new Date();
    await registration.save();

    // Get student info to show in UI
    const User = require("../models/User");
    const student = await User.findById(registration.userId).select("name email department");

    res.json({
      message: "Attendance marked successfully",
      student
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update registration status (organizer/admin)
exports.updateRegistrationStatus = async (req, res) => {
  try {
    const { registrationId, status } = req.body;
    const registration = await Registration.findById(registrationId).populate("eventId");

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    const event = registration.eventId;
    const userId = req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    const isOrganizer = event.organizerId.toString() === userId;

    if (!isAdmin && !isOrganizer) {
      return res.status(403).json({ message: "Only organizers can update registration status" });
    }

    registration.registrationStatus = status;
    await registration.save();

    res.json({ message: `Registration ${status} successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update team members (for confirmed team registrations)
exports.updateTeamMembers = async (req, res) => {
  try {
    const { teamMembers } = req.body;
    const registration = await Registration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    // Only the team leader can update members
    if (registration.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the team leader can update members" });
    }

    const event = await Event.findById(registration.eventId);
    if (event && event.maxTeamSize && teamMembers.length > event.maxTeamSize - 1) {
      return res.status(400).json({ message: `Max team size is ${event.maxTeamSize} (including you)` });
    }

    registration.teamMembers = teamMembers;
    await registration.save();

    res.json({ message: "Team members updated successfully", registration });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get pending invitations for the current user
exports.getMyInvitations = async (req, res) => {
  try {
    const invitations = await Registration.find({
      "teamMembers": {
        $elemMatch: { userId: req.user._id, status: "pending" }
      }
    }).populate("eventId").populate("userId", "name");

    res.json(invitations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Respond to a team invitation
exports.respondToInvitation = async (req, res) => {
  try {
    const { registrationId, status, response } = req.body;
    const finalStatus = status || response;
    
    // Normalize status (handle accept/accepted, decline/declined)
    let normalizedStatus = "";
    if (finalStatus?.startsWith("accept")) normalizedStatus = "accepted";
    if (finalStatus?.startsWith("declin")) normalizedStatus = "declined";

    if (!["accepted", "declined"].includes(normalizedStatus)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const registration = await Registration.findById(registrationId);
    if (!registration) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    const memberIndex = registration.teamMembers.findIndex(
      m => m.userId && m.userId.toString() === req.user._id.toString()
    );

    if (memberIndex === -1) {
      return res.status(403).json({ message: "You are not invited to this team" });
    }

    if (normalizedStatus === "declined") {
      registration.teamMembers.splice(memberIndex, 1);
    } else {
      registration.teamMembers[memberIndex].status = "accepted";
    }

    await registration.save();
    res.json({ message: `Invitation ${normalizedStatus} successfully`, registration });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};