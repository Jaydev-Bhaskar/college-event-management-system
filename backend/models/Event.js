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

  time: { // Start time
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

  posterImage: {
    type: String
  },

  feedbackFormId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FeedbackForm"
  },

  certificateTemplate: {
    type: String
  },

  organizerContact: {
    type: String,
    default: ""
  },

  whatsappLink: {
    type: String,
    default: ""
  },

  paymentQR: {
    type: String
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
  objectives: { type: String },
  activitySummary: { type: String },
  outcomes: { type: String },
  studentParticipationCount: { type: String },
  keyHighlights: { type: String },
  challenges: { type: String },
  conclusion: { type: String },
  futureScope: { type: String },
  selectedCOs: [{ type: String }],
  selectedPOs: [{ type: String }],
  selectedPSOs: [{ type: String }],
  hodName: { type: String },
  actionTaken: { type: String },
  programmeCoordinator: { type: String }

}, { timestamps: true });

module.exports = mongoose.model("Event", eventSchema);