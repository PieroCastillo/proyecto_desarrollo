import { Hono } from "hono";

const auth = new Hono();
/** views:
 * /login
 * /profile
 */

type LoginBody = {
  username: string;
  password: string;
};

auth.post("/auth/login", async (c) => {
  /*
    Qué hace:
    - recibe credenciales
    - valida usuario
    - genera JWT
    - devuelve usuario autenticado
  */

  const { username, password } = await c.req.json<LoginBody>();

  const response = {
    token: "<JWT>",
    expiresIn: 86400,
    user: {
      id: "u1",
      username,
      role: "admin",
    },
  };

  return c.json(response);
});

auth.get("/auth/me", (c) => {
  /*
    Qué hace:
    - lee Authorization Bearer token
    - valida JWT
    - retorna usuario actual
  */

  const authTkn = c.req.header("Authorization");

  const response = {
    id: "u1",
    username: "admin",
    role: "admin",
  };

  return c.json(response);
});

export default auth;
