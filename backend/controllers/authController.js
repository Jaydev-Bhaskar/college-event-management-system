const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Register user
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, department, role, studentId } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Base role is permanent — only student or teacher
    const baseRole = (role === "teacher") ? "teacher" : "student";

    const user = new User({
      name,
      email,
      password: hashedPassword,
      department,
      baseRole,
      role: baseRole, // Effective role starts as base role
      studentId: studentId || ""
    });

    await user.save();

    res.status(201).json({
      message: "User registered successfully"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Login user
exports.loginUser = async (req, res) => {
  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return user without password
    const userObj = user.toObject();
    delete userObj.password;

    res.json({
      token,
      user: userObj
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get current user profile
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// [DEV ONLY] Setup account — create teacher/admin accounts directly
// TODO: Remove before production
exports.setupAccount = async (req, res) => {
  try {
    const { name, email, password, department, role } = req.body;

    if (!name || !email || !password || !department) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // For admin: set both role and baseRole
    const actualRole = role === 'admin' ? 'admin' : 'teacher';
    const baseRole = role === 'admin' ? 'teacher' : 'teacher'; // baseRole is always teacher for faculty

    const user = new User({
      name,
      email,
      password: hashedPassword,
      department,
      baseRole,
      role: actualRole,
    });

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json({
      message: `${actualRole} account created successfully`,
      user: userObj
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};