const SystemSettings = require("../models/SystemSettings");

// Get system settings for a department
exports.getSettings = async (req, res) => {

  try {
    const department = req.query.department || (req.user ? req.user.department : null);

    if (!department) {
      // If no department is provided (e.g. public route without query), return global default settings
      const globalSettings = await SystemSettings.findOne({}) || { globalWhatsappLink: "", institutionName: "" };
      return res.json(globalSettings);
    }

    let settings = await SystemSettings.findOne({ department });

    if (!settings) {
      // Return defaults
      settings = {
        department,
        maxEventManagers: 5,
        organizerGracePeriodDays: 30,
        categories: ["Technical", "Cultural", "Sports", "Workshop", "Seminar", "Hackathon", "Music", "Art"],
        institutionName: "",
        globalWhatsappLink: ""
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
    const { department, maxEventManagers, organizerGracePeriodDays, categories, institutionName, globalWhatsappLink, paymentQRCode, upiId } = req.body;

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
        globalWhatsappLink: globalWhatsappLink || "",
        paymentQRCode: paymentQRCode || "",
        upiId: upiId || "",
        updatedBy: req.user._id
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({ message: "Settings updated successfully", settings });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
