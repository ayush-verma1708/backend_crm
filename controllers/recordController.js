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

// export const getRecords = async (req, res) => {
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 10;
//   const search = req.query.search || '';
//   const minPrice = parseFloat(req.query.minPrice);
//   const maxPrice = parseFloat(req.query.maxPrice);
//   const magazineName = req.query.magazine || '';

//   try {
//     const skip = (page - 1) * limit;

//     // Create a dynamic filter to apply search across all string fields
//     const filter = {
//       $or: Object.keys(Record.schema.paths)
//         .filter((key) => Record.schema.paths[key].instance === 'String') // Only include String fields
//         .map((key) => ({
//           [key]: { $regex: search, $options: 'i' },
//         })),
//       Full_Name: { $ne: 'undefined undefined' }, // Exclude records with Full_Name as 'undefined undefined'
//     };

//     // Add magazine filter if specified
//     if (magazineName) {
//       filter.Magazine = { $regex: magazineName, $options: 'i' }; // Assuming 'Magazine' is the field in your schema
//     }

//     // Add price range filtering
//     if (!isNaN(minPrice) && !isNaN(maxPrice)) {
//       filter.Amount = { $gte: minPrice, $lte: maxPrice };
//     } else if (!isNaN(minPrice)) {
//       filter.Amount = { $gte: minPrice };
//     } else if (!isNaN(maxPrice)) {
//       filter.Amount = { $lte: maxPrice };
//     }

//     // Fetch records with pagination and the constructed filter
//     const records = await Record.find(filter).skip(skip).limit(limit).lean();
//     const totalRecords = await Record.countDocuments(filter);

//     // Calculate the total sum of the Amount field
//     const totalAmount = await Record.aggregate([
//       { $match: filter }, // Apply the same filter
//       { $group: { _id: null, totalAmount: { $sum: '$Amount' } } },
//     ]);

//     // Extract the totalAmount value or default to 0 if no records match
//     const sumOfAmount = totalAmount.length > 0 ? totalAmount[0].totalAmount : 0;

//     // Calculate total sales (sum of amounts) for each magazine
//     const magazineSales = await Record.aggregate([
//       { $match: filter }, // Apply the same filter
//       {
//         $group: {
//           _id: '$Magazine', // Group by magazine name
//           totalSales: { $sum: '$Amount' }, // Sum up the amounts for each magazine
//         },
//       },
//       { $sort: { totalSales: -1 } }, // Optional: Sort magazines by sales in descending order
//     ]);

//     // Calculate magazine-wise count
//     const magazineCounts = await Record.aggregate([
//       { $match: filter }, // Apply the same filter
//       {
//         $group: {
//           _id: '$Magazine', // Group by magazine name
//           count: { $sum: 1 }, // Count the number of records for each magazine
//         },
//       },
//       { $sort: { count: -1 } }, // Optional: Sort by count in descending order
//     ]);

//     // Extract unique email addresses from records
//     const emailAddresses = records
//       .map((record) => record.Email)
//       .filter(Boolean); // Filter out any falsy values

//     const fullNames = records.map((record) => record.Full_Name).filter(Boolean); // Filter out any falsy values

//     // Fetch user information based on email addresses and full names
//     const users = await User.find({
//       $or: [
//         { Email_Address: { $in: emailAddresses } },
//         { Stage_Name: { $in: fullNames } },
//       ],
//     });

//     const userMap = {};
//     users.forEach((user) => {
//       if (user.Email_Address) userMap[user.Email_Address] = user; // Match by email
//       if (user.Stage_Name) userMap[user.Stage_Name] = user; // Match by stage name
//     });

//     // Combine records with user information
//     const enrichedRecords = records.map((record) => {
//       return {
//         ...record,
//         user_info: userMap[record.Email] || userMap[record.Full_Name] || null, // Match based on email
//       };
//     });

//     res.json({
//       totalRecords,
//       page,
//       totalPages: Math.ceil(totalRecords / limit),
//       totalAmount: sumOfAmount,
//       magazineSales, // Include sales per magazine
//       magazineCounts, // Include count per magazine
//       records: enrichedRecords,
//     });
//   } catch (err) {
//     res.status(500).json({ error: `Error retrieving records: ${err.message}` });
//   }
// };
import cache from 'memory-cache'; // Assuming memory-cache is already installed and configured

// export const getRecords = async (req, res) => {
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 200;
//   const search = req.query.search || '';
//   const minPrice = parseFloat(req.query.minPrice);
//   const maxPrice = parseFloat(req.query.maxPrice);
//   const magazineName = req.query.magazine || '';

//   try {
//     // Check if only Amount filtering is provided, to disable pagination
//     const isAmountFilterOnly =
//       (!search && !magazineName && isFinite(minPrice) && isFinite(maxPrice)) ||
//       (!search && !magazineName && isFinite(minPrice) && !isNaN(maxPrice)) ||
//       (!search && !magazineName && !isNaN(minPrice) && isNaN(maxPrice));

//     // Create a dynamic filter to apply search across all string fields
//     const filter = {
//       $or: Object.keys(Record.schema.paths)
//         .filter((key) => Record.schema.paths[key].instance === 'String') // Only include String fields
//         .map((key) => ({
//           [key]: { $regex: search, $options: 'i' },
//         })),
//       Full_Name: { $ne: 'undefined undefined' }, // Exclude records with Full_Name as 'undefined undefined'
//     };

//     // Add magazine filter if specified
//     if (magazineName) {
//       filter.Magazine = { $regex: magazineName, $options: 'i' };
//     }

