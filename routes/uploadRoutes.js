// const express = require('express');
// const multer = require('multer');
// const path = require('path');

// module.exports = (db) => {
//   const router = express.Router();

//   // Configure Multer storage
//   const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, 'uploads/'); // Save files in the uploads directory
//     },
//     filename: (req, file, cb) => {
//       cb(null, `${Date.now()}-${file.originalname}`);
//     },
//   });

//   const upload = multer({
//     storage,
//     fileFilter: (req, file, cb) => {
//       if (file.mimetype === 'application/pdf') {
//         cb(null, true);
//       } else {
//         cb(new Error('Only PDF files are allowed'), false);
//       }
//     },
//   });

//   // Upload PDF file and save record to MongoDB
//   router.post('/', upload.single('file'), async (req, res) => {
//     if (!req.file) {
//       return res.status(400).json({ message: 'No file uploaded' });
//     }

//     const email = req.body.email; // Extract email from request body
//     if (!email) {
//       return res.status(400).json({ message: 'Email is required' });
//     }

//     const fileData = {
//       filename: req.file.filename,
//       originalname: req.file.originalname,
//       path: `/uploads/${req.file.filename}`,
//       size: req.file.size,
//       uploadDate: new Date(),
//       createdBy: email, // Store the email of the uploader
//     };

//     try {
//       if (!db || typeof db.collection !== 'function') {
//         throw new Error('Database connection is not initialized');
//       }

//       const result = await db.collection('pdf').insertOne(fileData); // Store in 'pdf' collection
//       res.json({
//         message: 'PDF uploaded and saved to database',
//         fileId: result.insertedId,
//         file: fileData,
//       });
//     } catch (error) {
//       console.error('Error saving PDF to database:', error);
//       res.status(500).json({ message: 'Failed to save PDF to database' });
//     }
//   });

// //   get my pdf
//   router.get('/files', async (req, res) => {
//     try {
//         const email = req.query.email; // Get email from request query
//         const query = email ? { createdBy: email } : {}; // Filter by email if provided

//         const files = await db.collection('pdf').find(query).toArray();
//         res.json(files);
//     } catch (error) {
//         console.error('Error retrieving PDFs:', error);
//         res.status(500).json({ message: 'Failed to retrieve PDFs' });
//     }
// });

//   return router;
// };


const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');
const path = require('path');
require('dotenv').config();
const cors = require('cors');
const router = express.Router();

router.use(cors({ origin: 'http://localhost:5173' })); // Allow frontend URL

const upload = multer({ storage: multer.memoryStorage() });
router.post('/', upload.single('file'), async (req, res) => {
  res.json({ message: 'File uploaded successfully' });
});


module.exports = (db) => {
  const router = express.Router();

  // Configure Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  // Multer storage in memory
  const storage = multer.memoryStorage();
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

  // Upload PDF file to Cloudinary and save record to MongoDB
  router.post('/', upload.single('file'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const pdf = req.body.pdf;
    const email = req.body.email;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    try {
      // Upload file to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { resource_type: 'raw', folder: 'pdf_uploads' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        Readable.from(req.file.buffer).pipe(uploadStream);
      });

      const fileData = {
        filename: req.file.originalname,
        size: req.file.size,
        uploadDate: new Date(),
        createdBy: email,
        pdfType: pdf,
        cloudinaryUrl: uploadResult.secure_url,
        cloudinaryPublicId: uploadResult.public_id,
      };

      const result = await db.collection('pdf').insertOne(fileData);
      res.json({
        message: 'PDF uploaded to Cloudinary and saved to database',
        fileId: result.insertedId,
        file: fileData,
      });
    } catch (error) {
      console.error('Error uploading PDF:', error);
      res.status(500).json({ message: 'Failed to upload PDF' });
    }
  });

  // Get user PDFs
  router.get('/files', async (req, res) => {
    try {
      const email = req.query.email;
      const pdf = "pdf";
      const query = email ? { createdBy: email, pdfType: pdf } : {};
      const files = await db.collection('pdf').find(query).toArray();
      res.json(files);
    } catch (error) {
      console.error('Error retrieving PDFs:', error);
      res.status(500).json({ message: 'Failed to retrieve PDFs' });
    }
  });
  // Get user books
  router.get('/books', async (req, res) => {
    try {
      const email = req.query.email;
      const pdf = "bookPdf";
      const query = email ? { createdBy: email, pdfType: pdf } : {};
      const files = await db.collection('pdf').find(query).toArray();
      res.json(files);
    } catch (error) {
      console.error('Error retrieving PDFs:', error);
      res.status(500).json({ message: 'Failed to retrieve PDFs' });
    }
  });

  // Get user Notes
  router.get('/notes', async (req, res) => {
    try {
      const email = req.query.email;
      const pdf = "notePdf";
      const query = email ? { createdBy: email, pdfType: pdf } : {};
      const files = await db.collection('pdf').find(query).toArray();
      res.json(files);
    } catch (error) {
      console.error('Error retrieving PDFs:', error);
      res.status(500).json({ message: 'Failed to retrieve PDFs' });
    }
  });
  // Get user Questions
  router.get('/questions', async (req, res) => {
    try {
      const email = req.query.email;
      const pdf = "questionPdf";
      const query = email ? { createdBy: email, pdfType: pdf } : {};
      const files = await db.collection('pdf').find(query).toArray();
      res.json(files);
    } catch (error) {
      console.error('Error retrieving PDFs:', error);
      res.status(500).json({ message: 'Failed to retrieve PDFs' });
    }
  });

  //get all pdf ,books,notes ,questions for explore

  router.get('/explore', async (req, res) => {
    try {
      const files = await db.collection('pdf').find().toArray();
      res.json(files);
    } catch (error) {
      console.error('Error retrieving files:', error);
      res.status(500).json({ message: 'Failed to retrieve files' });
    }
  });

  const { ObjectId } = require('mongodb'); // Import ObjectId for MongoDB

  // Delete a PDF/book/note/question by ID====================
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }

      // Find the file in the database
      const file = await db.collection('pdf').findOne({ _id: new ObjectId(id) });

      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }

      // Delete from Cloudinary (if applicable)
      if (file.cloudinaryPublicId) {
        try {
          await cloudinary.uploader.destroy(file.cloudinaryPublicId, { resource_type: 'raw' });
        } catch (cloudinaryError) {
          console.error('Error deleting from Cloudinary:', cloudinaryError);
        }
      }

      // Delete from MongoDB
      await db.collection('pdf').deleteOne({ _id: new ObjectId(id) });

      res.json({ message: 'File deleted successfully' });
    } catch (error) {
      console.error('Error deleting file:', error);
      res.status(500).json({ message: 'Failed to delete file' });
    }
  });



  return router;
};
