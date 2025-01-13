import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    Model_Type: { type: String },
    Stage_Name: { type: String },
    Model_Insta_Link: { type: String },
    Email_Address: { type: String },
    Magazine_Viewer: { type: String },
    Photographer_Insta_Link: { type: String },
    Mua_Stage_Name: { type: String },
    Mua_Insta_link: { type: String },
    Phone_Number_2: { type: String },
    Email_Address_2: { type: String },
    Country: { type: String },
    Date_Of_Birth: { type: Date },
    Notes: { type: String },
    Follow_Up_Date: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
