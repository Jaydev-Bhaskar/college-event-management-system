const ExpertAccount = require("../models/ExpertAccount");
const Event = require("../models/Event");
const Registration = require("../models/Registration");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// Generate expert credentials (organizer action)
exports.generateExpertCredentials = async (req, res) => {
  try {
    const { eventId, expertName, designation, organization } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Verify organizer ownership
    if (req.user.role !== "admin" && event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the event organizer can generate expert credentials" });
    }

    // Generate username and password
    const suffix = crypto.randomBytes(3).toString("hex");
    const username = `expert_${event.title.toLowerCase().replace(/\s+/g, "_").substring(0, 15)}_${suffix}`;
    const rawPassword = crypto.randomBytes(6).toString("hex"); // 12 char password

    const passwordHash = await bcrypt.hash(rawPassword, 10);

    // Expiry: 7 days after event date
    const expiresAt = new Date(event.date);
    expiresAt.setDate(expiresAt.getDate() + 7);

    const expertAccount = new ExpertAccount({
      username,
      passwordHash,
      eventId,
      createdBy: req.user._id,
      expiresAt,
      isActive: true,
      expertName,
      designation: designation || "",
      organization: organization || ""
    });

    await expertAccount.save();

    // Add to event's expert list
    event.expertAccountIds.push(expertAccount._id);
    await event.save();

    // Return credentials (shown once to organizer)
    res.status(201).json({
      message: "Expert credentials generated",
      credentials: {
        username,
        password: rawPassword, // Only shown once!
        expiresAt
      },
      expertAccountId: expertAccount._id
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Expert login
exports.expertLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find by username without the pre-query filter (which filters expired)
    const expert = await ExpertAccount.findOne({ username }).setOptions({ skipMiddleware: true });

    // Manual find since we have a pre-hook
    const expertDirect = await ExpertAccount.collection.findOne({ username });

    if (!expertDirect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!expertDirect.isActive || new Date() > new Date(expertDirect.expiresAt)) {
      return res.status(401).json({ message: "Expert credentials have expired" });
    }

    const isMatch = await bcrypt.compare(password, expertDirect.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate expert-specific JWT
    const token = jwt.sign(
      { expertId: expertDirect._id, eventId: expertDirect.eventId },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      expert: {
        id: expertDirect._id,
        username: expertDirect.username,
        expertName: expertDirect.expertName,
        designation: expertDirect.designation,
        organization: expertDirect.organization,
        eventId: expertDirect.eventId
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get expert dashboard data (expert view — scoped to their event)
exports.getExpertDashboard = async (req, res) => {
  try {
    const expert = req.expert;

    const event = await Event.findById(expert.eventId)
      .populate("organizerId", "name email")
      .select("-eventManagers");

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Aggregate attendee stats (no PII)
    const totalRegistered = await Registration.countDocuments({ eventId: expert.eventId });
    const totalPresent = await Registration.countDocuments({
      eventId: expert.eventId,
      attendanceStatus: "present"
    });

    // Department-wise breakdown (aggregate only)
    const deptBreakdown = await Registration.aggregate([
      { $match: { eventId: event._id } },
      { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      { $group: { _id: "$user.department", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      event: {
        title: event.title,
        description: event.description,
        date: event.date,
        time: event.time,
        location: event.location,
        category: event.category,
        objectives: event.objectives,
        agenda: event.agenda,
        targetClass: event.targetClass,
        subjectName: event.subjectName,
        sessionCoordinator: event.sessionCoordinator,
        department: event.department,
        organizer: event.organizerId
      },
      attendeeStats: {
        totalRegistered,
        totalPresent,
        attendanceRate: totalRegistered > 0 ? ((totalPresent / totalRegistered) * 100).toFixed(1) : 0,
        departmentBreakdown: deptBreakdown
      },
      expert: {
        name: expert.expertName,
        designation: expert.designation,
        organization: expert.organization,
        sessionNotes: expert.sessionNotes,
        uploadedResources: expert.uploadedResources
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update expert session notes
exports.updateSessionNotes = async (req, res) => {
  try {
    const expert = req.expert;
    const { sessionNotes } = req.body;

    await ExpertAccount.updateOne(
      { _id: expert._id },
      { sessionNotes }
    );

    res.json({ message: "Session notes updated" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update expert profile
exports.updateExpertProfile = async (req, res) => {
  try {
    const expert = req.expert;
    const { expertName, designation, organization } = req.body;

    await ExpertAccount.updateOne(
      { _id: expert._id },
      {
        ...(expertName && { expertName }),
        ...(designation && { designation }),
        ...(organization && { organization })
      }
    );

    res.json({ message: "Expert profile updated" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get experts for an event (organizer view)
exports.getEventExperts = async (req, res) => {
  try {
    const { eventId } = req.params;

    const experts = await ExpertAccount.find({ eventId })
      .select("expertName designation organization isActive expiresAt createdAt");

    res.json(experts);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
