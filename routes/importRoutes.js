// routes/importRoutes.js
import express from 'express';
import multer from 'multer';
import { importRecords } from '../controllers/importController.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' }); // 'uploads/' is where files will be temporarily stored

// Define the route for importing records
router.post('/import', upload.single('file'), importRecords);

export default router;
