const {
    Deadline,
    Syllabus,
    CourseMaterial,
    SharedNote,
    WhiteboardShot
} = require('../models/CourseMaterial');
const User = require('../models/User');
const Class = require('../models/Class');
const uploadToCloudinary = require('../utils/cloudinaryUploader');
const fs = require('fs').promises;
const path = require('path');
const { handleError } = require('../utils/errorHandler');
const cloudinary = require('../utils/cloudinary');

// Helper function to handle file upload
const handleFileUpload = async (file, folder = 'classmgmt') => {
    try {
        // Create temp directory if it doesn't exist
        const tempDir = path.join(__dirname, '../temp');
        await fs.mkdir(tempDir, { recursive: true });

        // Save file temporarily
        const tempFilePath = path.join(tempDir, file.originalname);
        await fs.writeFile(tempFilePath, file.buffer);

        // Upload to Cloudinary
        const result = await uploadToCloudinary(tempFilePath, folder);

        // Clean up temp file
        await fs.unlink(tempFilePath);

        return result.secure_url;
    } catch (error) {
        throw new Error('File upload failed: ' + error.message);
    }
};

// Get all materials for a course
const getCourseMaterials = async (req, res) => {
    try {
        const { courseId, semesterId } = req.params;
        const { type } = req.query;
        const { user } = req; // From auth middleware

        // Get user's class
        const userDetails = await User.findOne({ uid: user.uid });
        if (!userDetails) {
            return res.status(404).json({ message: "User not found" });
        }

        // Get class details using classId string
        const classDetails = await Class.findOne({ classId: userDetails.classId });
        if (!classDetails) {
            return res.status(404).json({ message: "Class not found" });
        }

        let materials;
        const query = { 
            courseId,
            semesterId,
            classId: classDetails._id
        };

        switch (type) {
            case 'deadlines':
                materials = await Deadline.find(query)
                    .populate('uploadedBy', 'name email photoUrl')
                    .sort({ dueDate: 1 });
                break;
            case 'syllabus':
                materials = await Syllabus.findOne(query)
                    .populate('uploadedBy', 'name email photoUrl');
                break;
            case 'materials':
                materials = await CourseMaterial.find(query)
                    .populate('uploadedBy', 'name email photoUrl')
                    .sort({ uploadedAt: -1 });
                break;
            case 'notes':
                materials = await SharedNote.find(query)
                    .populate('uploadedBy', 'name email photoUrl')
                    .populate('likes', 'name')
                    .sort({ uploadedAt: -1 });
                break;
            case 'whiteboard':
                materials = await WhiteboardShot.find(query)
                    .populate('uploadedBy', 'name email photoUrl')
                    .sort({ lectureDate: -1 });
                break;
            default:
                // Get all types of materials
                const [deadlines, syllabus, courseMaterials, notes, whiteboardShots] = await Promise.all([
                    Deadline.find(query).populate('uploadedBy', 'name email photoUrl'),
                    Syllabus.findOne(query).populate('uploadedBy', 'name email photoUrl'),
                    CourseMaterial.find(query).populate('uploadedBy', 'name email photoUrl'),
                    SharedNote.find(query).populate('uploadedBy', 'name email photoUrl').populate('likes', 'name'),
                    WhiteboardShot.find(query).populate('uploadedBy', 'name email photoUrl')
                ]);

                materials = {
                    deadlines,
                    syllabus,
                    courseMaterials,
                    notes,
                    whiteboardShots
                };
        }

        res.status(200).json({
            success: true,
            data: materials
        });

    } catch (error) {
        handleError(res, error);
    }
};

// Upload new material
const uploadMaterial = async (req, res) => {
    try {
        const { type, courseId, semesterId } = req.params;
        const { user } = req;

        // Get user's class
        const userDetails = await User.findOne({ uid: user.uid });
        if (!userDetails) {
            return res.status(404).json({ message: "User not found" });
        }

        // Get class details using classId string
        const classDetails = await Class.findOne({ classId: userDetails.classId });
        if (!classDetails) {
            return res.status(404).json({ message: "Class not found" });
        }

        const materialData = {
            ...req.body,
            uploadedBy: userDetails._id,
            courseId,
            semesterId,
            classId: classDetails._id,
        };

        let material;
        
        if (type === 'whiteboard') {
            // Handle multiple files for whiteboard shots
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No files uploaded'
                });
            }

            // Upload all files to Cloudinary
            const uploadPromises = req.files.map(file => handleFileUpload(file, `classmgmt/${type}`));
            const fileUrls = await Promise.all(uploadPromises);

            // Create files array with URLs and types
            materialData.files = fileUrls.map((url, index) => ({
                url,
                type: req.files[index].mimetype
            }));

            material = new WhiteboardShot(materialData);
        } else {
            // Handle single file upload for other material types
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            // Upload file to Cloudinary
            const fileUrl = await handleFileUpload(req.file, `classmgmt/${type}`);
            materialData.fileUrl = fileUrl;
            materialData.fileType = req.file.mimetype;

            switch (type) {
                case 'deadline':
                    material = new Deadline(materialData);
                    break;
                case 'syllabus':
                    material = new Syllabus(materialData);
                    break;
                case 'material':
                    material = new CourseMaterial(materialData);
                    break;
                case 'note':
                    material = new SharedNote(materialData);
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid material type'
                    });
            }
        }

        await material.save();
        
        // Populate uploadedBy field
        await material.populate('uploadedBy', 'name email photoUrl');

        res.status(201).json({
            success: true,
            data: material
        });

    } catch (error) {
        handleError(res, error);
    }
};

