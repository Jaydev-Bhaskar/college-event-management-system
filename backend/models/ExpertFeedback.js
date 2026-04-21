const mongoose = require("mongoose");

const expertFeedbackSchema = new mongoose.Schema({

  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true
  },

  expertName: {
    type: String,
    default: "Anonymous Expert"
  },

  expertEmail: {
    type: String,
    default: ""
  },

  designation: {
    type: String,
    default: ""
  },

  responses: [{
    questionIndex: Number,
    questionText: String,
    value: mongoose.Schema.Types.Mixed
  }],

  comments: {
    type: String,
    default: ""
  }

}, { timestamps: true });

module.exports = mongoose.model("ExpertFeedback", expertFeedbackSchema);
