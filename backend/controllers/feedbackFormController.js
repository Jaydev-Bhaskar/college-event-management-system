const FeedbackForm = require("../models/FeedbackForm");
const Event = require("../models/Event");

// Create a new feedback form for an event
exports.createFeedbackForm = async (req, res) => {
  try {
    const { eventId, sections, poMapping, psoMapping, poQuestions, overallQuestion, openEndedQuestions, expertSection } = req.body;

    // Verify the event exists and belongs to this organizer
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (req.user.role !== "admin" && event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the event organizer can create a feedback form" });
    }

    // Check if form already exists for this event
    const existingForm = await FeedbackForm.findOne({ eventId });
    if (existingForm) {
      return res.status(400).json({ message: "Feedback form already exists for this event. Use update instead." });
    }

    const form = new FeedbackForm({
      eventId,
      sections: sections || [],
      poMapping: poMapping || [],
      psoMapping: psoMapping || [],
      poQuestions: poQuestions || [],
      overallQuestion: overallQuestion || undefined,
      openEndedQuestions: openEndedQuestions || [],
      expertSection: expertSection || { enabled: true, questions: [] },
      status: req.body.status || "draft",
      createdBy: req.user._id
    });

    await form.save();

    // Link form to event
    event.feedbackFormId = form._id;
    await event.save();

    res.status(201).json({ message: "Feedback form created", form });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a feedback form
exports.updateFeedbackForm = async (req, res) => {
  try {
    const { formId } = req.params;
    const updates = req.body;

    const form = await FeedbackForm.findById(formId);
    if (!form) {
      return res.status(404).json({ message: "Feedback form not found" });
    }

    // Verify ownership
    const event = await Event.findById(form.eventId);
    if (req.user.role !== "admin" && event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the event organizer can update this form" });
    }

    // Update fields
    const allowedFields = ["sections", "poMapping", "psoMapping", "poQuestions", "overallQuestion", "openEndedQuestions", "expertSection", "status"];
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        form[field] = updates[field];
      }
    });

    await form.save();

    res.json({ message: "Feedback form updated", form });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get feedback form for an event
exports.getFeedbackForm = async (req, res) => {
  try {
    const { eventId } = req.params;

    const form = await FeedbackForm.findOne({ eventId });

    if (!form) {
      return res.status(404).json({ message: "No feedback form found for this event" });
    }

    res.json(form);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get feedback form by ID
exports.getFeedbackFormById = async (req, res) => {
  try {
    const form = await FeedbackForm.findById(req.params.formId);

    if (!form) {
      return res.status(404).json({ message: "Feedback form not found" });
    }

    res.json(form);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a feedback form
exports.deleteFeedbackForm = async (req, res) => {
  try {
    const form = await FeedbackForm.findById(req.params.formId);

    if (!form) {
      return res.status(404).json({ message: "Feedback form not found" });
    }

    // Verify ownership
    const event = await Event.findById(form.eventId);
    if (req.user.role !== "admin" && event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the event organizer can delete this form" });
    }

    // Unlink from event
    if (event) {
      event.feedbackFormId = undefined;
      await event.save();
    }

    await FeedbackForm.findByIdAndDelete(form._id);

    res.json({ message: "Feedback form deleted" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
