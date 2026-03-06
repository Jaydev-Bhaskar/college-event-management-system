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
    ref: "User"
  },

  posterImage: {
    type: String
  }

}, { timestamps: true });

module.exports = mongoose.model("Event", eventSchema);