const OrganizerRequest = require("../models/OrganizerRequest");
const User = require("../models/User");


// Get all organizer requests
exports.getOrganizerRequests = async (req, res) => {
  try {

    const requests = await OrganizerRequest.find().populate("userId", "name email");

    res.json(requests);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Approve organizer request
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

    // update user role
    await User.findByIdAndUpdate(request.userId, {
      role: "organizer"
    });

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