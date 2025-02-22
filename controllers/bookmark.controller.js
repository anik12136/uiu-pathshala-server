const { ObjectId } = require('mongodb');
const connectDB = require("../utils/db");



const createBookMark = async (req, res) => {
    try {
        const db = await connectDB();
        const BookMarkCollection = db.collection("BookMark");

        const { createBy, courseId, contestId, courseName, type } = req.body;
        const createdAt = new Date();

        const formattedCourseId = type === "course" && courseId ? new ObjectId(courseId) : null;
        const formattedContestId = type === "contest" && contestId ? new ObjectId(contestId) : null;

        // Keep courseName as a string (No ObjectId conversion)
        const formattedCourseName = type === "books" && courseName ? courseName : null;

        // Check if the bookmark already exists
        const existingBookmark = await BookMarkCollection.findOne({
            createBy,
            type,
            courseId: formattedCourseId,
            contestId: formattedContestId,
            courseName: formattedCourseName
        });

        if (existingBookmark) {
            return res.status(409).json({ message: "Bookmark already added for this" });
        }

        const bookmark = {
            createBy,
            type,
            createdAt,
            courseId: formattedCourseId,
            contestId: formattedContestId,
            courseName: formattedCourseName
        };

        const result = await BookMarkCollection.insertOne(bookmark);
        res.status(200).json({ message: "Bookmark added successfully", result });
    } catch (error) {
        res.status(500).json({ message: "Error creating bookmark", error });
    }
};





const getAllBookMarkForThatUser = async (req, res) => {
    try {
        const db = await connectDB();
        const BookMarkCollection = db.collection("BookMark");

        const bookmarks = await BookMarkCollection.aggregate([
            // Step 1: Match bookmarks for the specific user
            {
                $match: { createBy: req.params.UserMail },
            },
            // Step 2: Lookup the associated course details
            {
                $lookup: {
                    from: "courses", // The collection to join with
                    localField: "courseId", // Field in the bookmark collection
                    foreignField: "_id", // Field in the courses collection
                    as: "CourseDetails", // The resulting field name for joined data
                },
            },
            // Step 3: Unwind the course details (flatten the array)
            {
                $unwind: {
                    path: "$CourseDetails",
                    preserveNullAndEmptyArrays: true, // Allow null if no matching course found
                },
            },
            // Step 4: Lookup the associated contest details if applicable
            {
                $lookup: {
                    from: "ProgrammingContest", // The contest collection
                    localField: "contestId", // Field in the bookmark collection
                    foreignField: "_id", // Field in the contest collection
                    as: "ContestDetails", // The resulting field name for contest data
                },
            },
            // Step 5: Unwind the contest details (flatten the array)
            {
                $unwind: {
                    path: "$ContestDetails",
                    preserveNullAndEmptyArrays: true, // Allow null if no matching contest found
                },
            },
        
            
        ]).toArray();

        // Respond with the fetched bookmarks data
        res.status(200).json(bookmarks);
    } catch (error) {
        console.error("Error fetching bookmarks:", error);
        res.status(500).json({ message: "Error fetching bookmarks", error });
    }
};





const deleteSingleBookMark = async (req, res) => {
    try {
        const db = await connectDB();
        const BookMarkCollection = db.collection("BookMark");

        const { id } = req.params;
        const result = await BookMarkCollection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 1) {
            res.status(200).json({ message: "Bookmark deleted successfully" });
        } else {
            res.status(404).json({ message: "Bookmark not found" });
        }
    } catch (error) {
        res.status(500).json({ message: "Error deleting bookmark", error });
    }
};

module.exports = {
    createBookMark,
    getAllBookMarkForThatUser,
    deleteSingleBookMark,
    
};
