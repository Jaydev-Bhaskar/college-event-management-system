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

  registrationStatus: {
    type: String,
    enum: ["pending", "confirmed", "waitlisted", "rejected"],
    default: "confirmed"
  },

  teamName: {
    type: String,
    default: ""
  },

  isTeamLeader: {
    type: Boolean,
    default: false
  },

  teamMembers: [{
    name: { type: String },
    studentId: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { 
      type: String, 
      enum: ["pending", "accepted", "declined"],
      default: "accepted" 
    }
  }],

  paymentScreenshot: {
    type: String
  },

  transactionId: {
    type: String
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