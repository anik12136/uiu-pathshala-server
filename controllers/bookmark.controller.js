const { ObjectId } = require('mongodb');
const connectDB = require("../utils/db");



const createBookMark = async (req, res) => {
    try {
        const db = await connectDB();
        const BookMarkCollection = db.collection("BookMark");

        const { createBy, courseId, contestId, type } = req.body;
        const createdAt = new Date();

        
        const formattedCourseId = type === "course" && courseId ? new ObjectId(courseId) : null;
        const formattedContestId = type === "contest" && contestId ? new ObjectId(contestId) : null;

        // Check if the bookmark already exists
        const existingBookmark = await BookMarkCollection.findOne({ createBy, type, courseId: formattedCourseId, contestId: formattedContestId });
        if (existingBookmark) {
            return res.status(409).json({ message: "Bookmark already added for this" });
        }

        const bookmark = {
            createBy,
            type,
            createdAt,
            courseId: formattedCourseId,
            contestId: formattedContestId
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
            {
                $match: { createBy: req.params.UserMail }
            },
            {
                $lookup: {
                    from: "courses",
                    localField: "courseId",
                    foreignField: "_id",
                    as: "CourseDetails",
                },
            },
            {
                $unwind: {
                    path: "$CourseDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "ProgrammingContest",
                    localField: "contestId",
                    foreignField: "_id",
                    as: "ContestDetails",
                },
            },
            {
                $unwind: {
                    path: "$ContestDetails",
                    preserveNullAndEmptyArrays: true
                }
            }
        ]).toArray();

        res.status(200).json(bookmarks);
    } catch (error) {
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
