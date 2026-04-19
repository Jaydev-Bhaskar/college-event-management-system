const mongoose = require("mongoose");

const poBankSchema = new mongoose.Schema({

  department: {
    type: String,
    required: true,
    unique: true
  },

  pos: [{
    code: { type: String, required: true },
    description: { type: String, required: true }
  }],

  psos: [{
    code: { type: String, required: true },
    description: { type: String, required: true }
  }],

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }

}, { timestamps: true });

module.exports = mongoose.model("POBank", poBankSchema);
