// backend/routes/uploadRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Upload route
router.post('/', upload.single('file'), (req, res) => {
  if (req.file) {
    res.json({ message: 'File uploaded successfully', filePath: `/uploads/${req.file.filename}` });
  } else {
    res.status(400).json({ message: 'File upload failed' });
  }
});

module.exports = router;
