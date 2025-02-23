const { ObjectId } = require("mongodb");
const connectDB = require("../utils/db");

const createLearningTrack = async (req, res) => {
  try {
    const { title, description, email } = req.body;
    // const userId = req.user.id; // Assuming user info is available from auth middleware

    if (!title) {
      return res.status(400).json({ error: "Track name is required" });
    }

    const db = await connectDB();
    const tracks = db.collection("learningTracks");

    const newTrack = {
      _id: new ObjectId(),
      title,
      description,
    //   userId: new ObjectId(userId), // Track owner
      owner: email, // Added field for creator email
      entries: [],
      createdAt: new Date(),
    };

    const result = await tracks.insertOne(newTrack);

    res
      .status(201)
      .json({
        message: "Track created successfully",
        trackId: result.insertedId,
      });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to create track", details: error.message });
  }
};


const addTrackEntry = async (req, res) => {
  try {
    const { trackId } = req.params;
    const { title, description } = req.body;
    const file = req.file?.filename; // Uploaded file via Multer

    if (!title || !file) {
      return res
        .status(400)
        .json({ error: "Title and file attachment are required" });
    }

    const db = await connectDB();
    const tracks = db.collection("learningTracks");

    const newEntry = {
      _id: new ObjectId(),
      title,
      description,
      filename: file,
      date: new Date(),
    };

    const result = await tracks.updateOne(
      { _id: new ObjectId(trackId) },
      { $push: { entries: newEntry } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Track not found" });
    }

    res.status(201).json({ message: "Entry added successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to add entry", details: error.message });
  }
};

// Get all learning tracks
const getAllTracks = async (req, res) => {
  try {
    const db = await connectDB();
    const tracks = db.collection("learningTracks");

    const allTracks = await tracks.find({}).toArray();
    res.status(200).json(allTracks);
  } catch (error) {
    console.error("Error fetching tracks:", error);
    res.status(500).json({ error: "Failed to fetch tracks", details: error.message });
  }
};

// Get a single learning track by ID
const getTrackById = async (req, res) => {
  try {
    const { trackId } = req.params;
    if (!trackId) {
      return res.status(400).json({ error: "Track ID is required" });
    }
    const db = await connectDB();
    const tracks = db.collection("learningTracks");

    const track = await tracks.findOne({ _id: new ObjectId(trackId) });
    if (!track) {
      return res.status(404).json({ error: "Track not found" });
    }
    res.status(200).json(track);
  } catch (error) {
    console.error("Error fetching track:", error);
    res.status(500).json({ error: "Failed to fetch track", details: error.message });
  }
};


module.exports = {
    createLearningTrack,
    addTrackEntry,
    getAllTracks,
    getTrackById,
};