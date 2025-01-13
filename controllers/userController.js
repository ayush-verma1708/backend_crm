// controllers/userController.js
import User from '../models/userInfo.js'; // Adjust the path according to your project structure

// Fetch user by email
export const getUserByEmail = async (req, res) => {
  const { email } = req.query; // Get email from query parameters

  if (!email) {
    return res.status(400).json({ error: 'Email address is required' });
  }

  try {
    // Query for user by email, checking both Email_Address and Email_Address_2 fields
    const user = await User.findOne({
      $or: [{ Email_Address: email }, { Email_Address_2: email }],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Optionally, you can omit sensitive information like passwords here
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// export const getUsers = async (req, res) => {
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 10;
//   const search = req.query.search || '';

//   try {
//     const skip = (page - 1) * limit;

//     // Dynamic filter for search
//     const matchFilter = {
//       $or: [
//         { Model_Type: { $regex: search, $options: 'i' } },
//         { Stage_Name: { $regex: search, $options: 'i' } },
//         { Model_Insta_Link: { $regex: search, $options: 'i' } },
//         { Email_Address: { $regex: search, $options: 'i' } },
//         { Photographer_Insta_Link: { $regex: search, $options: 'i' } },
//         { Mua_Stage_Name: { $regex: search, $options: 'i' } },
//         { Mua_Insta_link: { $regex: search, $options: 'i' } },
//         { Phone_Number_2: { $regex: search, $options: 'i' } },
//         { Country: { $regex: search, $options: 'i' } },
//         { Magazine_Viewer: { $regex: search, $options: 'i' } },
//       ],
//     };

//     // Aggregate query to fetch unique Email_Address records
//     const aggregatePipeline = [
//       { $match: matchFilter }, // Apply the search filter
//       {
//         $group: {
//           _id: '$Email_Address', // Group by Email_Address
//           doc: { $first: '$$ROOT' }, // Retrieve the first document in each group
//         },
//       },
//       { $replaceRoot: { newRoot: '$doc' } }, // Replace the root with the grouped document
//       { $skip: skip }, // Pagination: skip the records for the current page
//       { $limit: limit }, // Pagination: limit the number of records
//     ];

//     // Fetch the unique users
//     const users = await User.aggregate(aggregatePipeline);

//     // Count total unique users
//     const totalUsers = await User.aggregate([
//       { $match: matchFilter },
//       { $group: { _id: { magazine: '$Magazine_Viewer', email: '$Email_Address' } } },
//       { $count: 'total' },
//     ]);

//     const totalRecords = totalUsers[0]?.total || 0;

//     // Group records by magazines and then group by email
//     const magazineCounts = await User.aggregate([
//       { $match: matchFilter }, // Apply the search filter
//       {
//         $group: {
//           _id: { magazine: '$Magazine_Viewer', email: '$Email_Address' },
//           count: { $sum: 1 }, // Count the number of records for each email per magazine
//         },
//       },
//       {
//         $group: {
//           _id: '$_id.magazine',
//           emailCounts: {
//             $push: { email: '$_id.email', count: '$count' },
//           },
//         },
//       },
//     ]);

//     res.json({
//       totalRecords,
//       page,
//       totalPages: Math.ceil(totalRecords / limit),
//       users,
//       magazineCounts,
//     });
//   } catch (err) {
//     res.status(500).json({ error: `Error retrieving users: ${err.message}` });
//   }
// };

export const getUsers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';
  const magazines = req.query.magazine ? req.query.magazine.split(',') : [];

  try {
    const skip = (page - 1) * limit;

    // Dynamic filter for search and magazine
    const matchFilter = {
      $and: [
        { $or: [
          { Model_Type: { $regex: search, $options: 'i' } },
          { Stage_Name: { $regex: search, $options: 'i' } },
          { Model_Insta_Link: { $regex: search, $options: 'i' } },
          { Email_Address: { $regex: search, $options: 'i' } },
          { Photographer_Insta_Link: { $regex: search, $options: 'i' } },
          { Mua_Stage_Name: { $regex: search, $options: 'i' } },
          { Mua_Insta_link: { $regex: search, $options: 'i' } },
          { Phone_Number_2: { $regex: search, $options: 'i' } },
          { Country: { $regex: search, $options: 'i' } },
          { Magazine_Viewer: { $regex: search, $options: 'i' } },
        ] },
        ...(magazines.length > 0 ? [{ Magazine_Viewer: { $in: magazines } }] : []),
      ],
    };

    // Aggregate query to fetch unique Email_Address records
    const aggregatePipeline = [
      { $match: matchFilter }, // Apply the search and magazine filter
      {
        $group: {
          _id: '$Email_Address', // Group by Email_Address
          doc: { $first: '$$ROOT' }, // Retrieve the first document in each group
        },
      },
      { $replaceRoot: { newRoot: '$doc' } }, // Replace the root with the grouped document
      { $skip: skip }, // Pagination: skip the records for the current page
      { $limit: limit }, // Pagination: limit the number of records
    ];

    // Fetch the unique users
    const users = await User.aggregate(aggregatePipeline);

    // Count total unique users
    const totalUsers = await User.aggregate([
      { $match: matchFilter },
      { $group: { _id: { magazine: '$Magazine_Viewer', email: '$Email_Address' } } },
      { $count: 'total' },
    ]);

    const totalRecords = totalUsers[0]?.total || 0;

    // Group records by magazines and then group by email
    const magazineCounts = await User.aggregate([
      { $match: matchFilter }, // Apply the search filter
      {
        $group: {
          _id: { magazine: '$Magazine_Viewer', email: '$Email_Address' },
          count: { $sum: 1 }, // Count the number of records for each email per magazine
        },
      },
      {
        $group: {
          _id: '$_id.magazine',
          emailCounts: {
            $push: { email: '$_id.email', count: '$count' },
          },
        },
      },
    ]);

    res.json({
      totalRecords,
      page,
      totalPages: Math.ceil(totalRecords / limit),
      users,
      magazineCounts,
    });
  } catch (err) {
    res.status(500).json({ error: `Error retrieving users: ${err.message}` });
  }
};

// Update user details
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;
    const updatedUser = await User.findByIdAndUpdate(id, updatedData, {
      new: true,
    });
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error });
  }
};