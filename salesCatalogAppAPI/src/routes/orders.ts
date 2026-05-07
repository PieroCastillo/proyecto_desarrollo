import { Hono } from "hono";

const orders = new Hono();
/** views:
 * /orders
 * /orders/new
 * /orders/:id
 */

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

orders.get("/orders", (c) => {
  /*
    Qué hace:
    - listar pedidos
  */

  const status = c.req.query("status");

  return c.json({
    status,
    items: [],
  });
});

orders.post("/orders", async (c) => {
  /*
    Qué hace:
    - crear pedido
    - calcular total
    - descontar stock
  */

  const body = await c.req.json<CreateOrderBody>();

  return c.json({
    id: "o1",
    status: "pending",
    ...body,
  });
});

orders.patch("/orders/:id/status", async (c) => {
  /*
    Qué hace:
    - cambia estado del pedido
  */

  const id = c.req.param("id");
  const body = await c.req.json<UpdateOrderStatusBody>();

  return c.json({
    id,
    ...body,
  });
});

export default orders;
