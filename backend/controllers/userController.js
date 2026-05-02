const User = require("../models/User");

// Search for students by name or studentId
exports.searchStudents = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.length < 2) {
      return res.json([]);
    }

    const students = await User.find({
      $and: [
        { role: { $in: ["student", "organizer"] } },
        {
          $or: [
            { name: { $regex: query, $options: "i" } },
            { studentId: { $regex: query, $options: "i" } }
          ]
        },
        { _id: { $ne: req.user._id } } 
      ]
    }).select("name studentId email department").limit(10);

    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
