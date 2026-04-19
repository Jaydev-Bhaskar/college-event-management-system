const OrganizerRequest = require("../models/OrganizerRequest");
const User = require("../models/User");
const Event = require("../models/Event");
const Registration = require("../models/Registration");


// Get organizer requests (department-scoped for HOD)
exports.getOrganizerRequests = async (req, res) => {
  try {
    const filter = {};

    // Department scoping — HOD sees only their department
    if (req.user.department) {
      const departmentUsers = await User.find({ department: req.user.department }).select("_id");
      const userIds = departmentUsers.map(u => u._id);
      filter.userId = { $in: userIds };
    }

    const requests = await OrganizerRequest.find(filter).populate("userId", "name email department studentId");

    res.json(requests);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Approve organizer request (sets temporary privilege)
exports.approveRequest = async (req, res) => {
  try {

    const { requestId } = req.body;

    const request = await OrganizerRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // update request status
    request.status = "approved";
    await request.save();

    // Update user — grant organizer privilege (base role unchanged)
    const user = await User.findById(request.userId);
    if (user) {
      user.role = "organizer";
      if (!user.privileges) user.privileges = {};
      user.privileges.isOrganizer = true;
      user.privileges.organizerGrantedAt = new Date();
      user.privileges.organizerGraceStart = null;
      await user.save();
    }

    res.json({ message: "Organizer approved" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Reject request
exports.rejectRequest = async (req, res) => {
  try {

    const { requestId } = req.body;

    const request = await OrganizerRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    request.status = "rejected";
    await request.save();

    res.json({ message: "Request rejected" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Get admin dashboard stats (department-scoped)
exports.getDashboardStats = async (req, res) => {
  try {
    const deptFilter = {};
    const userDeptFilter = {};

    if (req.user.department) {
      deptFilter.department = req.user.department;
      userDeptFilter.department = req.user.department;
    }

    const totalEvents = await Event.countDocuments(deptFilter);
    const activeEvents = await Event.countDocuments({ ...deptFilter, status: "published" });
    const totalUsers = await User.countDocuments(userDeptFilter);
    const pendingRequests = await OrganizerRequest.countDocuments({ status: "pending" });

    // Get department users for registration count
    const deptUserIds = await User.find(userDeptFilter).select("_id");
    const userIds = deptUserIds.map(u => u._id);
    const totalRegistrations = await Registration.countDocuments({ userId: { $in: userIds } });

    res.json({
      totalEvents,
      activeEvents,
      totalUsers,
      pendingRequests,
      totalRegistrations
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Get all users (department-scoped)
exports.getUsers = async (req, res) => {
  try {
    const filter = {};

    if (req.user.department) {
      filter.department = req.user.department;
    }

    const users = await User.find(filter).select("-password").sort({ createdAt: -1 });

    res.json(users);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Get all events (department-scoped)
exports.getAllEvents = async (req, res) => {
  try {
    const filter = {};

    if (req.user.department) {
      filter.department = req.user.department;
    }

    const events = await Event.find(filter)
      .populate("organizerId", "name email")
      .sort({ date: -1 });

    res.json(events);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};