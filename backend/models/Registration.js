const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event"
  },

  attendanceStatus: {
    type: String,
    enum: ["pending", "present", "absent"],
    default: "pending"
  },

  qrCode: {
    type: String
  },

  certificateGenerated: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

module.exports = mongoose.model("Registration", registrationSchema);