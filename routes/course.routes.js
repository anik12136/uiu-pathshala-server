const express = require("express");
const router = express.Router();
const courseController = require("../controllers/course.controller");
const upload = require("../middleware/upload");



// Create a new course
router.post(
  "/courses",
  upload.single("bannerImage"),
  courseController.createCourse
);

// Get all courses
router.get("/courses", courseController.getAllCourses);

// Get a course by ID
router.get("/courses/:id", courseController.getCourseById);

// Update a course
router.put("/courses/:id", courseController.updateCourse);

// Delete a course
router.delete("/courses/:id", courseController.deleteCourse);

// Add a chapter to a course
router.post("/courses/:id/chapters", courseController.addChapter);

// Delete a chapter from a course
router.delete(
  "/courses/:courseId/chapters/:chapterId",
  courseController.deleteChapter
);

// Add a video to a chapter
router.post(
  "/courses/:id/chapters/:chapterIndex/videos",
  courseController.addVideo
);

// Get all courses by a user
router.get("/courses/user/:userId", courseController.getCoursesByUser);

module.exports = router;
