const mongoose = require("mongoose");

// Video Schema
const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  url: { type: String, required: true }, // File name, accessible by the frontend
});

// Chapter Schema
const chapterSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  videos: [videoSchema], // Array of videos
});

// Course Schema
const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  tags: { type: [String], default: [] }, // Array of tags
  bannerImage: { type: String, required: false }, // Link to an image uploaded via multer
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }, // Owner UID
  status: {
    type: String,
    enum: ["published", "unpublished"],
    default: "unpublished",
  },
  publishedOn: { type: Date }, // Set when the course is published
  rating: { type: Number, min: 0, max: 5, default: 0 }, // Default rating is 0
  chapters: [chapterSchema], // Array of chapters
  createdAt: { type: Date, default: Date.now }, // Auto-generated creation date
});

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;
