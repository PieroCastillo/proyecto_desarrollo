import { MongoClient, ObjectId } from "mongodb";
import { config } from "dotenv";

config();

const uri = process.env.MONGO_URI;
if (!uri) throw new Error("Falta MONGO_URI");

const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db("app");

    console.log("Limpiando capacitaciones y órdenes antiguas...");
    await db.collection("trainings").deleteMany({});
    await db.collection("orders").deleteMany({});
    await db.collection("training_participations").deleteMany({});

    console.log("Generando 3 Capacitaciones...");
    await db.collection("trainings").insertMany([
      { title: "Técnicas de Cierre de Ventas", description: "Aprende a cerrar ventas en 5 minutos.", videoUrl: "https://youtube.com/...", instructor: "Juan Perez", category: "Ventas", points: 20, createdAt: new Date() },
      { title: "Cuidado Facial Nivel 1", description: "Conoce los beneficios del Ácido Hialurónico.", videoUrl: "https://youtube.com/...", instructor: "Dermatología", category: "Producto", points: 15, createdAt: new Date() },
      { title: "Liderazgo y Equipos", description: "Cómo manejar un grupo de consultoras.", videoUrl: "https://youtube.com/...", instructor: "Directora General", category: "Liderazgo", points: 30, createdAt: new Date() }
    ]);

    // Buscar consultoras para asignarles ventas
    const consultoras = await db.collection("consultants").find().toArray();
    
    if (consultoras.length >= 2) {
      console.log("Generando ventas (órdenes) para las consultoras...");
      await db.collection("orders").insertMany([
        { consultantId: consultoras[0]._id, status: "pending", total: 450.50, createdAt: new Date() },
        { consultantId: consultoras[0]._id, status: "completed", total: 320.00, createdAt: new Date() },
        { consultantId: consultoras[1]._id, status: "completed", total: 890.00, createdAt: new Date() },
        { consultantId: consultoras[1]._id, status: "pending", total: 150.00, createdAt: new Date() }
      ]);
    }

    console.log("✅ ¡Datos inyectados con éxito! Revisa tus Capacitaciones y tu Dashboard.");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

run();
