const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  // Base role never changes programmatically
  baseRole: {
    type: String,
    enum: ["student", "teacher"],
    default: "student"
  },

  // Effective role includes temporary privileges
  role: {
    type: String,
    enum: ["student", "teacher", "organizer", "admin"],
    default: "student"
  },

  department: {
    type: String
  },

  studentId: {
    type: String
  },

  // Temporary organizer privilege tracking
  privileges: {
    isOrganizer: { type: Boolean, default: false },
    organizerGrantedAt: { type: Date },
    organizerGraceStart: { type: Date }, // When grace period started
    managedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }]
  }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);