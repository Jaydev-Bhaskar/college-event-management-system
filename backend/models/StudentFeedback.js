const mongoose = require("mongoose");

const studentFeedbackSchema = new mongoose.Schema({

  registrationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Registration",
    required: true
  },

  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // Section-wise responses: { sectionTitle, questionIndex, value }
  responses: [{
    sectionId: String,
    questionIndex: Number,
    value: mongoose.Schema.Types.Mixed // Number for ratings, String for text
  }],

  // PO-specific question responses
  poResponses: [{
    poCode: String,
    questionIndex: Number,
    selectedOption: String
  }],

  overallRating: {
    type: Number,
    min: 1,
    max: 5
  },

  openEndedResponses: [{
    questionIndex: Number,
    answer: String
  }]

}, { timestamps: true });

// One feedback per user per event
studentFeedbackSchema.index({ userId: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model("StudentFeedback", studentFeedbackSchema);
