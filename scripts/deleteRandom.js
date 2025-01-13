import mongoose from 'mongoose';
import User from '../models/userInfo.js'; // Adjust path based on your file structure
import Record from '../models/Record.js'; // Adjust path based on your file structure

// const deleteDocumentsByOrderId = async (orderId) => {
//   try {
//     // Delete from User model
//     const deletedUsers = await User.deleteMany({ Order_id: orderId });
//     console.log('Deleted users:', deletedUsers);

//     // Delete from Record model
//     const deletedRecords = await Record.deleteMany({ Order_id: orderId });
//     console.log('Deleted records:', deletedRecords);
//   } catch (error) {
//     console.error('Error deleting documents:', error);
//   }
// };

// Call the function with the specific Order_id
const deleteDocumentsByOrderId = async (orderId) => {
  try {
    // Delete from User model
    const deletedUsers = await User.deleteMany({ Order_id: orderId });
    console.log('Deleted users:', deletedUsers);

    // Delete from Record model
    const deletedRecords = await Record.deleteMany({ Order_id: orderId });
    console.log('Deleted records:', deletedRecords);
  } catch (error) {
    console.error('Error deleting documents:', error);
  }
};

deleteDocumentsByOrderId('10017');
