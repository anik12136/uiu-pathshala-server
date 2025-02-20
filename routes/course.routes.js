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


//Get all videos
router.get("/allvideos", courseController.getAllVideos);
// Get all courses
router.get("/courses", courseController.getAllCourses);

// Get a course by ID
router.get("/courses/:id", courseController.getCourseById);

// Get all courses by a specific user
router.get("/courses/user/:email", courseController.getCoursesByUser);

// Update a course title
router.put("/courses/:id/title", courseController.updateCourseTitle);

// Update a course description
router.put(
  "/courses/:id/description",
  courseController.updateCourseDescription
);

// Add a chapter to a course
router.post("/courses/:id/chapters", courseController.addChapter);

// Update a chapter title
router.put(
  "/courses/:courseId/chapters/:chapterId/title",
  courseController.updateChapterTitle
);

// Update a chapter description
router.put(
  "/courses/:courseId/chapters/:chapterId/description",
  courseController.updateChapterDescription
);

// Add a video to a chapter
router.post(
  "/courses/:courseId/chapters/:chapterId/videos",
  upload.single("video"),
  courseController.addVideo
);

// Delete a course
router.delete("/courses/:id", courseController.deleteCourse);

// Delete a chapter from a course
router.delete(
  "/courses/:courseId/chapters/:chapterId",
  courseController.deleteChapter
);

// update course status
router.put("/courses/:id/status", courseController.updateCourseStatus);

module.exports = router;
