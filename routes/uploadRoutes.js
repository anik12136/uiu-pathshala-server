const express = require('express');
const multer = require('multer');
const path = require('path');

module.exports = (db) => {
  const router = express.Router();

  // Configure Multer storage
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/'); // Save files in the uploads directory
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  });

  const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Only PDF files are allowed'), false);
      }
    },
  });

  // Upload PDF file and save record to MongoDB
  router.post('/', upload.single('file'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const email = req.body.email; // Extract email from request body
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const fileData = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      path: `/uploads/${req.file.filename}`,
      size: req.file.size,
      uploadDate: new Date(),
      createdBy: email, // Store the email of the uploader
    };

    try {
      if (!db || typeof db.collection !== 'function') {
        throw new Error('Database connection is not initialized');
      }

      const result = await db.collection('pdf').insertOne(fileData); // Store in 'pdf' collection
      res.json({
        message: 'PDF uploaded and saved to database',
        fileId: result.insertedId,
        file: fileData,
      });
    } catch (error) {
      console.error('Error saving PDF to database:', error);
      res.status(500).json({ message: 'Failed to save PDF to database' });
    }
  });

//   get my pdf
  router.get('/files', async (req, res) => {
    try {
        const email = req.query.email; // Get email from request query
        const query = email ? { createdBy: email } : {}; // Filter by email if provided

        const files = await db.collection('pdf').find(query).toArray();
        res.json(files);
    } catch (error) {
        console.error('Error retrieving PDFs:', error);
        res.status(500).json({ message: 'Failed to retrieve PDFs' });
    }
});

  return router;
};
