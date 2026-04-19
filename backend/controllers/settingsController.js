const SystemSettings = require("../models/SystemSettings");

// Get system settings for a department
exports.getSettings = async (req, res) => {
  try {
    const department = req.query.department || req.user.department;

    if (!department) {
      return res.status(400).json({ message: "Department is required" });
    }

    let settings = await SystemSettings.findOne({ department });

    if (!settings) {
      // Return defaults
      settings = {
        department,
        maxEventManagers: 5,
        organizerGracePeriodDays: 30,
        categories: ["Technical", "Cultural", "Sports", "Workshop", "Seminar", "Hackathon", "Music", "Art"],
        institutionName: ""
      };
    }

    res.json(settings);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update system settings
exports.updateSettings = async (req, res) => {
  try {
    const { department, maxEventManagers, organizerGracePeriodDays, categories, institutionName } = req.body;

    const dept = department || req.user.department;

    if (!dept) {
      return res.status(400).json({ message: "Department is required" });
    }

    const settings = await SystemSettings.findOneAndUpdate(
      { department: dept },
      {
        department: dept,
        maxEventManagers: maxEventManagers || 5,
        organizerGracePeriodDays: organizerGracePeriodDays || 30,
        categories: categories || undefined,
        institutionName: institutionName || "",
        updatedBy: req.user._id
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({ message: "Settings updated successfully", settings });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
