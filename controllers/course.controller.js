const connectDB = require("../utils/db"); 
const { ObjectId } = require("mongodb");  // Import ObjectId from mongodb package


// Create a new course
const createCourse = async (req, res) => {
  try {
    const { title, description, tags, creator } = req.body;
    const bannerImage = req.file?.filename; // Path of the uploaded image using multer

    const newCourse = {
      title,
      description: description || "", // Default to empty string
      tags: tags || "", // Default to empty string
      bannerImage: bannerImage || "",
      creator,
      status: "unpublished", // Default status
      publishedOn: null,
      rating: 0,
      chapters: [],
    };

    const db = await connectDB();
    const courseCollection = db.collection("courses");

    const result = await courseCollection.insertOne(newCourse);
    res
      .status(201)
      .json({ message: "Course created successfully", course: result });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to create course", details: error.message });
  }
};

// Get all courses
const getAllCourses = async (req, res) => {
  try {
    const db = await connectDB();
    const courses = db.collection("courses");

    const result = await courses.find().toArray();
      // .aggregate([
      //   {
      //     $lookup: {
      //       from: "users",
      //       localField: "creator",
      //       foreignField: "_id",
      //       as: "creatorDetails",
      //     },
      //   },
      //   {
      //     $unwind: "$creatorDetails",
      //   },
      // ])
      // .toArray();

    res.status(200).json(result);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch courses", details: error.message });
  }
};

// Get all courses by a specific user
const getCoursesByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const db = await connectDB();
    const courses = db.collection("courses");

    const result = await courses
      .aggregate([
        {
          $match: { creator: userId },
        },
        {
          $lookup: {
            from: "users",
            localField: "creator",
            foreignField: "_id",
            as: "creatorDetails",
          },
        },
        {
          $unwind: "$creatorDetails",
        },
      ])
      .toArray();

    if (!result.length) {
      return res
        .status(404)
        .json({ message: "No courses found for this user" });
    }

    res.status(200).json(result);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch user courses", details: error.message });
  }
};


// Get a single course by ID
const getCourseById = async (req, res) => {
  try {
    const courseId = req.params.id;
    console.log(courseId);
    console.log(`Received courseId: ${courseId}`); // Log the courseId to verify input

    // Ensure the courseId is provided and is a valid string
    if (!courseId || typeof courseId !== "string") {
      return res.status(400).json({ error: "Invalid course ID format" });
    }

    // Check if the courseId is a valid ObjectId string
    if (!ObjectId.isValid(courseId)) {
      return res.status(400).json({ error: "Invalid course ID format" });
    }

    // Convert the courseId to ObjectId only if it's valid
    const courseObjectId = new ObjectId(courseId);
    console.log(`Converted courseId to ObjectId: ${courseObjectId}`); // Log the converted ObjectId

    const db = await connectDB();
    const courseCollection = db.collection("courses");

    const course = await courseCollection.findOne({
      _id: new ObjectId(courseId),
    });

    if (!course) return res.status(404).json({ error: "Course not found" });

    res.status(200).json(course);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch course", details: error.message });
  }
};

// Update a course
const updateCourse = async (req, res) => {
  try {
    const courseId  = req.params.id;
    const { title, description, tags, status } = req.body;
    const bannerImage = req.file?.filename;

    const db = await connectDB();
    const courses = db.collection("courses");

    const updatedCourse = {
      title,
      description,
      tags,
      bannerImage,
      status,
      publishedOn: status === "published" ? Date.now() : null,
    };

    const result = await courses.updateOne(
      { _id: new ObjectId(courseId) },
      { $set: updatedCourse }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Course not found" });
    }

    res
      .status(200)
      .json({ message: "Course updated successfully", course: updatedCourse });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to update course", details: error.message });
  }
};

// Add a chapter to a course
const addChapter = async (req, res) => {
  try {
    const courseId = req.params.id;
    const { title, description } = req.body;

    const db = await connectDB();
    const courses = db.collection("courses");

    const result = await courses.updateOne(
      { _id: new ObjectId(courseId) },
      { $push: { chapters: { title, description } } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.status(201).json({ message: "Chapter added successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to add chapter", details: error.message });
  }
};

// Add a video to a chapter
const addVideo = async (req, res) => {
  try {
    const { courseId, chapterId } = req.params;
    const { title, description } = req.body;
    const url = req.file?.path; // Path of the uploaded video using multer

    const db = await connectDB();
    const courses = db.collection("courses");

    const result = await courses.updateOne(
      { _id: new ObjectId(courseId), "chapters._id": new ObjectId(chapterId) },
      { $push: { "chapters.$.videos": { title, description, url } } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Course or Chapter not found" });
    }

    res.status(201).json({ message: "Video added successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to add video", details: error.message });
  }
};

// Delete a course
const deleteCourse = async (req, res) => {
  try {
    const courseId  = req.params.id;

    const db = await connectDB();
    const courses = db.collection("courses");

    const result = await courses.deleteOne({ _id: new ObjectId(courseId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.status(200).json({ message: "Course deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to delete course", details: error.message });
  }
};

// Delete a chapter from a course
const deleteChapter = async (req, res) => {
  try {
    const { courseId, chapterId } = req.params;

    const db = await connectDB();
    const courses = db.collection("courses");

    const result = await courses.updateOne(
      { _id: new ObjectId(courseId) },
      { $pull: { chapters: { _id: new ObjectId(chapterId) } } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Course or Chapter not found" });
    }

    res.status(200).json({ message: "Chapter deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to delete chapter", details: error.message });
  }
};

module.exports = {
  createCourse,
  getAllCourses,
  getCoursesByUser,
  getCourseById,
  updateCourse,
  addChapter,
  addVideo,
  deleteChapter,
  deleteCourse,
};