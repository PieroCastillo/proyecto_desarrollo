import { Hono } from "hono";
import { sign, verify } from "hono/jwt";
import { MongoClient, ObjectId } from "mongodb";
import { verify as verifyArgon } from "argon2";

const auth = new Hono();

const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

if (!MONGO_URI) {
  throw new Error("MONGO_URI is missing");
}

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is missing");
}

const mongo = new MongoClient(MONGO_URI);
const db = mongo.db("app");
const users = db.collection("users");

type LoginBody = {
  username: string;
  password: string;
};

auth.post("/auth/login", async (c) => {
  const body = await c.req.json<LoginBody>();

  const username = body.username?.trim();
  const password = body.password;

  if (!username || !password) {
    return c.json({
      ok: false,
      error: {
        code: "BAD_REQUEST",
        message: "missing credentials",
      },
    }, 400);
  }

  const user = await users.findOne({ username });

  if (!user) {
    return c.json({
      ok: false,
      error: {
        code: "INVALID_CREDENTIALS",
        message: "invalid credentials",
      },
    }, 401);
  }

  const valid = await verifyArgon(user.passwordHash, password);

  if (!valid) {
    return c.json({
      ok: false,
      error: {
        code: "INVALID_CREDENTIALS",
        message: "invalid credentials",
      },
    }, 401);
  }

  const token = await sign(
    {
      sub: user._id.toString(),
      usr: user.username,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + 60 * 15,
    },
    JWT_SECRET
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
});

auth.get("/auth/me", async (c) => {
  const authorization = c.req.header("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return c.json({
      ok: false,
      error: {
        code: "UNAUTHORIZED",
        message: "missing bearer token",
      },
    }, 401);
  }

  const token = authorization.slice(7);

  try {
    const payload = await verify(token, JWT_SECRET);

    const user = await users.findOne({
      _id: new ObjectId(payload.sub),
    });

    if (!user) {
      return c.json({
        ok: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "user not found",
        },
      }, 404);
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
    return c.json({
      ok: false,
      error: {
        code: "INVALID_TOKEN",
        message: "invalid token",
      },
    }, 401);
  }
});

export default auth;