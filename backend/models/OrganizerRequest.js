const mongoose = require("mongoose");

const organizerRequestSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  title: {
    type: String,
    required: true
  },

  description: {
    type: String
  },

  category: {
    type: String
  },

  date: {
    type: Date
  },

  time: {
    type: String
  },

  endDate: {
    type: Date
  },

  endTime: {
    type: String
  },

  location: {
    type: String
  },

  maxParticipants: {
    type: Number
  },

  posterImage: {
    type: String
  },

  registrationType: {
    type: String,
    enum: ["individual", "team"],
    default: "individual"
  },

  minTeamSize: {
    type: Number,
    default: 1
  },

  maxTeamSize: {
    type: Number,
    default: 1
  },

  requiresApproval: {
    type: Boolean,
    default: false
  },

  isPaid: {
    type: Boolean,
    default: false
  },

  registrationFee: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },

  department: {
    type: String
  }

}, { timestamps: true });

module.exports = mongoose.model("OrganizerRequest", organizerRequestSchema);