import { Hono } from "hono";

const clients = new Hono();
/** views:
 *  /clients
 */

type CreateClientBody = {
  name: string;
  phone: string;
  address: string;
};

clients.get("/clients", (c) => {
  /*
    Qué hace:
    - listar clientes
  */

  return c.json({
    items: [],
  });
});

clients.post("/clients", async (c) => {
  /*
    Qué hace:
    - crear cliente
  */

  const body = await c.req.json<CreateClientBody>();

  return c.json({
    id: "cl1",
    ...body,
  });
});

export default clients;
