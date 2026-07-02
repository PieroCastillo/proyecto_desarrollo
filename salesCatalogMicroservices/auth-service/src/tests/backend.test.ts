import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindOne = vi.fn();
const mockInsertOne = vi.fn();
const mockFindToArray = vi.fn();

vi.mock("../db", () => ({
  db: {
    collection: () => ({
      findOne: (args: any) => mockFindOne(args),
      insertOne: (args: any) => mockInsertOne(args),
      find: () => ({
        project: () => ({ toArray: () => mockFindToArray() }),
        toArray: () => mockFindToArray(),
      }),
    }),
  },
}));

import authRoute from "../routes/auth";
import clientsRoute from "../routes/clients";
import productsRoute from "../routes/products";
import { jwtMiddleware } from "../middleware/auth";
import { Context } from "hono";

vi.mock("argon2", () => ({
  verify: vi.fn().mockResolvedValue(true),
}));

vi.mock("hono/jwt", async () => {
  const actual = await vi.importActual("hono/jwt");
  return {
    ...actual,
    verify: vi.fn().mockImplementation(async (token) => {
      if (token === "token_valido") {
        return { sub: "60c72b2f9b1d8b2bad7f1a1a" };
      }
      if (token === "token_usuario_inexistente") {
        return { sub: "60c72b2f9b1d8b2bad7f1bbb" };
      }
      throw new Error("Invalid Token");
    }),
  };
});

process.env.JWT_SECRET = "super_secret_test_key";

describe("Conjunto de Pruebas Unitarias del Backend (12 Escenarios)", () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // MÓDULO DE AUTENTICACIÓN (5 Tests)
  // =========================================================================
  
  it("1. [AUTH] Debería loguear exitosamente y retornar un JWT token", async () => {
    mockFindOne.mockResolvedValue({
      _id: "60c72b2f9b1d8b2bad7f1a1a",
      username: "pepito",
      passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$hashSimulado...",
      role: "consultant"
    });

    const res = await authRoute.request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "pepito", password: "123456" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data).toHaveProperty("accessToken");
  });

  it("2. [AUTH] Debería rechazar el login (401) si las credenciales son inválidas", async () => {
    mockFindOne.mockResolvedValue(null);

    const res = await authRoute.request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "desconocido", password: "falsapassword" }),
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("3. [AUTH] Debería retornar error 400 si se envía una solicitud incompleta (Falta Password)", async () => {
    const res = await authRoute.request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "pepito" }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("BAD_REQUEST");
  });

  it("4. [AUTH] Debería devolver la información del usuario en /auth/me usando un token válido", async () => {
    mockFindOne.mockResolvedValue({
      _id: "60c72b2f9b1d8b2bad7f1a1a",
      username: "pepito",
      role: "consultant"
    });

    const res = await authRoute.request("/auth/me", {
      method: "GET",
      headers: { "Authorization": "Bearer token_valido" },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.username).toBe("pepito");
    expect(body.data.role).toBe("consultant");
  });

  it("5. [AUTH] Debería retornar 404 en /auth/me si el token es válido pero el usuario ya no existe en la BD", async () => {
    mockFindOne.mockResolvedValue(null); 

    const res = await authRoute.request("/auth/me", {
      method: "GET",
      headers: { "Authorization": "Bearer token_usuario_inexistente" },
    });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("USER_NOT_FOUND");
  });


  // =========================================================================
  // MÓDULO DE CLIENTES (3 Tests)
  // =========================================================================

  it("6. [CLIENTS] Debería crear un cliente exitosamente", async () => {
    mockInsertOne.mockResolvedValue({ insertedId: "client_id_123" });

    const res = await clientsRoute.request("/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Juan Perez", phone: "987654321", address: "Av. Peru 123" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("id");
    expect(body.name).toBe("Juan Perez");
  });

  it("7. [CLIENTS] Debería retornar error 400 si faltan campos obligatorios al registrar cliente", async () => {
    const res = await clientsRoute.request("/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Solo tengo nombre" }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("BAD_REQUEST");
  });

  it("8. [CLIENTS] Debería capturar errores inesperados en el bloque catch al insertar en BD", async () => {
    mockInsertOne.mockRejectedValue(new Error("Database Connection Timeout"));

    const res = await clientsRoute.request("/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Carlos", phone: "123", address: "Calle Falsa" }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toHaveProperty("message");
  });


  // =========================================================================
  // MÓDULO DE PRODUCTOS (2 Tests)
  // =========================================================================

  it("9. [PRODUCTS] Debería listar todos los productos de una categoría específica", async () => {
    const mockProducts = [
      { name: "Labial Rojo", category: "maquillaje", price: 25, stock: 10 },
      { name: "Base Líquida", category: "maquillaje", price: 40, stock: 5 }
    ];
    mockFindToArray.mockResolvedValue(mockProducts);

    const res = await productsRoute.request("/products?category=maquillaje");

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.category).toBe("maquillaje");
    expect(body.items).toHaveLength(2);
  });

  it("10. [PRODUCTS] Debería responder con una lista vacía de items si la categoría no contiene productos", async () => {
    mockFindToArray.mockResolvedValue([]); 

    const res = await productsRoute.request("/products?category=tecnologia");

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.category).toBe("tecnologia");
    expect(body.items).toHaveLength(0);
  });


  // =========================================================================
  // MIDDLEWARES DE SEGURIDAD (2 Tests)
  // =========================================================================

  it("11. [MIDDLEWARE] Debería rechazar con 401 si falta por completo el header Authorization", async () => {
    const mockContext = {
      req: {
        path: "/api/products",
        header: vi.fn().mockReturnValue(undefined),
      },
      json: vi.fn().mockImplementation((data, status) => ({ data, status })),
    } as unknown as Context;

    const nextMock = vi.fn();
    const response: any = await jwtMiddleware(mockContext, nextMock);

    expect(response.status).toBe(401);
    expect(response.data.ok).toBe(false);
    expect(nextMock).not.toHaveBeenCalled();
  });

  it("12. [MIDDLEWARE] Debería rechazar con 401 si el token no tiene el formato 'Bearer <token>'", async () => {
    const mockContext = {
      req: {
        path: "/api/products",
        header: vi.fn().mockReturnValue("Basic dXNlcjpwYXNz"),
      },
      json: vi.fn().mockImplementation((data, status) => ({ data, status })),
    } as unknown as Context;

    const nextMock = vi.fn();
    const response: any = await jwtMiddleware(mockContext, nextMock);

    expect(response.status).toBe(401);
    expect(response.data.ok).toBe(false);
    expect(nextMock).not.toHaveBeenCalled();
  });

});