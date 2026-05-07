import { Hono } from "hono";
import { ObjectId } from "mongodb";
import { db } from "../db";
import type {
  CreateProductBody,
  PatchStockBody,
  Product,
} from "./types";

const products = new Hono();

const productsCollection = db.collection<Product>("products");

products.get("/products", async (c) => {
  try {
    const category = c.req.query("category")?.trim();
    const stock = c.req.query("stock");

    const filter: Record<string, unknown> = {};

    if (category) {
      filter.category = category;
    }

    if (stock === "available") {
      filter.stock = { $gt: 0 };
    }

    if (stock === "empty") {
      filter.stock = { $lte: 0 };
    }

    const items = await productsCollection.find(filter).toArray();

    return c.json({
      category,
      stock,
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

products.post("/products", async (c) => {
  try {
    const body = await c.req.json<CreateProductBody>();

    const name = body.name?.trim();
    const category = body.category?.trim();
    const price = Number(body.price);
    const stock = Number(body.stock);

    if (
      !name ||
      !category ||
      Number.isNaN(price) ||
      Number.isNaN(stock)
    ) {
      throw new Error();
    }

    const result = await productsCollection.insertOne({
      name,
      category,
      price,
      stock,
    });

    return c.json(
      {
        id: result.insertedId,
        name,
        category,
        price,
        stock,
      },
      201
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
      400
    );
  }
});

products.patch("/products/:id/stock", async (c) => {
  try {
    const id = c.req.param("id");

    if (!ObjectId.isValid(id)) {
      throw new Error();
    }

    const { delta } = await c.req.json<PatchStockBody>();

    if (typeof delta !== "number" || Number.isNaN(delta)) {
      throw new Error();
    }

    const result = await productsCollection.findOneAndUpdate(
      {
        _id: new ObjectId(id),
      },
      {
        $inc: {
          stock: delta,
        },
      },
      {
        returnDocument: "after",
      }
    );

    if (!result) {
      throw new Error();
    }

    return c.json({
      id: result._id,
      stock: result.stock,
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

export default products;