import { MongoClient } from "mongodb";
import { config } from "dotenv";
import { hash } from "argon2";

config();

async function run() {
  const mongo = new MongoClient(process.env.MONGO_URI || "mongodb://localhost:27017");
  await mongo.connect();
  const db = mongo.db("app");

  const username = "maria_lopez";
  const passwordHash = await hash("1234");

  // Crear en tabla users
  const userResult = await db.collection("users").insertOne({
    username,
    passwordHash,
    role: "consultant"
  });

  const userId = userResult.insertedId;

  await db.collection("consultants").insertOne({
    _id: userId, // Usamos el mismo ID para mantener consistencia
    name: "Maria Lopez",
    dni: "88888888",
    phone: "999999999",
    zone: "Norte"
  });

  console.log(`¡Consultora creada exitosamente!
Usuario: ${username}
Contraseña: 1234
ID en Base de Datos: ${userId}`);

  await mongo.close();
}
run();