// Update material
const updateMaterial = async (req, res) => {
    try {
        const { type, id, courseId, semesterId } = req.params;
        const { user } = req;
        let updateData = req.body;

        // If file is included in update
        if (req.file) {
            const fileUrl = await handleFileUpload(req.file, `classmgmt/${type}`);
            updateData = {
                ...updateData,
                fileUrl,
                fileType: req.file.mimetype
            };
        }

        let Model;
        switch (type) {
            case 'deadline':
                Model = Deadline;
                break;
            case 'syllabus':
                Model = Syllabus;
                break;
            case 'material':
                Model = CourseMaterial;
                break;
            case 'note':
                Model = SharedNote;
                break;
            case 'whiteboard':
                Model = WhiteboardShot;
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid material type'
                });
        }

        const material = await Model.findOneAndUpdate(
            { _id: id, courseId, semesterId },
            updateData,
            { 
                new: true, 
                runValidators: true 
            }
        ).populate('uploadedBy', 'name email photoUrl');

        if (!material) {
            return res.status(404).json({
                success: false,
                message: 'Material not found'
            });
        }

        res.status(200).json({
            success: true,
            data: material
        });

    } catch (error) {
        handleError(res, error);
    }
};

// Delete material
const deleteMaterial = async (req, res) => {
    try {
        const { type, id, courseId, semesterId } = req.params;

        let Model;
        switch (type) {
            case 'deadline':
                Model = Deadline;
                break;
            case 'syllabus':
                Model = Syllabus;
                break;
            case 'material':
                Model = CourseMaterial;
                break;
            case 'note':
                Model = SharedNote;
                break;
            case 'whiteboard':
                Model = WhiteboardShot;
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid material type'
                });
        }

        const material = await Model.findOneAndDelete({ _id: id, courseId, semesterId });

        if (!material) {
            return res.status(404).json({
                success: false,
                message: 'Material not found'
            });
        }

        // TODO: Delete file from Cloudinary if needed

        res.status(200).json({
            success: true,
            message: 'Material deleted successfully'
        });

    } catch (error) {
        handleError(res, error);
    }
};

// Toggle like on shared note
const toggleNoteLike = async (req, res) => {
    try {
        const { id, courseId, semesterId } = req.params;
        const { user } = req;

        // Get user details
        const userDetails = await User.findOne({ uid: user.uid });
        if (!userDetails) {
            return res.status(404).json({ message: "User not found" });
        }

        const note = await SharedNote.findOne({ _id: id, courseId, semesterId });
        if (!note) {
            return res.status(404).json({
                success: false,
                message: 'Note not found'
            });
        }

        const likeIndex = note.likes.indexOf(userDetails._id);
        if (likeIndex === -1) {
            note.likes.push(userDetails._id);
        } else {
            note.likes.splice(likeIndex, 1);
        }

        await note.save();
        await note.populate('uploadedBy', 'name email photoUrl');
        await note.populate('likes', 'name');

        res.status(200).json({
            success: true,
            data: note
        });

    } catch (error) {
        handleError(res, error);
    }
};

const getClassStudents = async (req, res) => {
    try {
        const { courseId, semesterId } = req.params;

        // Find the class
        const classData = await Class.findOne({ courseId, semesterId });
        if (!classData) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        // Get all students in the class
        const students = await User.find(
            { 
                _id: { $in: classData.students },
                userRole: 'STUDENT'
            },
            'name email photoUrl'
        );

        res.status(200).json({
            success: true,
            data: students
        });
    } catch (error) {
        handleError(res, error);
    }
};

module.exports = {
    getCourseMaterials,
    uploadMaterial,
    updateMaterial,
    deleteMaterial,
    toggleNoteLike,
    getClassStudents
}; 