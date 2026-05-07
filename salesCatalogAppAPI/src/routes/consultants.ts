import { Hono } from "hono";

const consultants = new Hono();
/** views:
 * /consultants
 * /consultants/:id
 */

type CreateConsultantBody = {
  name: string;
  dni: string;
  phone: string;
  zone: string;
};

consultants.get("/consultants", (c) => {
  /*
    Qué hace:
    - lista consultoras
    - soporta filtros/paginación
  */

  const page = Number(c.req.query("page") ?? 1);
  const limit = Number(c.req.query("limit") ?? 20);
  const search = c.req.query("search") ?? "";

  const response = {
    page,
    limit,
    items: [],
    total: 0,
  };

  return c.json(response);
});

consultants.post("/consultants", async (c) => {
  /*
    Qué hace:
    - crea nueva consultora
  */

  const body = await c.req.json<CreateConsultantBody>();

  const response = {
    id: "c1",
    ...body,
  };

  return c.json(response, 201);
});

consultants.put("/consultants/:id", async (c) => {
  /*
    Qué hace:
    - actualiza datos
  */

  const id = c.req.param("id");
  const body = await c.req.json();

  const response = {
    id,
    ...body,
  };

  return c.json(response);
});

consultants.delete("/consultants/:id", (c) => {
  /*
    Qué hace:
    - soft delete
  */

  const id = c.req.param("id");

  return c.json({
    id,
    deleted: true,
  });
});

export default consultants;
