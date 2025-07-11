const User = require('../models/User');
const CourseAssignment = require('../models/CourseAssignment');
const Course = require('../models/Course');
const Class = require('../models/Class');


// where it has been used?
// Get faculty members for a specific class and semester
const getFacultyMembers = async (req, res) => {
  try {
    const { classId, semesterId } = req.params;

    // First get the class document to get the MongoDB _id
    const classDoc = await Class.findOne({ classId });
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Find all course assignments for the class and semester
    const assignments = await CourseAssignment.find({
      class: classDoc._id,
      semester: semesterId
    })
    .populate({
      path: 'faculty',
      match: { role: 'FACULTY' }, // Only get users with role FACULTY
      select: 'name email phone photoUrl' // Select only needed fields
    })
    .populate('course', 'title')
    .lean();

    // Filter out any assignments where faculty wasn't found
    const validAssignments = assignments.filter(assignment => assignment.faculty);

    // Group assignments by faculty
    const facultyMap = new Map();
    validAssignments.forEach(assignment => {
      const faculty = assignment.faculty;
      if (!facultyMap.has(faculty._id.toString())) {
        facultyMap.set(faculty._id.toString(), {
          _id: faculty._id,
          name: faculty.name,
          email: faculty.email,
          phone: faculty.phone,
          photoUrl: faculty.photoUrl,
          courses: [assignment.course.title]
        });
      } else {
        facultyMap.get(faculty._id.toString()).courses.push(assignment.course.title);
      }
    });

    // Convert map to array
    const faculties = Array.from(facultyMap.values());

    res.json({
      faculties,
      total: faculties.length
    });
  } catch (error) {
    console.error('Error fetching faculty members:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// Used in CoruseAssignment form

// Added when course assignment feature was broken dring cleanup
const getFaculties = async (req, res) => {
  try {
    const faculties = await User.find({ role: 'FACULTY' });
    res.status(200).json(faculties);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch faculties." });
  }
};

//not used yet

// Delete a faculty by UID
const deleteFacultyByid = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "ID is required." });
    }

    const deletedFaculty = await Faculty.findOneAndDelete({ _id: id });

    if (!deletedFaculty) {
      return res.status(404).json({ message: "Faculty not found." });
    }

    res.status(200).json({ message: "Faculty deleted successfully." });
  } catch (error) {
    console.error("Error deleting faculty:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { getFacultyMembers, getFaculties, deleteFacultyByid };

