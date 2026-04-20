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

  location: {
    type: String
  },

  maxParticipants: {
    type: Number
  },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  }

}, { timestamps: true });

module.exports = mongoose.model("OrganizerRequest", organizerRequestSchema);