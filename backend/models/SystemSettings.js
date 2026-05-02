const mongoose = require("mongoose");

const systemSettingsSchema = new mongoose.Schema({

  department: {
    type: String,
    required: true,
    unique: true
  },

  maxEventManagers: {
    type: Number,
    default: 5
  },

  organizerGracePeriodDays: {
    type: Number,
    default: 30
  },

  categories: {
    type: [String],
    default: ["Technical", "Cultural", "Sports", "Workshop", "Seminar", "Hackathon", "Music", "Art"]
  },

  institutionName: {
    type: String,
    default: ""
  },

  globalWhatsappLink: {
    type: String,
    default: ""
  },

  paymentQRCode: {
    type: String,
    default: ""
  },

  upiId: {
    type: String,
    default: ""
  },

  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }

}, { timestamps: true });

module.exports = mongoose.model("SystemSettings", systemSettingsSchema);
