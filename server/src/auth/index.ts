import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { getDb } from "../database/index.js";
import { ThreadlyUser } from "@threadly/types";

let authInstance: any = null;

export const getAuth = async () => {
  if (authInstance) return authInstance;

  const db = await getDb();

  authInstance = betterAuth({
    database: mongodbAdapter(db),
    secret: process.env.BETTER_AUTH_SECRET || "dev_threadly_secret_key_change_in_production_12345",
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || "mock-google-client-id",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "mock-google-client-secret",
        enabled: Boolean(process.env.GOOGLE_CLIENT_ID),
      },
      discord: {
        clientId: process.env.DISCORD_CLIENT_ID || "mock-discord-client-id",
        clientSecret: process.env.DISCORD_CLIENT_SECRET || "mock-discord-client-secret",
        enabled: Boolean(process.env.DISCORD_CLIENT_ID),
      },
    },
    user: {
      additionalFields: {
        username: { type: "string", required: false },
        displayName: { type: "string", required: false },
        avatarDecoration: { type: "string", required: false },
        bio: { type: "string", required: false },
      },
    },
  });

  return authInstance;
};

import { verifyJwt } from "./jwt.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret_key_threadly_2026";

export const getSessionUser = async (req: Request): Promise<ThreadlyUser | null> => {
  const db = await getDb();

  // 1. Check Bearer Authorization JWT
  const authHeader = req.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace(/^Bearer\s+/, "").trim();
    const verified = verifyJwt(token, JWT_SECRET);
    if (verified && verified.type === "access" && verified.sub) {
      const userDoc = await db.collection("users").findOne({ _id: new (await import("mongodb")).ObjectId(verified.sub) });
      if (userDoc) {
        return formatUser(userDoc);
      }
    }
  }

  // 2. Check dev test header or session cookie
  const testUserId = req.headers.get("X-Threadly-User-Id");
  const cookieHeader = req.headers.get("cookie") || "";

  // Support dev test session or mock token
  if (testUserId) {
    const userDoc = await db.collection("users").findOne({ _id: testUserId as any });
    if (userDoc) {
      return formatUser(userDoc);
    }
  }

  // Check session token or JWT in cookie
  const jwtCookieMatch = cookieHeader.match(/threadly_access_token=([^;]+)/);
  if (jwtCookieMatch) {
    const verified = verifyJwt(jwtCookieMatch[1], JWT_SECRET);
    if (verified && verified.type === "access" && verified.sub) {
      const userDoc = await db.collection("users").findOne({ _id: new (await import("mongodb")).ObjectId(verified.sub) });
      if (userDoc) {
        return formatUser(userDoc);
      }
    }
  }

  const sessionMatch = cookieHeader.match(/better-auth\.session_token=([^;]+)/);
  const token = sessionMatch ? sessionMatch[1] : null;

  if (token) {
    const sessionDoc = await db.collection("session").findOne({ token });
    if (sessionDoc && new Date(sessionDoc.expiresAt) > new Date()) {
      const userDoc = await db.collection("user").findOne({ _id: sessionDoc.userId });
      if (userDoc) {
        return formatUser(userDoc);
      }
    }
  }

  return null;
};

export const formatUser = (doc: any): ThreadlyUser => {
  return {
    id: doc._id.toString(),
    name: doc.name || doc.displayName || "Anonymous",
    email: doc.email,
    username: doc.username || (doc.name ? doc.name.toLowerCase().replace(/[^a-z0-9_]/g, "") : "user"),
    displayName: doc.displayName || doc.name || "Anonymous",
    avatarUrl: doc.avatarUrl || doc.image || "https://api.dicebear.com/7.x/bottts/svg?seed=" + doc._id,
    avatarDecoration: doc.avatarDecoration || "none",
    bio: doc.bio || "",
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
  };
};
