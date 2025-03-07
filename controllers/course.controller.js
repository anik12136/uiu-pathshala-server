const connectDB = require("../utils/db"); 
const { ObjectId } = require("mongodb");  // Import ObjectId from mongodb package


// Create a new course
const createCourse = async (req, res) => {
  try {
    const { title, description, tags, creator } = req.body;
    const bannerImage = req.file?.filename || ""; // Default empty string if no image

    const tagsArray = tags?.split(" "); // Convert tags string to array
    const newCourse = {
      title,
      description: description || "", // Default to empty string
      tags: tagsArray || "", // Default to empty array
      bannerImage: bannerImage || "",
      creator,
      status: "private", // Default status
      publishedOn: null,
      rating: 0,
      chapters: [],
      createdAt: new Date(),
    };

    const db = await connectDB();
    const courseCollection = db.collection("courses");
    const usersCollection = db.collection("users");
    const notificationsCollection = db.collection("notifications");

    // Insert the new course into the database
    const result = await courseCollection.insertOne(newCourse);

    // Fetch all users to send notifications
    const users = await usersCollection.find({}, { projection: { _id: 1 } }).toArray();
    console.log(users);
    
    // Create notifications for all users
    const notifications = users.map((user) => ({
      userId: user._id,
      message: `📚 A new course '${title}' has been added! 🎉`,
      courseId: result.insertedId,
      isRead: false,
      createdAt: new Date(),
    }));

    // Insert notifications into the notifications collection
    if (notifications.length > 0) {
      await notificationsCollection.insertMany(notifications);
    }

    res.status(201).json({ message: "Course created successfully", course: result });
  } catch (error) {
    res.status(500).json({ error: "Failed to create course", details: error.message });
  }
};

// Get all courses
const getAllCourses = async (req, res) => {
  try {
    const db = await connectDB();
    const courses = db.collection("courses");

    const result = await courses
      .aggregate([
        {
          $lookup: {
            from: "users",
            localField: "creator",
            foreignField: "email",
            as: "creatorDetails",
          },
        },
        {
          $unwind: "$creatorDetails",
        },
      ])
      .toArray();

    res.status(200).json(result);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch courses", details: error.message });
  }
};



function extractVideos(courses) {
  return courses.flatMap(course => 
    course.chapters.flatMap(chapter => 
      chapter.videos.map(video => ({
        videoId: video._id,
        title: video.title,
        description: video.description,
        filename: video.filename,
        courseTitle: course.title,
        courseId: course._id,
        chapterTitle: chapter.title,
        chapterId: chapter._id,
        creatorName: course.creatorDetails.name,
        creatorEmail: course.creatorDetails.email,
        courseTags: course.tags
      }))
    )
  );
}


// get all videos in all courses with the name of the creators and name of the course and the chapter name along with the video titles and descriptions
const getAllVideos = async (req, res) => {

  try {
    const db = await connectDB();
    const courses = db.collection("courses");

    const result = await courses
      .aggregate([
        {
          $lookup: {
            from: "users",
            localField: "creator",
            foreignField: "email",
            as: "creatorDetails",
          },
        },
        {
          $unwind: "$creatorDetails",
        },
      ])
      .toArray();

    const videos = extractVideos(result);

    res.status(200).json(videos);

  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch all videos", details: error.message });
  }
  

}

// Get all courses by a specific user
const getCoursesByUser = async (req, res) => {
  try {
    // Get the creator's email from URL parameters or query string
    const creatorEmail = req.params.email;
    if (!creatorEmail) {
      return res.status(400).json({ error: "Creator email is required" });
    }

    const db = await connectDB();
    const coursesCollection = db.collection("courses");

    const result = await coursesCollection
      .aggregate([
        // First filter courses by creator email
        {
          $match: { creator: creatorEmail },
        },
        {
          $lookup: {
            from: "users",
            localField: "creator",
            foreignField: "email",
            as: "creatorDetails",
          },
        },
        {
          $unwind: "$creatorDetails",
        },
      ])
      .toArray();

    res.status(200).json(result);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch courses", details: error.message });
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




// Add a chapter to a course
const addChapter = async (req, res) => {
  try {
    const courseId = req.params.id;
    const { title, description } = req.body;

    const db = await connectDB();
    const courses = db.collection("courses");

    const result = await courses.updateOne(
      { _id: new ObjectId(courseId) },
      { $push: { chapters: { _id: new ObjectId(), title, description } } }
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
    const videoFile = req.file?.filename; // Path of the uploaded video using multer


    if(title === undefined || description === undefined || videoFile === undefined){
      return res.status(400).json({ error: "Please provide title, description and video file" });
    }
    const db = await connectDB();
    const courses = db.collection("courses");

    const result = await courses.updateOne(
      { _id: new ObjectId(courseId), "chapters._id": new ObjectId(chapterId) },
      {
        $push: {
          "chapters.$.videos": {
            _id: new ObjectId(),
            title,
            description,
            filename: videoFile,
          },
        },
      }
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


// Update course title
const updateCourseTitle = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    const db = await connectDB();
    const courses = db.collection("courses");

    const result = await courses.updateOne(
      { _id: new ObjectId(id) },
      { $set: { title } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.status(200).json({ message: "Course title updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update course title", details: error.message });
  }
};

// Update course description
const updateCourseDescription = async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    const db = await connectDB();
    const courses = db.collection("courses");

    const result = await courses.updateOne(
      { _id: new ObjectId(id) },
      { $set: { description } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.status(200).json({ message: "Course description updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update course description", details: error.message });
  }
};

// Update chapter title
const updateChapterTitle = async (req, res) => {
  try {
    const { courseId, chapterId } = req.params;
    const { title } = req.body;

    const db = await connectDB();
    const courses = db.collection("courses");

    const result = await courses.updateOne(
      { _id: new ObjectId(courseId), "chapters._id": new ObjectId(chapterId) },
      { $set: { "chapters.$.title": title } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Course or Chapter not found" });
    }

    res.status(200).json({ message: "Chapter title updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update chapter title", details: error.message });
  }
};

// Update chapter description
const updateChapterDescription = async (req, res) => {
  try {
    const { courseId, chapterId } = req.params;
    const { description } = req.body;

    const db = await connectDB();
    const courses = db.collection("courses");

    const result = await courses.updateOne(
      { _id: new ObjectId(courseId), "chapters._id": new ObjectId(chapterId) },
      { $set: { "chapters.$.description": description } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Course or Chapter not found" });
    }

    res.status(200).json({ message: "Chapter description updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update chapter description", details: error.message });
  }
};

// update status of a course (published/private)
const updateCourseStatus = async (req, res) => {

  try {
    const { id } = req.params;
    const { status } = req.body;

    const db = await connectDB();
    const courses = db.collection("courses");

    const result = await courses.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status,
          publishedOn: new Date(), // Set to the current date and time
        },
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.status(200).json({ message: "Course status updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to update course status", details: error.message });
  }

}


module.exports = {
  createCourse,
  getAllCourses,
  getAllVideos,
  getCoursesByUser,
  getCourseById,
  addChapter,
  addVideo,
  deleteChapter,
  deleteCourse,
  updateCourseStatus,
  updateChapterDescription,
  updateChapterTitle,
  updateCourseDescription,
  updateCourseTitle,
};
