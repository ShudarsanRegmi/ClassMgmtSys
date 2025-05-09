const Faculty = require('../models/Faculties');

// Create a new faculty
const createFaculty = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required." });
    }

    const newFaculty = new Faculty({ name, email });
    await newFaculty.save();

    res.status(201).json({ message: "Faculty created successfully", data: newFaculty });
  } catch (error) {
    console.error("Error creating faculty:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// (Optional) Get all faculties
const getFaculties = async (req, res) => {
  try {
    const faculties = await Faculty.find();
    res.status(200).json(faculties);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch faculties." });
  }
};

module.exports = {createFaculty, getFaculties};