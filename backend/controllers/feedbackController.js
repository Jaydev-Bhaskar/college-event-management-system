const StudentFeedback = require("../models/StudentFeedback");
const ExpertFeedback = require("../models/ExpertFeedback");
const Registration = require("../models/Registration");
const FeedbackForm = require("../models/FeedbackForm");
const Event = require("../models/Event");

// Submit student feedback (requires attendance = present)
exports.submitStudentFeedback = async (req, res) => {
  try {
    const { eventId, responses, poResponses, overallRating, openEndedResponses } = req.body;

    // Check registration and attendance
    const registration = await Registration.findOne({
      userId: req.user._id,
      eventId,
      attendanceStatus: "present"
    });

    if (!registration) {
      return res.status(403).json({
        message: "You must have attended this event to submit feedback"
      });
    }

    // Check if already submitted
    if (registration.feedbackSubmitted) {
      return res.status(400).json({ message: "You have already submitted feedback for this event" });
    }

    const feedback = new StudentFeedback({
      registrationId: registration._id,
      eventId,
      userId: req.user._id,
      responses: responses || [],
      poResponses: poResponses || [],
      overallRating,
      openEndedResponses: openEndedResponses || []
    });

    await feedback.save();

    // Mark feedback as submitted
    registration.feedbackSubmitted = true;
    await registration.save();

    res.status(201).json({ message: "Feedback submitted successfully" });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "You have already submitted feedback for this event" });
    }
    res.status(500).json({ message: error.message, error: error.message });
  }
};

// Submit expert feedback (public — no login required, link-based access)
exports.submitExpertFeedback = async (req, res) => {
  try {
    const { eventId, expertName, expertEmail, designation, responses, comments } = req.body;

    if (!eventId) {
      return res.status(400).json({ message: "Event ID is required" });
    }

    // Verify the feedback form exists and is published
    const form = await FeedbackForm.findOne({ eventId, status: "published" });
    if (!form) {
      return res.status(404).json({ message: "No published feedback form found for this event" });
    }

    if (!form.expertSection?.enabled || !form.expertSection?.questions?.length) {
      return res.status(400).json({ message: "Expert feedback is not enabled for this event" });
    }

    const feedback = new ExpertFeedback({
      eventId,
      expertName: expertName || "Anonymous Expert",
      expertEmail: expertEmail || "",
      designation: designation || "",
      responses: responses || [],
      comments: comments || ""
    });

    await feedback.save();

    res.status(201).json({ message: "Expert feedback submitted successfully. Thank you!" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get feedback analytics for an event (organizer/admin view)
// Returns anonymized aggregate data — no student names
exports.getFeedbackAnalytics = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Get the form structure
    const form = await FeedbackForm.findOne({ eventId });
    if (!form) {
      return res.status(404).json({ message: "No feedback form found for this event" });
    }

    // Get all student feedback (anonymized — no userId or names returned)
    const feedbacks = await StudentFeedback.find({ eventId }).select("-userId -registrationId");

    // Get expert feedback
    const expertFeedbacks = await ExpertFeedback.find({ eventId });

    // Compute averages per section
    const sectionAverages = {};
    const poAverages = {};
    let overallSum = 0;
    let overallCount = 0;

    feedbacks.forEach(fb => {
      // Section averages
      fb.responses.forEach(r => {
        const key = r.sectionId;
        if (!sectionAverages[key]) {
          sectionAverages[key] = { sum: 0, count: 0, questions: {} };
        }
        sectionAverages[key].sum += Number(r.value) || 0;
        sectionAverages[key].count += 1;

        // Per-question average
        const qKey = `${key}_q${r.questionIndex}`;
        if (!sectionAverages[key].questions[qKey]) {
          sectionAverages[key].questions[qKey] = { sum: 0, count: 0 };
        }
        sectionAverages[key].questions[qKey].sum += Number(r.value) || 0;
        sectionAverages[key].questions[qKey].count += 1;
      });

      // PO averages
      fb.poResponses.forEach(pr => {
        if (!poAverages[pr.poCode]) {
          poAverages[pr.poCode] = { sum: 0, count: 0 };
        }
        
        // Convert value to number if possible (for ratings)
        // If it's an MCQ, we assume the frontend sends a numeric value or 1 for correct
        const val = Number(pr.value);
        if (!isNaN(val)) {
          poAverages[pr.poCode].sum += val;
          poAverages[pr.poCode].count += 1;
        }
      });

      // Overall
      if (fb.overallRating) {
        overallSum += fb.overallRating;
        overallCount += 1;
      }
    });

    // Flatten section averages
    const computedSections = {};
    Object.keys(sectionAverages).forEach(key => {
      const s = sectionAverages[key];
      computedSections[key] = {
        average: s.count > 0 ? (s.sum / s.count).toFixed(2) : 0,
        totalResponses: s.count,
        questions: {}
      };
      Object.keys(s.questions).forEach(qKey => {
        const q = s.questions[qKey];
        computedSections[key].questions[qKey] = {
          average: q.count > 0 ? (q.sum / q.count).toFixed(2) : 0,
          totalResponses: q.count
        };
      });
    });

    // Collect open-ended responses (anonymized)
    const openEndedCollected = [];
    feedbacks.forEach(fb => {
      fb.openEndedResponses.forEach(oe => {
        if (oe.answer && oe.answer.trim()) {
          openEndedCollected.push({
            questionIndex: oe.questionIndex,
            answer: oe.answer
          });
        }
      });
    });
    
    // Flatten PO averages
    const flattenedPOs = {};
    Object.keys(poAverages).forEach(code => {
      const p = poAverages[code];
      flattenedPOs[code] = p.count > 0 ? (p.sum / p.count).toFixed(2) : 0;
    });

    res.json({
      eventId,
      totalResponses: feedbacks.length,
      sectionAverages: computedSections,
      poAverages: flattenedPOs,
      overallAverage: overallCount > 0 ? (overallSum / overallCount).toFixed(2) : 0,
      openEndedResponses: openEndedCollected,
      expertFeedbacks,
      formStructure: form
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Check if a student can give feedback (has attended)
exports.canGiveFeedback = async (req, res) => {
  try {
    const { eventId } = req.params;

    const registration = await Registration.findOne({
      userId: req.user._id,
      eventId,
      attendanceStatus: "present"
    });

    if (!registration) {
      return res.json({ canSubmit: false, reason: "Not attended" });
    }

    if (registration.feedbackSubmitted) {
      return res.json({ canSubmit: false, reason: "Already submitted" });
    }

    res.json({ canSubmit: true });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
