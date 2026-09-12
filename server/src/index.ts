import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { dynamicCors } from "./middleware/cors.js";
import { rateLimiter } from "./middleware/rate-limiter.js";
import { authMiddleware } from "./middleware/auth.js";
import { commentsRouter } from "./comments/routes.js";
import { sitesRouter } from "./sites/routes.js";
import { usersRouter } from "./users/routes.js";
import { reportsRouter } from "./reports/routes.js";
import { adminRouter } from "./admin/routes.js";
import { authRouter } from "./auth/routes.js";
import { domainRouter } from "./domains/domain.routes.js";
import { getDb } from "./database/index.js";
import { securityHeaders, noSqlInjectionProtection } from "./middleware/security.js";
import dotenv from "dotenv";

dotenv.config();

const app = new Hono();

// Middleware
app.use("*", securityHeaders());
app.use("*", dynamicCors());
app.use("*", rateLimiter({ max: 120, windowMs: 60 * 1000 }));
app.use("*", noSqlInjectionProtection());
app.use("*", authMiddleware());

// Health Check
app.get("/health", (c) => {
  return c.json({ status: "healthy", service: "threadly-api", timestamp: new Date().toISOString() });
});

// Route Mounts
app.route("/api", authRouter);
app.route("/api/v1", commentsRouter);
app.route("/api/v1", sitesRouter);
app.route("/api/v1/users", usersRouter);
app.route("/api/v1", reportsRouter);
app.route("/api/v1/admin", adminRouter);
app.route("/api/v1", domainRouter);

// Global Error Handler
app.onError((err, c) => {
  console.error("[Threadly API Error]", err);
  return c.json(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: err.message || "An unexpected error occurred",
      },
    },
    500
  );
});

// Seed demo sites & comments on startup
async function seedInitialData() {
  try {
    const db = await getDb();
    const count = await db.collection("sites").countDocuments();
    if (count === 0) {
      console.log("[Seed] Seeding demo sites and comments...");

      // Demo Site 1: Mist Scans (Manga / Webtoon)
      await db.collection("sites").insertOne({
        siteId: "mist-scans",
        name: "Mist Scans",
        allowedOrigins: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://127.0.0.1:5173", "http://127.0.0.1:5175", "https://mistscans.com"],
        publicKey: "pk_mistscans_public_demo_key",
        ownerId: "demo-owner",
        settings: {
          moderationEnabled: true,
          autoApproveComments: true,
          profanityFilterEnabled: true,
          spamFilterEnabled: true,
          aiModerationEnabled: false,
          maxCommentLength: 2000,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Demo Site 2: Example Blog
      await db.collection("sites").insertOne({
        siteId: "example-blog",
        name: "Example Blog",
        allowedOrigins: ["*"],
        publicKey: "pk_exampleblog_public_demo_key",
        ownerId: "demo-owner",
        settings: {
          moderationEnabled: true,
          autoApproveComments: true,
          profanityFilterEnabled: true,
          spamFilterEnabled: true,
          aiModerationEnabled: false,
          maxCommentLength: 2000,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Demo Site 3: Tech News
      await db.collection("sites").insertOne({
        siteId: "tech-news",
        name: "Tech News Daily",
        allowedOrigins: ["*"],
        publicKey: "pk_technews_public_demo_key",
        ownerId: "demo-owner",
        settings: {
          moderationEnabled: true,
          autoApproveComments: true,
          profanityFilterEnabled: true,
          spamFilterEnabled: true,
          aiModerationEnabled: false,
          maxCommentLength: 2000,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Seed pages
      await db.collection("pages").insertMany([
        {
          siteId: "mist-scans",
          pageId: "lookism-500",
          url: "https://mistscans.com/read/lookism/500",
          title: "Lookism Chapter 500",
          commentCount: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          siteId: "example-blog",
          pageId: "my-first-post",
          url: "https://example.com/posts/my-first-post",
          title: "My First Post",
          commentCount: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      // Seed comments
      const comment1Res = await db.collection("comments").insertOne({
        siteId: "mist-scans",
        pageId: "lookism-500",
        userId: "user-kimchi",
        author: {
          id: "user-kimchi",
          username: "kimchi",
          displayName: "Aged Kimchi",
          avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
          avatarDecoration: "crimson-flame",
        },
        parentId: null,
        content: "This chapter was absolutely crazy! The ending fight sequence had top tier art.",
        status: "visible",
        moderationStatus: "approved",
        edited: false,
        replyCount: 1,
        deletedAt: null,
        createdAt: new Date(Date.now() - 3600000 * 3),
        updatedAt: new Date(Date.now() - 3600000 * 3),
      });

      // Seed nested reply
      await db.collection("comments").insertOne({
        siteId: "mist-scans",
        pageId: "lookism-500",
        userId: "user-daniel",
        author: {
          id: "user-daniel",
          username: "daniel_park",
          displayName: "Daniel Park",
          avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=daniel",
          avatarDecoration: "neon-cyan",
        },
        parentId: comment1Res.insertedId.toString(),
        content: "Totally agree! Can't wait to see what happens next chapter.",
        status: "visible",
        moderationStatus: "approved",
        edited: false,
        replyCount: 0,
        deletedAt: null,
        createdAt: new Date(Date.now() - 3600000 * 2),
        updatedAt: new Date(Date.now() - 3600000 * 2),
      });

      console.log("[Seed] Completed initial data seeding.");
    }
  } catch (err) {
    console.error("[Seed] Error during seeding:", err);
  }
}

const port = Number(process.env.PORT) || 3000;

seedInitialData().then(() => {
  serve(
    {
      fetch: app.fetch,
      port,
    },
    (info) => {
      console.log(`[Threadly API] Server listening at http://localhost:${info.port}`);
    }
  );
});

export default app;