//     // Add price range filtering
//     if (!isNaN(minPrice) && !isNaN(maxPrice)) {
//       filter.Amount = { $gte: minPrice, $lte: maxPrice };
//     } else if (!isNaN(minPrice)) {
//       filter.Amount = { $gte: minPrice };
//     } else if (!isNaN(maxPrice)) {
//       filter.Amount = { $lte: maxPrice };
//     }

//     // Create a cache key based on the query parameters and filter
//     const cacheKey = `getRecords_${JSON.stringify(req.query)}_${JSON.stringify(
//       filter
//     )}`;

//     // Check if the data is cached
//     const cachedData = cache.get(cacheKey);
//     if (cachedData) {
//       return res.json(cachedData); // Return cached data if it exists
//     }

//     // Fetch records with or without pagination based on the filters
//     let records = await Record.find(filter).lean(); // Fetch all records initially

//     // If only the Amount filter is applied, paginate the filtered records manually
//     let totalRecords = records.length; // Get the total count of filtered records
//     let totalPages = Math.ceil(totalRecords / limit); // Calculate total pages based on totalRecords

//     if (isAmountFilterOnly) {
//       // Paginate the filtered data manually (in-memory pagination)
//       const startIndex = (page - 1) * limit;
//       records = records.slice(startIndex, startIndex + limit);
//     } else {
//       // Apply MongoDB pagination as usual
//       const skip = (page - 1) * limit;
//       records = await Record.find(filter).skip(skip).limit(limit).lean();

//       totalRecords = await Record.countDocuments(filter); // Get the total count after MongoDB query
//       totalPages = Math.ceil(totalRecords / limit); // Recalculate total pages
//     }

//     // Calculate the total sum of the Amount field
//     const totalAmount = await Record.aggregate([
//       { $match: filter }, // Apply the same filter
//       { $group: { _id: null, totalAmount: { $sum: '$Amount' } } },
//     ]);

//     // Extract the totalAmount value or default to 0 if no records match
//     const sumOfAmount = totalAmount.length > 0 ? totalAmount[0].totalAmount : 0;

//     const responseData = {
//       totalRecords,
//       page: isAmountFilterOnly ? 1 : page,
//       totalPages,
//       totalAmount: sumOfAmount,
//       records,
//     };

//     // Cache the response data for 5 minutes (adjust as needed)
//     cache.put(cacheKey, responseData, 5 * 60 * 1000);

//     res.json(responseData);
//   } catch (err) {
//     res.status(500).json({ error: `Error retrieving records: ${err.message}` });
//   }
// };
export const getRecords = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 200;
  const search = req.query.search || '';
  const minPrice = parseFloat(req.query.minPrice);
  const maxPrice = parseFloat(req.query.maxPrice);
  const magazineName = req.query.magazine || '';

  try {
    // Check if only Amount filtering is provided, to disable pagination
    const isAmountFilterOnly =
      (!search && !magazineName && isFinite(minPrice) && isFinite(maxPrice)) ||
      (!search && !magazineName && isFinite(minPrice) && !isNaN(maxPrice)) ||
      (!search && !magazineName && !isNaN(minPrice) && isNaN(maxPrice));

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

    // Add price range filtering
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

    // If only the Amount filter is applied, disable pagination (set a large limit or no pagination)
    let records = [];

    if (isAmountFilterOnly) {
      // Fetch all records without pagination for Amount filtering
      records = await Record.find(filter).lean();
      const totalRecords = records.length; // Get the total count of filtered records
      const totalPages = 1; // Since all records are returned, totalPages is 1
      const sumOfAmount = records.reduce(
        (acc, record) => acc + record.Amount,
        0
      );

      const responseData = {
        totalRecords,
        page: 1,
        totalPages,
        totalAmount: sumOfAmount,
        records,
      };

      // Cache the response data for 5 minutes (adjust as needed)
      cache.put(cacheKey, responseData, 5 * 60 * 1000);

      return res.json(responseData);
    } else {
      // Apply MongoDB pagination as usual
      const skip = (page - 1) * limit;
      records = await Record.find(filter).skip(skip).limit(limit).lean();

      const totalRecords = await Record.countDocuments(filter); // Get the total count after MongoDB query
      const totalPages = Math.ceil(totalRecords / limit); // Recalculate total pages

      // Calculate the total sum of the Amount field
      const totalAmount = await Record.aggregate([
        { $match: filter }, // Apply the same filter
        { $group: { _id: null, totalAmount: { $sum: '$Amount' } } },
      ]);

      // Extract the totalAmount value or default to 0 if no records match
      const sumOfAmount =
        totalAmount.length > 0 ? totalAmount[0].totalAmount : 0;

      const responseData = {
        totalRecords,
        page: isAmountFilterOnly ? 1 : page,
        totalPages,
        totalAmount: sumOfAmount,
        records,
      };

      // Cache the response data for 5 minutes (adjust as needed)
      cache.put(cacheKey, responseData, 5 * 60 * 1000);

      return res.json(responseData);
    }
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

export const updateRecord = async (req, res) => {
  try {
    // Use req.body instead of req.query if sending JSON in the request body
    const updateFields = req.body;

    // Filter out fields with empty strings or undefined values
    const filteredUpdateFields = Object.keys(updateFields).reduce(
      (acc, key) => {
        if (updateFields[key] !== '' && updateFields[key] !== undefined) {
          acc[key] = updateFields[key];
        }
        return acc;
      },
      {}
    );

    if (Object.keys(filteredUpdateFields).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const updatedRecord = await Record.findByIdAndUpdate(
      req.query.id, // Assuming the ID is in req.body.id
      { $set: filteredUpdateFields },
      { new: true, runValidators: true, lean: true }
    );

    res.json(updatedRecord);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
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
