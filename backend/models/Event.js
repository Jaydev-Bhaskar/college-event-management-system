const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({

  title: {
    type: String,
    required: true
  },

  description: {
    type: String,
    required: true
  },

  category: {
    type: String
  },

  date: {
    type: Date,
    required: true
  },

  time: {
    type: String
  },

  location: {
    type: String
  },

  maxParticipants: {
    type: Number
  },

  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  status: {
    type: String,
    enum: ["draft", "published", "completed"],
    default: "draft"
  },

  posterImage: {
    type: String
  },

  feedbackFormId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FeedbackForm"
  },

  // Event managers — scoped attendance access
  eventManagers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],

  // Multiple experts per event
  expertAccountIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "ExpertAccount"
  }],

  // Images for the final report
  reportImages: [{
    type: String
  }],

  // Report metadata
  targetClass: { type: String },
  subjectName: { type: String },
  sessionCoordinator: { type: String },
  department: { type: String },
  agenda: { type: String },
  objectives: { type: String }

}, { timestamps: true });

module.exports = mongoose.model("Event", eventSchema);