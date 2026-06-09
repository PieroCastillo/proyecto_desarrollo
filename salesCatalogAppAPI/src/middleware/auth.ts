import { Context, Next } from "hono";
import { verify } from "hono/jwt";

// Rutas públicas que no requieren token
const PUBLIC_ROUTES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/public", // en caso haya
];

export async function jwtMiddleware(c: Context, next: Next) {
  const path = c.req.path;

  // Si la ruta es pública, dejamos pasar la petición
  if (PUBLIC_ROUTES.includes(path) || path.startsWith("/images")) {
    await next();
    return;
  }

  // Verificamos si la ruta requiere autenticación (empieza con /api)
  if (path.startsWith("/api/")) {
    const authorization = c.req.header("Authorization");

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return c.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "Token no proporcionado" } },
        401
      );
    }

    const token = authorization.slice(7);
    const JWT_SECRET = process.env.JWT_SECRET;

    if (!JWT_SECRET) {
      return c.json({ ok: false, error: { message: "Error interno de servidor" } }, 500);
    }

    try {
      // Hono v4: especificar algoritmo
      const payload = await verify(token, JWT_SECRET, "HS256");
      
      // Inyectar el payload validado en el contexto para que las rutas puedan usarlo
      c.set("jwtPayload", payload);
      
      await next();
    } catch (error) {
      return c.json(
        { ok: false, error: { code: "INVALID_TOKEN", message: "Token inválido o expirado" } },
        401
      );
    }
  } else {
    await next();
  }
}
