const mongoose = require("mongoose");

const organizerRequestSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  eventTitle: {
    type: String,
    required: true
  },

  eventDescription: {
    type: String
  },

  proposedDate: {
    type: Date
  },

  expectedParticipants: {
    type: Number
  },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  }

}, { timestamps: true });

module.exports = mongoose.model("OrganizerRequest", organizerRequestSchema);