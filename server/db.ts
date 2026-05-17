import mongoose from "mongoose";

let cachedConnectionPromise: Promise<typeof mongoose> | null = null;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (cachedConnectionPromise) {
    await cachedConnectionPromise;
    return;
  }

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  try {
    cachedConnectionPromise = mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,  // Fail fast on cold starts (was 10 s)
      connectTimeoutMS: 5000,
      maxPoolSize: 10,               // Appropriate for serverless
      bufferCommands: false,         // Don't silently queue ops when disconnected
    });
    await cachedConnectionPromise;
    console.log("Connected to MongoDB");
  } catch (err: any) {
    cachedConnectionPromise = null; // reset on error so future requests can try again
    console.error("MongoDB connection error:", err.message);
    throw err;
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
