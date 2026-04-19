const mongoose = require("mongoose");

const expertFeedbackSchema = new mongoose.Schema({

  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true
  },

  expertAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ExpertAccount",
    required: true
  },

  responses: [{
    questionIndex: Number,
    value: mongoose.Schema.Types.Mixed // Number for ratings, String for text, "NA" for not applicable
  }],

  comments: {
    type: String,
    default: ""
  }

}, { timestamps: true });

// One feedback per expert per event
expertFeedbackSchema.index({ expertAccountId: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model("ExpertFeedback", expertFeedbackSchema);
