import { Hono } from "hono";
import { db } from "../db";

const status = new Hono();

status.get("/status", async (c) => {
  const checks = [];

  try {
    await db.command({ ping: 1 });
    checks.push({ name: "MongoDB", ok: true, detail: "Conexion activa" });
  } catch (error) {
    checks.push({ name: "MongoDB", ok: false, detail: error instanceof Error ? error.message : "Error desconocido" });
  }

  for (const collection of ["orders", "routes", "trainings"]) {
    try {
      const count = await db.collection(collection).countDocuments();
      checks.push({ name: collection, ok: true, detail: `${count} documentos` });
    } catch {
      checks.push({ name: collection, ok: false, detail: "No se pudo leer" });
    }
  }

  const ok = checks.every((check) => check.ok);
  return c.json({ service: "orders-service", ok, checks }, ok ? 200 : 503);
});

export default status;
