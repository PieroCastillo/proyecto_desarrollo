import { Hono } from "hono";
import { ObjectId } from "mongodb";
import { db } from "../db";

const orders = new Hono();

const ordersCollection = db.collection("orders");
const productsCollection = db.collection("products");
const MAX_ORDER_QUANTITY = 1000;

type CreateOrderBody = {
  clientId: string;
  consultantId: string;
  items: {
    productId: string;
    quantity: number;
  }[];
};

type UpdateOrderStatusBody = {
  status: "pending" | "paid" | "shipped" | "delivered";
};

orders.get("/orders", async (c) => {
  try {
    const status = c.req.query("status");
    const consultantId = c.req.query("consultantId");
    
    const filter: Record<string, unknown> = {};

    if (status) {
      filter.status = status;
    }
    
    if (consultantId && ObjectId.isValid(consultantId)) {
      filter.consultantId = new ObjectId(consultantId);
    }

    const items = await ordersCollection.find(filter).sort({ createdAt: -1 }).toArray();

    return c.json({
      status,
      items,
    });
  } catch {
    return c.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "bad request" } },
      400
    );
  }
});

orders.post("/orders", async (c) => {
  try {
    const body = await c.req.json<CreateOrderBody>();

    if (
      !body.clientId ||
      !ObjectId.isValid(body.clientId) ||
      !body.consultantId ||
      !ObjectId.isValid(body.consultantId) ||
      !body.items ||
      !Array.isArray(body.items) ||
      body.items.length === 0
    ) {
      throw new Error();
    }

    const requestedByProduct = new Map<string, number>();

    for (const item of body.items) {
      if (
        !item.productId ||
        !ObjectId.isValid(item.productId) ||
        typeof item.quantity !== "number" ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0 ||
        item.quantity > MAX_ORDER_QUANTITY
      ) {
        throw new Error();
      }

      requestedByProduct.set(
        item.productId,
        (requestedByProduct.get(item.productId) ?? 0) + item.quantity
      );
    }

    let total = 0;
    const itemsToSave = [];

    for (const [productId, quantity] of requestedByProduct) {
      if (quantity > MAX_ORDER_QUANTITY) throw new Error();

      const product = await productsCollection.findOne({
        _id: new ObjectId(productId),
      });
      if (!product) throw new Error();

      if (!Number.isFinite(product.price) || product.stock < quantity) {
        throw new Error();
      }

      total += product.price * quantity;
      itemsToSave.push({
        productId: new ObjectId(productId),
        name: product.name,
        price: product.price,
        quantity,
      });
    }

    for (const [productId, quantity] of requestedByProduct) {
      const update = await productsCollection.updateOne(
        { _id: new ObjectId(productId), stock: { $gte: quantity } },
        { $inc: { stock: -quantity } }
      );
      if (update.modifiedCount !== 1) throw new Error();
    }

    const orderDoc = {
      clientId: new ObjectId(body.clientId),
      consultantId: new ObjectId(body.consultantId),
      items: itemsToSave,
      total,
      status: "pending",
      createdAt: new Date(),
    };

    const result = await ordersCollection.insertOne(orderDoc);

    return c.json(
      {
        id: result.insertedId,
        ...orderDoc,
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

orders.patch("/orders/:id/status", async (c) => {
  try {
    const id = c.req.param("id");
    if (!ObjectId.isValid(id)) throw new Error();

    const body = await c.req.json<UpdateOrderStatusBody>();

    if (!["pending", "paid", "shipped", "delivered"].includes(body.status)) {
      throw new Error();
    }

    const result = await ordersCollection.findOneAndUpdate(
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

export default orders;
