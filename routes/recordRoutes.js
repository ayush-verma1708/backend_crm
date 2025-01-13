import express from 'express';
import {
  getRecords,
  createRecord,
  getRecordById,
  updateRecord,
  updateRecordNotes,
  deleteRecord,
} from '../controllers/recordController.js';

const router = express.Router();

// Fetch all records with optional pagination and filtering
router.get('/', getRecords);

// Create a new record
router.post('/', createRecord);

// Fetch a single record by ID
router.get('/:id', getRecordById);

// Update an existing record by ID
router.patch('/:id', updateRecord);

// Update only the notes of a record by ID
router.patch('/:id/notes', updateRecordNotes);

// Delete a record by ID
router.delete('/:id', deleteRecord);

export default router;
