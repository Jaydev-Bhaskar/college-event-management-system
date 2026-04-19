const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true
  },

  attendanceStatus: {
    type: String,
    enum: ["pending", "present", "absent"],
    default: "pending"
  },

  attendanceMarkedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  attendanceTimestamp: {
    type: Date
  },

  qrCode: {
    type: String
  },

  feedbackSubmitted: {
    type: Boolean,
    default: false
  },

  certificateGenerated: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

// One registration per user per event
registrationSchema.index({ userId: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model("Registration", registrationSchema);