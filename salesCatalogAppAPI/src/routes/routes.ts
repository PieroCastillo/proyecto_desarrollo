import { Hono } from "hono";

const routes = new Hono();
/** views:
 * /routes
 * /routes/:id
 */

type CreateRouteBody = {
  zone: string;
  vehicle: string;
  driver: string;
  orders: string[];
};

type UpdateRouteStatusBody = {
  status: "pending" | "on_route" | "completed";
};

routes.post("/routes", async (c) => {
  /*
    - crear ruta de reparto
    - asignar pedidos
  */

  const body = await c.req.json<CreateRouteBody>();

  return c.json({
    id: "r1",
    status: "pending",
    ...body,
  });
});

routes.patch("/routes/:id/status", async (c) => {
  /*
    - actualizar estado reparto
  */

  const id = c.req.param("id");
  const body = await c.req.json<UpdateRouteStatusBody>();

  return c.json({
    id,
    ...body,
  });
});

export default routes;
