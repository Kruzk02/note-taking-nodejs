import mongoose from 'mongoose';

const dbUri = process.env.MONGO_URI;

export async function connectDb() {
  
  if (!dbUri) {
    console.error("Database URI is not defined. Please set the MONGO_URI enviroment variable");
    return;
  }

  try {
    await mongoose.connect(dbUri); 
    console.log("Successfully connect to database");
  } catch(err) {
    console.error("Error connect to database: ", err);
  }
}
