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
const MAX_PRODUCT_VALUE = 1000000;

function isValidMoney(value: number) {
  return Number.isFinite(value) && value >= 0 && value <= MAX_PRODUCT_VALUE;
}

function isValidStock(value: number) {
  return Number.isInteger(value) && value >= 0 && value <= MAX_PRODUCT_VALUE;
}

function isValidImage(value?: string) {
  if (!value) return true;
  return value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/images/");
}

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
    const imagen = body.imagen?.trim();

    if (
      !name ||
      !category ||
      Number.isNaN(price) ||
      Number.isNaN(stock) ||
      !isValidMoney(price) ||
      !isValidStock(stock) ||
      !isValidImage(imagen)
    ) {
      throw new Error();
    }

    const productDoc: any = {
      name,
      category,
      price,
      stock,
    };
    if (imagen) {
      productDoc.imagen = imagen;
    }

    const result = await productsCollection.insertOne(productDoc);

    return c.json(
      {
        id: result.insertedId,
        name,
        category,
        price,
        stock,
        ...(imagen ? { imagen } : {}),
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

    if (
      typeof delta !== "number" ||
      !Number.isInteger(delta) ||
      delta === 0 ||
      Math.abs(delta) > MAX_PRODUCT_VALUE
    ) {
      throw new Error();
    }

    const stockGuard = delta < 0
      ? { $gte: -delta }
      : { $lte: MAX_PRODUCT_VALUE - delta };
    const filter: any = { _id: new ObjectId(id), stock: stockGuard };

    const result = await productsCollection.findOneAndUpdate(
      filter,
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
