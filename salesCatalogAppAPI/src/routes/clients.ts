import { Hono } from "hono";
import type { Client, CreateClientBody } from "./types";
import { db } from "../db";

const clients = new Hono();

const clientsCollection = db.collection<Client>("clients");

clients.get("/clients", async (c) => {
  try {
    const items = await clientsCollection
      .find({})
      .project({
        name: 1,
        phone: 1,
        address: 1,
      })
      .toArray();

    return c.json({
      items,
    });
  } catch {
    return c.json(
      {
        ok: false,
        error: {
          code: "BAD_REQUEST",
          message: "bad request",
        },
      },
      400
    );
  }
});

clients.post("/clients", async (c) => {
  try {
    const body = await c.req.json<CreateClientBody>();

    const name = body.name?.trim();
    const phone = body.phone?.trim();
    const address = body.address?.trim();

    if (!name || !phone || !address) {
      throw new Error();
    }

    const result = await clientsCollection.insertOne({
      name,
      phone,
      address,
    });

    return c.json({
      id: result.insertedId,
      name,
      phone,
      address,
    });
  } catch {
    return c.json(
      {
        ok: false,
        error: {
          code: "BAD_REQUEST",
          message: "bad request",
        },
      },
      400
    );
  }
});

export default clients;