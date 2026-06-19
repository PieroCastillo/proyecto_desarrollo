import { MongoClient } from "mongodb";
import { config } from "dotenv";

config();

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.MONGO_DB || "app";

export const mongo = new MongoClient(MONGO_URI || "mongodb://127.0.0.1:27017", {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
});

export const db = mongo.db(DB_NAME);

let connectionPromise: Promise<MongoClient> | null = null;

export async function connectDB() {
  if (!MONGO_URI) {
    throw new Error("MONGO_URI is missing");
  }

  if (!connectionPromise) {
    connectionPromise = mongo.connect().catch((error) => {
      connectionPromise = null;
      throw error;
    });
  }

  return connectionPromise;
}
