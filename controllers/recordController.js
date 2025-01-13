import Record from '../models/Record.js';
import User from '../models/userInfo.js';
import Joi from 'joi';

// Validation schema for records
const recordSchema = Joi.object({
  'First Name': Joi.string().required(),
  'Last Name': Joi.string().required(),
  Magazine: Joi.string().required(),
  Amount: Joi.number().required(),
  Email: Joi.string().email().required(),
  'Model Insta Link 1': Joi.string().uri().required(),
  LeadSource: Joi.string().optional(),
  Notes: Joi.string().optional(),
});

import cache from 'memory-cache'; // Assuming memory-cache is already installed and configured

export const getRecords = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 200;
  const search = req.query.search || '';
  const minPrice = parseFloat(req.query.minPrice);
  const maxPrice = parseFloat(req.query.maxPrice);
  const magazineName = req.query.magazine || '';

  try {
    // Create a dynamic filter to apply search across all string fields
    const filter = {
      $or: Object.keys(Record.schema.paths)
        .filter((key) => Record.schema.paths[key].instance === 'String') // Only include String fields
        .map((key) => ({
          [key]: { $regex: search, $options: 'i' },
        })),
      Full_Name: { $ne: 'undefined undefined' }, // Exclude records with Full_Name as 'undefined undefined'
    };

    // Add magazine filter if specified
    if (magazineName) {
      filter.Magazine = { $regex: magazineName, $options: 'i' };
    }

    // Add price range filtering (combined minPrice and maxPrice)
    if (!isNaN(minPrice) && !isNaN(maxPrice)) {
      filter.Amount = { $gte: minPrice, $lte: maxPrice };
    } else if (!isNaN(minPrice)) {
      filter.Amount = { $gte: minPrice };
    } else if (!isNaN(maxPrice)) {
      filter.Amount = { $lte: maxPrice };
    }

    // Create a cache key based on the query parameters and filter
    const cacheKey = `getRecords_${JSON.stringify(req.query)}_${JSON.stringify(
      filter
    )}`;

    // Check if the data is cached
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData); // Return cached data if it exists
    }

    // Apply MongoDB pagination with filtering
    const skip = (page - 1) * limit;

    // Fetch records with applied filter and pagination
    const records = await Record.find(filter).skip(skip).limit(limit).lean();

    // Calculate the total number of records with the same filter (no pagination)
    const totalRecords = await Record.countDocuments(filter); // Ensure totalRecords reflects the filter
    const totalPages = Math.ceil(totalRecords / limit); // Recalculate total pages

    // Calculate the total sum of the Amount field
    const totalAmount = await Record.aggregate([
      { $match: filter }, // Apply the same filter
      { $group: { _id: null, totalAmount: { $sum: '$Amount' } } },
    ]);

    // Extract the totalAmount value or default to 0 if no records match
    const sumOfAmount = totalAmount.length > 0 ? totalAmount[0].totalAmount : 0;

    const responseData = {
      totalRecords,
      page,
      totalPages,
      totalAmount: sumOfAmount,
      records,
    };

    // Cache the response data for 5 minutes (adjust as needed)
    cache.put(cacheKey, responseData, 5 * 60 * 1000);

    return res.json(responseData);
  } catch (err) {
    res.status(500).json({ error: `Error retrieving records: ${err.message}` });
  }
};

export const createRecord = async (req, res) => {
  const { error } = recordSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const record = new Record(req.body);
    const savedRecord = await record.save();
    res.status(201).json(savedRecord);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getRecordById = async (req, res) => {
  try {
    // Fetch the record by ID
    const record = await Record.findById(req.params.id).lean();

    // Check if the record exists
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    // Fetch all records with the same email address from the Record collection
    const sameEmailRecords = await Record.find({ Email: record.Email }).lean();

    // Fetch user details from the User collection where the email matches
    const userDetails = await User.findOne({
      Email_Address: record.Email,
    }).lean();

    // Return the record, same email records, and user details
    res.json({ record, sameEmailRecords, userDetails });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// export const updateRecord = async (req, res) => {
//   const data = req.body;
//   console.log('new updates to the data', data);
//   const record = await Record.findById(req.params.id).lean();
//   // Fetch all records with the same email address from the Record collection
//   console.log('To update in primary record', record);

//   const sameEmailRecords = await Record.find({ Email: record.Email }).lean();
//   console.log('update in all the records for same user', sameEmailRecords);

//   // Fetch user details from the User collection where the email matches
//   const userDetails = await User.findOne({
//     Email_Address: record.Email,
//   }).lean();
//   console.log('user details to update', userDetails);
// };

export const updateRecord = async (req, res) => {
  try {
    const data = req.body;

    // Validate if data is JSON format
    if (typeof data !== 'object' || data === null) {
      return res.status(400).json({ message: 'Invalid JSON payload' });
    }

    console.log('New updates to the data:', data);

    // Update the primary record by ID
    const updatedRecord = await Record.findByIdAndUpdate(req.params.id, data, {
      new: true,
    }).lean();
    if (!updatedRecord) {
      return res.status(404).json({ message: 'Record not found' });
    }

    console.log('Updated primary record:', updatedRecord);

    // Fetch all records with the same email address
    const sameEmailRecords = await Record.find({
      Email: updatedRecord.Email,
    }).lean();
    console.log('Records to update for the same user:', sameEmailRecords);

    // Update all records with the same email address
    await Promise.all(
      sameEmailRecords.map((record) => {
        return Record.findByIdAndUpdate(record._id, data, { new: true });
      })
    );

    // Fetch user details with the matching email
    const userDetails = await User.findOne({
      Email_Address: updatedRecord.Email,
    }).lean();
    console.log('User details before update:', userDetails);

    // Update user details if necessary
    if (userDetails) {
      const updatedUserDetails = {
        Model_Type: data.Model_Type || userDetails.Model_Type,
        Stage_Name: data.Stage_Name || userDetails.Stage_Name,
        Model_Insta_Link: data.Model_Insta_Link || userDetails.Model_Insta_Link,
        Email_Address: data.Email || userDetails.Email_Address,
      };

      await User.findByIdAndUpdate(userDetails._id, updatedUserDetails, {
        new: true,
      });
      console.log('User details updated:', updatedUserDetails);
    }

    res
      .status(200)
      .json({ message: 'Records and user details updated successfully' });
  } catch (error) {
    console.error('Error updating records:', error);
    res.status(500).json({ message: 'Error updating records', error });
  }
};

export const updateRecordNotes = async (req, res) => {
  const { note, noteDate } = req.body; // Extracting note and noteDate from the request body

  try {
    const record = await Record.findById(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });

    record.Notes = note; // Update the notes
    record.NoteDate = noteDate; // Assuming NoteDate field exists in your schema

    await record.save();
    res.status(200).json({ message: 'Note updated successfully', record });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a record
export const deleteRecord = async (req, res) => {
  try {
    const deletedRecord = await Record.findByIdAndDelete(req.params.id).lean();
    if (!deletedRecord)
      return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
