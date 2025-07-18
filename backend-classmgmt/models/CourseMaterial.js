const mongoose = require('mongoose');

// Base schema for all types of materials
const materialBaseSchema = {
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    semesterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Semester',
        required: true
    },
    classId: {
        type: String,
        required: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
};

// Deadline Schema
const deadlineSchema = new mongoose.Schema({
    ...materialBaseSchema,
    fileUrl: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        required: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    type: {
        type: String,
        enum: ['ASSIGNMENT', 'PROJECT', 'QUIZ', 'EXAM', 'OTHER'],
        required: true
    },
    status: {
        type: String,
        enum: ['UPCOMING', 'ONGOING', 'COMPLETED'],
        default: 'UPCOMING'
    }
});

// Course Material Schema (for lecture notes, presentations, etc.)
const courseMaterialSchema = new mongoose.Schema({
    ...materialBaseSchema,
    fileUrl: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        required: true
    },
    materialType: {
        type: String,
        enum: ['LECTURE_NOTE', 'PRESENTATION', 'REFERENCE', 'OTHER'],
        required: true
    },
    unit: {
        type: String,
        required: true
    }
});

// Shared Notes Schema
const sharedNoteSchema = new mongoose.Schema({
    ...materialBaseSchema,
    fileUrl: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        required: true
    },
    tags: [String],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isVerified: {
        type: Boolean,
        default: false
    },
    sharedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

// Whiteboard Shot Schema
const whiteboardShotSchema = new mongoose.Schema({
    ...materialBaseSchema,
    files: [{
        url: {
            type: String,
            required: true
        },
        type: {
            type: String,
            required: true
        }
    }],
    topic: {
        type: String,
        required: true
    },
    lectureDate: {
        type: Date,
        required: true
    }
});

// Create models
const Deadline = mongoose.model('Deadline', deadlineSchema);
const CourseMaterial = mongoose.model('CourseMaterial', courseMaterialSchema);
const SharedNote = mongoose.model('SharedNote', sharedNoteSchema);
const WhiteboardShot = mongoose.model('WhiteboardShot', whiteboardShotSchema);

module.exports = {
    Deadline,
    CourseMaterial,
    SharedNote,
    WhiteboardShot
}; 