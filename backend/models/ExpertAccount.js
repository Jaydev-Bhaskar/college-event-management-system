const mongoose = require("mongoose");

const expertAccountSchema = new mongoose.Schema({

  username: {
    type: String,
    required: true,
    unique: true
  },

  passwordHash: {
    type: String,
    required: true
  },

  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  expiresAt: {
    type: Date,
    required: true
  },

  isActive: {
    type: Boolean,
    default: true
  },

  expertName: {
    type: String,
    required: true
  },

  designation: {
    type: String
  },

  organization: {
    type: String
  },

  sessionNotes: {
    type: String,
    default: ""
  },

  uploadedResources: [{
    fileName: String,
    fileUrl: String,
    uploadedAt: { type: Date, default: Date.now }
  }]

}, { timestamps: true });

// Auto-deactivate expired accounts on query
expertAccountSchema.pre("findOne", function() {
  this.where({ isActive: true, expiresAt: { $gt: new Date() } });
});

module.exports = mongoose.model("ExpertAccount", expertAccountSchema);
