import mongoose from "mongoose";

let isConnected = false;

export async function connectDB() {
  if (isConnected) return;
  
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,  // Fail fast on cold starts (was 10 s)
      connectTimeoutMS: 5000,
      maxPoolSize: 10,               // Appropriate for serverless
      bufferCommands: false,         // Don't silently queue ops when disconnected
    });
    console.log("Connected to MongoDB");
    isConnected = true;
  } catch (err: any) {
    console.error("MongoDB connection error:", err.message);
  }
}

const projectSchema = new mongoose.Schema({
  titleEn: { type: String, required: true },
  titleAr: { type: String, required: true },
  titleHe: { type: String, required: true },
  descEn: { type: String, required: true },
  descAr: { type: String, required: true },
  descHe: { type: String, required: true },
  category: { type: String, required: true },
  imageUrl: { type: String, required: true },
  sortOrder: { type: Number, required: true, default: 0 },
});

export const ProjectModel = mongoose.model("Project", projectSchema);
