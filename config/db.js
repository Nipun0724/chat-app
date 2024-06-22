import mongoose from "mongoose";
const uri =
  "mongodb+srv://nipunsnair2004:X41romc$4F@chat-app-cluster.yx2qsxy.mongodb.net/?retryWrites=true&w=majority&appName=Chat-app-cluster";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(uri, {});
    console.log(`MogoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
};
