const express = require("express");
const upload = require("../middleware/upload");
const {
  createLearningTrack,
  addTrackEntry,
  getAllTracks,
  getTrackById,
} = require("../controllers/track.controller");

const router = express.Router();

router.post("/", createLearningTrack);
router.post("/tracks/:trackId/entries", upload.single("file"), addTrackEntry);
router.get("/tracks", getAllTracks);
router.get("/tracks/:trackId", getTrackById);

module.exports = router;
