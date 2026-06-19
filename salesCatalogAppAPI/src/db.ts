import { MongoClient } from "mongodb";
import { config } from "dotenv";

config();

const MONGO_URI = process.env.MONGO_URI;
console.log(process.env.MONGO_URI)

if (!MONGO_URI) {
  throw new Error("MONGO_URI is missing");
}

const mongo = new MongoClient(MONGO_URI);
await mongo.connect();

export const db = mongo.db("app");