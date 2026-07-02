import { Hono } from "hono";
import { ObjectId } from "mongodb";
import { db } from "../db";
import type { Training, TrainingParticipation } from "./types";

const trainings = new Hono();

const trainingsCollection = db.collection<Training>("trainings");
const participationCollection = db.collection<TrainingParticipation>("training_participations");

// Obtener todas las capacitaciones y verificar si el usuario logueado ya participó
trainings.get("/trainings", async (c) => {
  try {
    const payload = c.get("jwtPayload");
    const consultantId = payload?.sub;

    const items = await trainingsCollection.find().sort({ createdAt: -1 }).toArray();

    // Si el usuario es consultora, buscar cuáles ha completado
    let completedIds: string[] = [];
    if (consultantId && ObjectId.isValid(consultantId)) {
      const participations = await participationCollection
        .find({ consultantId: new ObjectId(consultantId) })
        .toArray();
      completedIds = participations.map(p => p.trainingId.toString());
    }

    // Agregar el flag 'completed' a cada item
    const formattedItems = items.map(item => ({
      ...item,
      completed: completedIds.includes(item._id.toString())
    }));

    return c.json({
      ok: true,
      items: formattedItems
    });
  } catch (error) {
    return c.json({ ok: false, error: { message: "Error al obtener capacitaciones" } }, 400);
  }
});

// Crear una nueva capacitación (Solo RRHH / Director)
trainings.post("/trainings", async (c) => {
  try {
    const body = await c.req.json();
    
    if (!body.title || !body.description || !body.videoUrl) {
      return c.json({ ok: false, error: { message: "Faltan campos requeridos" } }, 400);
    }

    const newTraining: Training = {
      title: body.title,
      description: body.description,
      videoUrl: body.videoUrl,
      instructor: body.instructor || "Directora General",
      category: body.category || "Ventas",
      points: Number(body.points) || 10,
      createdAt: new Date()
    };

    const result = await trainingsCollection.insertOne(newTraining as any);

    return c.json({ ok: true, id: result.insertedId, ...newTraining }, 201);
  } catch (error) {
    return c.json({ ok: false, error: { message: "Error al crear capacitación" } }, 400);
  }
});

// Registrar participación / marcar como completado
trainings.post("/trainings/:id/participate", async (c) => {
  try {
    const trainingId = c.req.param("id");
    const payload = c.get("jwtPayload");
    
    // Si envían un consultantId por el body (ej: RRHH registrando a alguien), lo usamos
    // Si no, usamos el ID del usuario logueado (Consultora)
    let consultantId = payload?.sub;
    try {
      const body = await c.req.json();
      if (body.consultantId) {
        consultantId = body.consultantId;
      }
    } catch(e) {
      // Ignorar si no hay body
    }

    if (!ObjectId.isValid(trainingId) || !consultantId || !ObjectId.isValid(consultantId)) {
      return c.json({ ok: false, error: { message: "ID inválido" } }, 400);
    }

    // Verificar si ya existe
    const existing = await participationCollection.findOne({
      trainingId: new ObjectId(trainingId),
      consultantId: new ObjectId(consultantId)
    });

    if (existing) {
      return c.json({ ok: true, message: "Ya habías registrado asistencia" });
    }

    const result = await participationCollection.insertOne({
      trainingId: new ObjectId(trainingId),
      consultantId: new ObjectId(consultantId),
      completedAt: new Date()
    } as any);

    return c.json({ ok: true, id: result.insertedId });
  } catch (error) {
    return c.json({ ok: false, error: { message: "Error al registrar participación" } }, 400);
  }
});

// Obtener lista de participantes de una capacitación (Solo RRHH)
trainings.get("/trainings/:id/participants", async (c) => {
  try {
    const trainingId = c.req.param("id");
    
    if (!ObjectId.isValid(trainingId)) {
      return c.json({ ok: false, error: { message: "ID inválido" } }, 400);
    }

    const participations = await participationCollection
      .find({ trainingId: new ObjectId(trainingId) })
      .toArray();

    const participantIds = participations.map(p => p.consultantId);

    // Puede que sean usuarios del sistema (JWT) o consultoras (Dropdown RRHH)
    // Buscamos en ambas colecciones
    const usersCollection = db.collection("users");
    const consultantsCollection = db.collection("consultants");

    const [users, consultants] = await Promise.all([
      usersCollection.find({ _id: { $in: participantIds } }).toArray(),
      consultantsCollection.find({ _id: { $in: participantIds } }).toArray()
    ]);

    // Combinamos y normalizamos los nombres
    const participantsList = [];
    
    for (const p of participations) {
      const pid = p.consultantId.toString();
      const asUser = users.find(u => u._id.toString() === pid);
      const asConsultant = consultants.find(c => c._id.toString() === pid);
      
      let name = "Desconocido";
      if (asConsultant) name = asConsultant.name;
      else if (asUser) name = asUser.username;

      // Evitar duplicados si hay cruces raros
      if (!participantsList.find(x => x.username === name)) {
        participantsList.push({ username: name });
      }
    }

    return c.json({ ok: true, participants: participantsList });
  } catch (error) {
    return c.json({ ok: false, error: { message: "Error al obtener participantes" } }, 400);
  }
});

export default trainings;
