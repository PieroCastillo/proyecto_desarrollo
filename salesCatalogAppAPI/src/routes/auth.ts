import { Hono } from "hono";
import { sign, verify } from "hono/jwt";
import { ObjectId } from "mongodb";
import type { LoginBody, RegisterBody, User } from "./types";
import { db } from "../db";

const auth = new Hono();

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is missing");
  }
  return secret;
}

async function hashPassword(password: string) {
  const { hash } = await import("argon2");
  return hash(password);
}

async function verifyPassword(hashValue: string, password: string) {
  const { verify: verifyArgon } = await import("argon2");
  return verifyArgon(hashValue, password);
}

const users = db.collection<User>("users");

auth.post("/auth/login", async (c) => {
  try {
    const body = await c.req.json<LoginBody>();

    const username = body.username?.trim();
    const password = body.password;

    if (!username || !password) {
      return c.json(
        {
          ok: false,
          error: {
            code: "BAD_REQUEST",
            message: "bad request",
          },
        },
        400,
      );
    }

    const user = await users.findOne({ username });

    if (!user) {
      return c.json(
        {
          ok: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "invalid credentials",
          },
        },
        401,
      );
    }

    const valid = await verifyPassword(user.passwordHash, password);

    if (!valid) {
      return c.json(
        {
          ok: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "invalid credentials",
          },
        },
        401,
      );
    }

    const token = await sign(
      {
        sub: user._id.toString(),
        usr: user.username,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + 900,
      },
      getJwtSecret(),
    );

    return c.json({
      ok: true,
      data: {
        accessToken: token,
        tokenType: "Bearer",
        expiresIn: 900,
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
        },
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "JWT_SECRET is missing") {
      return c.json({ ok: false, error: { code: "SERVER_CONFIG", message: error.message } }, 500);
    }
    return c.json(
      {
        ok: false,
        error: {
          code: "BAD_REQUEST",
          message: "bad request",
        },
      },
      400,
    );
  }
});

auth.post("/auth/register", async (c) => {
  try {
    const body = await c.req.json<RegisterBody>();

    const username = body.username?.trim();
    const password = body.password;
    const role = body.role || "consultant";

    if (!username || !password || password.length < 4) {
      return c.json(
        {
          ok: false,
          error: {
            code: "BAD_REQUEST",
            message: "Username and password (min 4 characters) are required",
          },
        },
        400,
      );
    }

    const existingUser = await users.findOne({ username });

    if (existingUser) {
      return c.json(
        {
          ok: false,
          error: {
            code: "USERNAME_TAKEN",
            message: "Username already taken",
          },
        },
        400,
      );
    }

    const passwordHash = await hashPassword(password);

    const newUser = {
      username,
      passwordHash,
      role,
    };

    const result = await users.insertOne(newUser as any);

    const token = await sign(
      {
        sub: result.insertedId.toString(),
        usr: username,
        role: role,
        exp: Math.floor(Date.now() / 1000) + 900,
      },
      getJwtSecret(),
    );

    return c.json({
      ok: true,
      data: {
        accessToken: token,
        tokenType: "Bearer",
        expiresIn: 900,
        user: {
          id: result.insertedId,
          username,
          role,
        },
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "JWT_SECRET is missing") {
      return c.json({ ok: false, error: { code: "SERVER_CONFIG", message: error.message } }, 500);
    }
    return c.json(
      {
        ok: false,
        error: {
          code: "BAD_REQUEST",
          message: "bad request",
        },
      },
      400,
    );
  }
});

auth.get("/auth/me", async (c) => {
  try {
    const authorization = c.req.header("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return c.json(
        {
          ok: false,
          error: {
            code: "UNAUTHORIZED",
            message: "missing bearer token",
          },
        },
        401,
      );
    }

    const token = authorization.slice(7);

    // Hono v4 requiere especificar obligatoriamente el algoritmo por seguridad
    const payload = await verify(token, getJwtSecret(), "HS256");

    if (!payload.sub || !ObjectId.isValid(payload.sub as string)) {
      throw new Error();
    }

    const user = await users.findOne({
      _id: new ObjectId(payload.sub as string),
    });

    if (!user) {
      return c.json(
        {
          ok: false,
          error: {
            code: "USER_NOT_FOUND",
            message: "user not found",
          },
        },
        404,
      );
    }

    return c.json({
      ok: true,
      data: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("DEBUG /auth/me error:", error);
    return c.json(
      {
        ok: false,
        error: {
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "bad request",
        },
      },
      400,
    );
  }
});

export default auth;
