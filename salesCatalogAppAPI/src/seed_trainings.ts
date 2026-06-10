import { db } from "./db";

async function seedTrainings() {
  try {
    console.log("Conectado a la base de datos de la aplicación...");

    const trainings = db.collection("trainings");

    await trainings.deleteMany({});

    const initialTrainings = [
      {
        title: "Estrategias de Venta Consultiva",
        description: "Aprende a vender sin vender. Técnicas para escuchar al cliente y ofrecer la solución exacta a sus problemas usando el catálogo.",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", 
        instructor: "Valeria Gómez (Directora Senior)",
        category: "Ventas",
        points: 50,
        createdAt: new Date()
      },
      {
        title: "MasterClass: Skincare y Tipos de Piel",
        description: "Domina el Sistema Experto. Aprende a diagnosticar la piel de tus clientes para recomendar cremas hidratantes y antiedad con seguridad.",
        videoUrl: "https://www.youtube.com/embed/jNQXAC9IVRw",
        instructor: "Dr. Roberto Solís",
        category: "Producto",
        points: 100,
        createdAt: new Date()
      },
      {
        title: "Gestión del Tiempo para Emprendedoras",
        description: "Maximiza tus ganancias organizando tus rutas de despacho y tiempos de visita a clientes usando Google Maps.",
        videoUrl: "https://www.youtube.com/embed/tgbNymZ7vqY",
        instructor: "RR.HH. Corporativo",
        category: "Desarrollo Personal",
        points: 30,
        createdAt: new Date()
      }
    ];

    await trainings.insertMany(initialTrainings as any);
    console.log("¡Capacitaciones insertadas exitosamente!");

  } catch (error) {
    console.error("Error al poblar BD:", error);
  } finally {
    process.exit(0);
  }
}

seedTrainings();
