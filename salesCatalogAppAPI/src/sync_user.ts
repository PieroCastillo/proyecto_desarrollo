import { MongoClient } from "mongodb";
import { config } from "dotenv";

config();

async function run() {
  const mongo = new MongoClient(process.env.MONGO_URI || "mongodb://localhost:27017");
  await mongo.connect();
  const db = mongo.db("app");

  const user = await db.collection("users").findOne({ username: "pumayauli" });

  if (user) {
    const exists = await db.collection("consultants").findOne({ _id: user._id });
    if (!exists) {
      await db.collection("consultants").insertOne({
        _id: user._id,
        name: "Bryan Pumayauli",
        dni: "12345678",
        phone: "999999999",
        zone: "Este"
      });
      console.log("Sincronizado: Pumayauli ahora también aparece para RR.HH.");
    } else {
      console.log("Ya estaba sincronizado.");
    }
  } else {
    console.log("No se encontró el usuario 'pumayauli' en la base de datos.");
  }
  await mongo.close();
}
run();
