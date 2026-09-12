import { Hono } from "hono";
import { ObjectId } from "mongodb";
import { getDb } from "../database/index.js";
import { getAuth, formatUser } from "./index.js";
import { signJwt, verifyJwt } from "./jwt.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret_key_threadly_2026";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "dev_refresh_secret_key_threadly_2026";

export const authRouter = new Hono();

// Mount Better Auth handler
authRouter.all("/auth/*", async (c) => {
  const auth = await getAuth();
  return auth.handler(c.req.raw);
});

// POST /api/v1/auth/dev-login - Generates JWT access token + refresh token
authRouter.post("/v1/auth/dev-login", async (c) => {
  const db = await getDb();
  const body = await c.req.json().catch(() => ({}));
  const targetUsername = (body.username || "kimchi").toLowerCase();

  let user = await db.collection("users").findOne({ username: targetUsername });

  if (!user) {
    const defaultProfile =
      targetUsername === "kimchi"
        ? {
            name: "Aged Kimchi",
            displayName: "Aged Kimchi",
            username: "kimchi",
            email: "kimchi@threadly.test",
            avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            avatarDecoration: "crimson-flame",
            bio: "Reading webtoons and building cool software.",
          }
        : {
            name: targetUsername,
            displayName: targetUsername.charAt(0).toUpperCase() + targetUsername.slice(1),
            username: targetUsername,
            email: `${targetUsername}@threadly.test`,
            avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${targetUsername}`,
            avatarDecoration: "none",
            bio: "Hello, I am using Threadly!",
          };

    const res = await db.collection("users").insertOne({
      ...defaultProfile,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    user = await db.collection("users").findOne({ _id: res.insertedId });
  }

  if (!user) {
    return c.json({ success: false, error: { code: "USER_NOT_FOUND", message: "User not found" } }, 404);
  }

  // 1. Sign JWT Access Token (15 mins)
  const accessToken = signJwt(
    {
      sub: user._id.toString(),
      username: user.username,
      displayName: user.displayName,
      type: "access",
    },
    JWT_SECRET,
    900 // 15 mins
  );

  // 2. Sign JWT Refresh Token (30 days)
  const refreshToken = signJwt(
    {
      sub: user._id.toString(),
      type: "refresh",
    },
    JWT_REFRESH_SECRET,
    30 * 24 * 3600 // 30 days
  );

  // Store refresh token in MongoDB
  await db.collection("refreshTokens").insertOne({
    userId: user._id,
    token: refreshToken,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
  });

  // Set HTTP-only cookies
  c.header(
    "Set-Cookie",
    `threadly_access_token=${accessToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=900`
  );
  c.header(
    "Set-Cookie",
    `threadly_refresh_token=${refreshToken}; Path=/api/v1/auth/refresh; HttpOnly; SameSite=Strict; Max-Age=2592000`,
    { append: true }
  );

  return c.json({
    success: true,
    data: {
      user: formatUser(user),
      accessToken,
      refreshToken,
      expiresIn: 900,
    },
  });
});

// POST /api/v1/auth/refresh - Refresh Access Token using Refresh Token
authRouter.post("/v1/auth/refresh", async (c) => {
  const db = await getDb();
  const body = await c.req.json().catch(() => ({}));
  const cookieHeader = c.req.header("cookie") || "";
  const cookieMatch = cookieHeader.match(/threadly_refresh_token=([^;]+)/);
  const refreshToken = body.refreshToken || (cookieMatch ? cookieMatch[1] : null);

  if (!refreshToken) {
    return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Missing refresh token" } }, 401);
  }

  // Verify refresh token signature & expiration
  const verified = verifyJwt(refreshToken, JWT_REFRESH_SECRET);
  if (!verified || verified.type !== "refresh") {
    return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Invalid or expired refresh token" } }, 401);
  }

  // Check database if refresh token is still active (not revoked)
  const tokenDoc = await db.collection("refreshTokens").findOne({ token: refreshToken });
  if (!tokenDoc) {
    return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Revoked refresh token" } }, 401);
  }

  const user = await db.collection("users").findOne({ _id: new ObjectId(verified.sub) });
  if (!user) {
    return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "User not found" } }, 401);
  }

  // Issue new access token
  const newAccessToken = signJwt(
    {
      sub: user._id.toString(),
      username: user.username,
      displayName: user.displayName,
      type: "access",
    },
    JWT_SECRET,
    900
  );

  c.header(
    "Set-Cookie",
    `threadly_access_token=${newAccessToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=900`
  );

  return c.json({
    success: true,
    data: {
      accessToken: newAccessToken,
      expiresIn: 900,
      user: formatUser(user),
    },
  });
});

// POST /api/v1/auth/logout - Revokes session and clears cookies
authRouter.post("/v1/auth/logout", async (c) => {
  const cookieHeader = c.req.header("cookie") || "";
  const cookieMatch = cookieHeader.match(/threadly_refresh_token=([^;]+)/);
  if (cookieMatch) {
    const db = await getDb();
    await db.collection("refreshTokens").deleteMany({ token: cookieMatch[1] });
  }

  c.header("Set-Cookie", "threadly_access_token=; Path=/; HttpOnly; Max-Age=0");
  c.header("Set-Cookie", "threadly_refresh_token=; Path=/api/v1/auth/refresh; HttpOnly; Max-Age=0", { append: true });
  c.header("Set-Cookie", "better-auth.session_token=; Path=/; HttpOnly; Max-Age=0", { append: true });

  return c.json({ success: true, message: "Logged out successfully" });
});
