const POBank = require("../models/POBank");

// Get PO bank for a department
exports.getPOBank = async (req, res) => {
  try {
    const department = req.user.department || req.query.department;

    if (!department) {
      return res.status(400).json({ message: "Department is required" });
    }

    // Fetch both global and department specific banks
    const [globalBank, deptBank] = await Promise.all([
      POBank.findOne({ department: "Global" }),
      POBank.findOne({ department })
    ]);

    // Merge them
    const mergedPOs = [
      ...(globalBank?.pos || []),
      ...(deptBank?.pos || [])
    ];

    // Remove duplicates by code (prefer dept specific if same code exists, though usually PO1-PO11 are fixed)
    const uniquePOs = Array.from(new Map(mergedPOs.map(item => [item.code, item])).values());

    res.json({
      department,
      pos: uniquePOs,
      psos: deptBank?.psos || []
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create or update PO bank for a department
exports.upsertPOBank = async (req, res) => {
  try {
    const { department, pos, psos } = req.body;

    const dept = req.user.department || department;

    if (!dept) {
      return res.status(400).json({ message: "Department is required" });
    }

    const poBank = await POBank.findOneAndUpdate(
      { department: dept },
      {
        department: dept,
        pos: pos || [],
        psos: psos || [],
        createdBy: req.user._id
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({ message: "PO/PSO bank updated successfully", poBank });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add a single PO to the bank
exports.addPO = async (req, res) => {
  try {
    const { department, code, description, type } = req.body;
    const dept = req.user.department || department;

    let poBank = await POBank.findOne({ department: dept });

    if (!poBank) {
      poBank = new POBank({ department: dept, pos: [], psos: [], createdBy: req.user._id });
    }

    const field = type === "pso" ? "psos" : "pos";

    // Check for duplicate code
    const existing = poBank[field].find(p => p.code === code);
    if (existing) {
      return res.status(400).json({ message: `${code} already exists in ${dept}` });
    }

    poBank[field].push({ code, description });
    await poBank.save();

    res.json({ message: `${code} added successfully`, poBank });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remove a PO/PSO from the bank
exports.removePO = async (req, res) => {
  try {
    const { department, code, type } = req.body;
    const dept = req.user.department || department;

    const poBank = await POBank.findOne({ department: dept });

    if (!poBank) {
      return res.status(404).json({ message: "PO bank not found for this department" });
    }

    const field = type === "pso" ? "psos" : "pos";
    poBank[field] = poBank[field].filter(p => p.code !== code);
    await poBank.save();

    res.json({ message: `${code} removed successfully`, poBank });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
