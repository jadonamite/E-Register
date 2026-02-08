// reset-db.ts
import mongoose from "mongoose";
import * as dotenv from "dotenv";

// Load environment variables from .env
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ Error: MONGODB_URI is missing from .env file");
  process.exit(1);
}

async function wipeDatabase() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI as string);
    console.log("✅ Connected.");

    // Delete all documents in the 'members' collection
    console.log("🗑️  Deleting all members...");
    const collection = mongoose.connection.collection("members");
    const result = await collection.deleteMany({});
    
    console.log(`✨ Success! Deleted ${result.deletedCount} members.`);
    console.log("🚀 You can now add new members with phone numbers.");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

wipeDatabase();