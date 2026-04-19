const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  type: {
    type: String,
    enum: ["rating_1_5", "rating_1_3", "mcq", "short_text", "long_text", "yes_no"],
    required: true
  },
  required: { type: Boolean, default: true },
  options: [String] // For MCQ type questions
}, { _id: true });

const sectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  order: { type: Number, required: true },
  questions: [questionSchema]
}, { _id: true });

const poQuestionSchema = new mongoose.Schema({
  poCode: { type: String, required: true },
  text: { type: String, required: true },
  type: {
    type: String,
    enum: ["mcq", "short_text", "rating_1_5"],
    default: "mcq"
  },
  options: [String],
  answer: String // Correct answer for MCQ (used in report, not shown to students)
}, { _id: true });

const feedbackFormSchema = new mongoose.Schema({

  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
    unique: true
  },

  sections: [sectionSchema],

  poMapping: [String],   // e.g. ["PO1", "PO2", "PO5"]
  psoMapping: [String],  // e.g. ["PSO3"]

  poQuestions: [poQuestionSchema],

  overallQuestion: {
    text: { type: String, default: "Overall, how would you rate this event?" },
    type: { type: String, default: "rating_1_3" }
  },

  openEndedQuestions: [{
    text: { type: String, required: true },
    required: { type: Boolean, default: false }
  }],

  expertSection: {
    enabled: { type: Boolean, default: true },
    questions: [questionSchema]
  },

  status: {
    type: String,
    enum: ["draft", "published"],
    default: "draft"
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }

}, { timestamps: true });

module.exports = mongoose.model("FeedbackForm", feedbackFormSchema);
