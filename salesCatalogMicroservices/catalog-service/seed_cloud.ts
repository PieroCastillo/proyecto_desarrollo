import { MongoClient } from "mongodb";
import { config } from "dotenv";

// Cargamos las variables de entorno (.env)
config();

const uri = process.env.MONGO_URI;

if (!uri) {
  throw new Error("Falta MONGO_URI en el archivo .env");
}

const client = new MongoClient(uri);

async function run() {
  try {
    console.log("Conectando a MongoDB Atlas en la nube...");
    await client.connect();
    const db = client.db("app");
    console.log("✓ Conexión establecida.");

    // Los 29 productos originales + 10 nuevos = 39 productos en total
    const fullCatalog = [
      // Tratamiento Facial
      { name: "Kit Facial Pro", category: "Tratamiento Facial", price: 89.90, stock: 15, imagen: "/images/products/kit_facial_pro.png" },
      { name: "Crema Regeneradora Noche", category: "Tratamiento Facial", price: 120.00, stock: 12, imagen: "/images/products/crema_regeneradora.png" },
      { name: "Sérum Ácido Hialurónico", category: "Tratamiento Facial", price: 95.00, stock: 18, imagen: "/images/products/kit_facial_pro.png" },
      { name: "Gel Limpiador Hidratante", category: "Tratamiento Facial", price: 45.00, stock: 25, imagen: "/images/products/gel_limpiador_hidratante.png" },
      { name: "Loción Tónica Calmante Aloe", category: "Tratamiento Facial", price: 39.90, stock: 20, imagen: "/images/products/locion_tonica_calmante_aloe.png" },
      { name: "Crema Piel Sensible y Reactiva", category: "Tratamiento Facial", price: 52.00, stock: 15, imagen: "/images/products/crema_piel_sensible.png" },
      { name: "Mascarilla Arcilla Purificante", category: "Tratamiento Facial", price: 35.00, stock: 22, imagen: "/images/products/mascariila_arcilla_purificante.png" },
      { name: "Sérum Niacinamida Sebo-Regulador", category: "Tratamiento Facial", price: 85.00, stock: 16, imagen: "/images/products/serum_niacinamida_sebo.png" },
      { name: "Bruma Facial Rosas Hidratante", category: "Tratamiento Facial", price: 28.00, stock: 30, imagen: "/images/products/bruma_facial_rosas.png" },
      { name: "Mascarilla Velo Ácido Hialurónico", category: "Tratamiento Facial", price: 15.00, stock: 50, imagen: "/images/products/mascarilla_velo_acido.png" },
      { name: "Serum Vitamina C Puro", category: "Tratamiento Facial", price: 110.00, stock: 10, imagen: "/images/products/serum_vitamina_c.png" },
      { name: "Contorno de Ojos Anti-Ojeras", category: "Tratamiento Facial", price: 65.00, stock: 18, imagen: "/images/products/contorno_ojos.png" },
      { name: "Tónico Exfoliante AHA/BHA", category: "Tratamiento Facial", price: 55.00, stock: 20, imagen: "/images/products/tonico_exfoliante.png" },

      // Maquillaje
      { name: "Set de Brochas 12pcs", category: "Maquillaje", price: 55.00, stock: 25, imagen: "/images/products/set_de_brochas.png" },
      { name: "Labial Mate Larga Duración", category: "Maquillaje", price: 29.90, stock: 40, imagen: "/images/products/labial_mate.png" },
      { name: "Máscara de Pestañas Waterproof", category: "Maquillaje", price: 35.00, stock: 35, imagen: "/images/products/mascara_pestanas.png" },
      { name: "Base Líquida Alta Cobertura", category: "Maquillaje", price: 49.90, stock: 30, imagen: "/images/products/base_liquida.png" },
      { name: "Polvo Compacto Efecto Mate", category: "Maquillaje", price: 39.90, stock: 25, imagen: "/images/products/polvo_compacto.png" },
      { name: "Rubor Dúo Satinado", category: "Maquillaje", price: 32.90, stock: 20, imagen: "/images/products/rubor_duo.png" },
      { name: "Delineador Líquido Waterproof", category: "Maquillaje", price: 24.90, stock: 35, imagen: "/images/products/delineador_liquido.png" },
      { name: "Paleta de Sombras Nude 18 Colores", category: "Maquillaje", price: 69.90, stock: 15, imagen: "/images/products/paleta_sombras.png" },
      { name: "Corrector Líquido Hidratante", category: "Maquillaje", price: 27.90, stock: 28, imagen: "/images/products/corrector_liquido.png" },
      { name: "Iluminador Facial en Polvo", category: "Maquillaje", price: 34.90, stock: 22, imagen: "/images/products/iluminador_facial.png" },
      { name: "Reloj Elegance Rose", category: "Maquillaje", price: 145.00, stock: 8, imagen: "/images/products/reloj_rose.png" },
      { name: "Collar Perlas Silvestres", category: "Maquillaje", price: 125.00, stock: 10, imagen: "/images/products/perlas_silvestres.png" },
      { name: "Paleta de Sombras Neón", category: "Maquillaje", price: 85.00, stock: 5, imagen: "/images/products/sombras_neon.png" },
      { name: "Fijador de Maquillaje Matte", category: "Maquillaje", price: 42.00, stock: 25, imagen: "/images/products/fijador_matte.png" },
      { name: "Gloss Labial Voluminizador", category: "Maquillaje", price: 35.00, stock: 30, imagen: "/images/products/gloss_voluminizador.png" },

      // Fragancias
      { name: "Perfume Deep Blue", category: "Fragancias", price: 110.00, stock: 20, imagen: "/images/products/perfume_deepblue.png" },
      { name: "Perfume Flor de Cerezo", category: "Fragancias", price: 115.00, stock: 15, imagen: "/images/products/flor_cerezo.png" },
      { name: "Vela Aromática de Lavanda", category: "Fragancias", price: 35.00, stock: 30, imagen: "/images/products/vela_aromatica_lavanda.png" },
      { name: "Vela Aromática Vainilla Dulce", category: "Fragancias", price: 35.00, stock: 25, imagen: "/images/products/vela_aromatica_vainilla.png" },
      { name: "Perfume Noir Midnight", category: "Fragancias", price: 135.00, stock: 8, imagen: "/images/products/perfume_noir.png" },
      { name: "Set de Velas Aromáticas Zen", category: "Fragancias", price: 55.00, stock: 15, imagen: "/images/products/velas_zen.png" },

      // Cuidado Personal
      { name: "Crema Corporal Ultrahidratante", category: "Cuidado Personal", price: 48.00, stock: 22, imagen: "/images/products/crema_corporal.png" },
      { name: "Bloqueador Solar FPS 50+", category: "Cuidado Personal", price: 75.00, stock: 20, imagen: "/images/products/bloqueador.png" },
      { name: "Shampoo Nutrición Keratina", category: "Cuidado Personal", price: 38.00, stock: 28, imagen: "/images/products/shampo_nutricion_keratina.png" },
      { name: "Gel Ducha Relajante Lavanda", category: "Cuidado Personal", price: 28.00, stock: 40, imagen: "/images/products/gel_ducha.png" },
      { name: "Exfoliante Corporal Café", category: "Cuidado Personal", price: 34.00, stock: 22, imagen: "/images/products/exfoliante_cafe.png" }
    ];

    console.log("Limpiando catálogo antiguo...");
    await db.collection("products").deleteMany({});

    console.log(`Inyectando ${fullCatalog.length} productos...`);
    await db.collection("products").insertMany(fullCatalog);

    console.log(`✅ ¡Catálogo actualizado con éxito! Ahora tienes ${fullCatalog.length} productos en la nube.`);
  } catch (error) {
    console.error("❌ Ocurrió un error:", error);
  } finally {
    await client.close();
  }
}

run();
