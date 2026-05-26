import { Hono } from "hono";
import { sign, verify } from "hono/jwt";
import { ObjectId } from "mongodb";
import { hash, verify as verifyArgon } from "argon2";
import type { LoginBody, RegisterBody, User } from "./types";
import { db } from "../db";

const auth = new Hono();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is missing");
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

    const valid = await verifyArgon(user.passwordHash, password);

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
      JWT_SECRET,
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
  } catch {
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

    const passwordHash = await hash(password);

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
      JWT_SECRET,
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
  } catch {
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

    const payload = await verify(token, JWT_SECRET);

    if (!payload.sub || !ObjectId.isValid(payload.sub)) {
      throw new Error();
    }

    const user = await users.findOne({
      _id: new ObjectId(payload.sub),
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
  } catch {
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

export default auth;
