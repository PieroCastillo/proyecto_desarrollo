import { MongoClient } from "mongodb";
import { config } from "dotenv";

config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error("MONGO_URI is missing");
}

export const mongo = new MongoClient(MONGO_URI);

export const db = mongo.db("app");

export async function connectDB() {
  await mongo.connect();
  console.log("MongoDB connected");
}