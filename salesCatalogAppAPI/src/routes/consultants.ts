import { Hono } from "hono";
import { ObjectId } from "mongodb";
import type {
  Consultant,
  CreateConsultantBody,
  UpdateConsultantBody,
} from "./types";
import { db } from "../db";

const consultants = new Hono();

const consultantsCollection = db.collection<Consultant>("consultants");

consultants.get("/consultants", async (c) => {
  try {
    const page = Math.max(Number(c.req.query("page") ?? 1), 1);
    const limit = Math.max(Number(c.req.query("limit") ?? 20), 1);
    const search = c.req.query("search")?.trim() ?? "";

    const filter: Record<string, unknown> = {
      deletedAt: null,
    };

    if (search) {
      filter.name = {
        $regex: search,
        $options: "i",
      };
    }

    const total = await consultantsCollection.countDocuments(filter);

    const items = await consultantsCollection
      .find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .project({
        name: 1,
        dni: 1,
        phone: 1,
        zone: 1,
      })
      .toArray();

    return c.json({
      page,
      limit,
      items,
      total,
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
      400,
    );
  }
});

consultants.post("/consultants", async (c) => {
  try {
    const body = await c.req.json<CreateConsultantBody>();

    const name = body.name?.trim();
    const dni = body.dni?.trim();
    const phone = body.phone?.trim();
    const zone = body.zone?.trim();

    if (!name || !dni || !phone || !zone) {
      throw new Error();
    }

    const result = await consultantsCollection.insertOne({
      name,
      dni,
      phone,
      zone,
      deletedAt: null,
    });

    return c.json(
      {
        id: result.insertedId,
        name,
        dni,
        phone,
        zone,
      },
      201,
    );
  } catch {
    return c.json(
      {
        ok: false,
        error: {
          code: "BAD_REQUEST",
          message: "bad request",
        },
      },
      400,
    );
  }
});

consultants.put("/consultants/:id", async (c) => {
  try {
    const id = c.req.param("id");

    if (!ObjectId.isValid(id)) {
      throw new Error();
    }

    const body = await c.req.json<UpdateConsultantBody>();

    const update: Record<string, unknown> = {};

    if (body.name?.trim()) update.name = body.name.trim();
    if (body.dni?.trim()) update.dni = body.dni.trim();
    if (body.phone?.trim()) update.phone = body.phone.trim();
    if (body.zone?.trim()) update.zone = body.zone.trim();

    if (!Object.keys(update).length) {
      throw new Error();
    }

    const result = await consultantsCollection.findOneAndUpdate(
      {
        _id: new ObjectId(id),
        deletedAt: null,
      },
      {
        $set: update,
      },
      {
        returnDocument: "after",
      },
    );

    if (!result) {
      throw new Error();
    }

    return c.json({
      id: result._id,
      name: result.name,
      dni: result.dni,
      phone: result.phone,
      zone: result.zone,
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
      400,
    );
  }
});

consultants.delete("/consultants/:id", async (c) => {
  try {
    const id = c.req.param("id");

    if (!ObjectId.isValid(id)) {
      throw new Error();
    }

    await consultantsCollection.updateOne(
      {
        _id: new ObjectId(id),
        deletedAt: null,
      },
      {
        $set: {
          deletedAt: new Date(),
        },
      },
    );

    return c.json({
      id,
      deleted: true,
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
      400,
    );
  }
});

export default consultants;
