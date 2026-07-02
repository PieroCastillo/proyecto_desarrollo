import { Hono } from "hono";
import { ObjectId } from "mongodb";
import { db } from "../db";

const deliveryRoutes = new Hono();

const routesCollection = db.collection("routes");
const ordersCollection = db.collection("orders");

type CreateRouteBody = {
  zone: string;
  vehicle: string;
  driver: string;
  orders: string[];
};

type UpdateRouteStatusBody = {
  status: "pending" | "on_route" | "completed";
};

deliveryRoutes.post("/routes", async (c) => {
  try {
    const body = await c.req.json<CreateRouteBody>();

    if (
      !body.zone?.trim() ||
      !body.vehicle?.trim() ||
      !body.driver?.trim() ||
      !Array.isArray(body.orders) ||
      body.orders.length === 0
    ) {
      throw new Error();
    }

    const orderIds = body.orders.map((id) => {
      if (!ObjectId.isValid(id)) throw new Error();
      return new ObjectId(id);
    });

    const count = await ordersCollection.countDocuments({
      _id: { $in: orderIds },
    });
    if (count !== orderIds.length) {
      throw new Error();
    }

    const routeDoc = {
      zone: body.zone.trim(),
      vehicle: body.vehicle.trim(),
      driver: body.driver.trim(),
      orders: orderIds,
      status: "pending",
      createdAt: new Date(),
    };

    const result = await routesCollection.insertOne(routeDoc);

    return c.json(
      {
        id: result.insertedId,
        ...routeDoc,
      },
      201
    );
  } catch {
    return c.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "bad request" } },
      400
    );
  }
});

deliveryRoutes.patch("/routes/:id/status", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) throw new Error();

    const body = await c.req.json<UpdateRouteStatusBody>();

    if (!["pending", "on_route", "completed"].includes(body.status)) {
      throw new Error();
    }

    const result = await routesCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { status: body.status } },
      { returnDocument: "after" }
    );

    if (!result) throw new Error();

    return c.json({
      id: result._id,
      status: result.status,
    });
  } catch {
    return c.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "bad request" } },
      400
    );
  }
});

export default deliveryRoutes;
