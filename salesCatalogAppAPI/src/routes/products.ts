import { Hono } from "hono";

const products = new Hono();
/** view
 * /products
 */

type CreateProductBody = {
  name: string;
  category: string;
  price: number;
  stock: number;
};
type PatchStockBody = {
  delta: number;
};

products.get("/products", (c) => {
  /*
    - lista catálogo
    - filtros por categoría / stock
  */

  const category = c.req.query("category");
  const stock = c.req.query("stock");

  return c.json({
    category,
    stock,
    items: [],
  });
});

products.post("/products", async (c) => {
  /*
    - registrar producto
  */

  const body = await c.req.json<CreateProductBody>();

  return c.json({
    id: "p1",
    ...body,
  });
});

products.patch("/products/:id/stock", async (c) => {
  /*
    - suma/resta stock
  */

  const id = c.req.param("id");
  const { delta } = await c.req.json<PatchStockBody>();

  return c.json({
    id,
    delta,
  });
});

export default products;
