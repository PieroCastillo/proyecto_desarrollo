import { MongoClient } from "mongodb";
import { config } from "dotenv";

config();

async function run() {
  const mongo = new MongoClient(process.env.MONGO_URI || "mongodb://localhost:27017");
  await mongo.connect();
  const db = mongo.db("app");

  const orders = await db.collection('orders').aggregate([
    { $group: { _id: "$consultantId", totalSales: { $sum: "$total" } } }
  ]).toArray();

  console.log("=== VENTAS POR CONSULTORA ===");
  if (orders.length === 0) {
    console.log("No hay pedidos registrados en la base de datos.");
  }
  for (const o of orders) {
    if (o._id) {
       const user = await db.collection('users').findOne({ _id: o._id });
       console.log(`Usuario: ${user?.username || 'Desconocido'} (ID: ${o._id}) | Total: S/ ${o.totalSales}`);
    }
  }
  
  await mongo.close();
}
run();
