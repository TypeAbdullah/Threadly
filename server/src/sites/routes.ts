import { Hono } from "hono";
import { ObjectId } from "mongodb";
import crypto from "crypto";
import { getDb } from "../database/index.js";
import { requireAuth } from "../middleware/auth.js";
import { createSiteSchema, updateSiteSchema } from "@threadly/validation";

export const sitesRouter = new Hono();

// GET /api/v1/sites - List sites owned by current user
sitesRouter.get("/sites", requireAuth(), async (c) => {
  const db = await getDb();
  const user = c.get("user")!;

  const sites = await db
    .collection("sites")
    .find({ ownerId: user.id })
    .sort({ createdAt: -1 })
    .toArray();

  return c.json({
    success: true,
    data: {
      items: sites.map((s) => ({
        id: s._id.toString(),
        siteId: s.siteId,
        name: s.name,
        allowedOrigins: s.allowedOrigins || [],
        publicKey: s.publicKey,
        settings: s.settings,
        createdAt: new Date(s.createdAt).toISOString(),
      })),
    },
  });
});

// POST /api/v1/sites - Create a new Site
sitesRouter.post("/sites", requireAuth(), async (c) => {
  const db = await getDb();
  const user = c.get("user")!;
  const body = await c.req.json();

  const parsed = createSiteSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      {
        success: false,
        error: { code: "INVALID_CONFIG", message: parsed.error.errors[0].message },
      },
      400
    );
  }

  const { name, siteId, allowedOrigins } = parsed.data;

  // Check unique siteId
  const existing = await db.collection("sites").findOne({ siteId });
  if (existing) {
    return c.json(
      {
        success: false,
        error: { code: "SITE_ID_EXISTS", message: `Site ID "${siteId}" is already taken.` },
      },
      400
    );
  }

  const publicKey = `pk_${crypto.randomBytes(16).toString("hex")}`;
  const privateKey = `sk_${crypto.randomBytes(24).toString("hex")}`;
  const privateKeyHash = crypto.createHash("sha256").update(privateKey).digest("hex");

  const newSite = {
    siteId,
    name,
    allowedOrigins,
    publicKey,
    privateKeyHash,
    ownerId: user.id,
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
  };

  const insertResult = await db.collection("sites").insertOne(newSite);

  // Add owner to siteMembers
  await db.collection("siteMembers").insertOne({
    siteId,
    userId: user.id,
    role: "owner",
    status: "active",
    createdAt: new Date(),
  });

  return c.json({
    success: true,
    data: {
      id: insertResult.insertedId.toString(),
      siteId,
      name,
      allowedOrigins,
      publicKey,
      privateKey, // Only shown once upon creation!
      settings: newSite.settings,
      createdAt: newSite.createdAt.toISOString(),
    },
  });
});

// GET /api/v1/sites/:siteId - Get site details
sitesRouter.get("/sites/:siteId", async (c) => {
  const db = await getDb();
  const siteId = c.req.param("siteId");

  const site = await db.collection("sites").findOne({ siteId });
  if (!site) {
    return c.json({ success: false, error: { code: "NOT_FOUND", message: "Site not found" } }, 404);
  }

  return c.json({
    success: true,
    data: {
      id: site._id.toString(),
      siteId: site.siteId,
      name: site.name,
      allowedOrigins: site.allowedOrigins || [],
      publicKey: site.publicKey,
      settings: site.settings,
      createdAt: new Date(site.createdAt).toISOString(),
    },
  });
});

// GET /api/v1/sites/:siteId/pages - List pages in site
sitesRouter.get("/sites/:siteId/pages", async (c) => {
  const db = await getDb();
  const siteId = c.req.param("siteId");
  const query = c.req.query("q") || "";

  const filter: any = { siteId };
  if (query) {
    filter.$or = [
      { pageId: { $regex: query, $options: "i" } },
      { title: { $regex: query, $options: "i" } },
      { url: { $regex: query, $options: "i" } },
    ];
  }

  const pages = await db
    .collection("pages")
    .find(filter)
    .sort({ commentCount: -1, updatedAt: -1 })
    .limit(50)
    .toArray();

  return c.json({
    success: true,
    data: {
      items: pages.map((p) => ({
        id: p._id.toString(),
        siteId: p.siteId,
        pageId: p.pageId,
        url: p.url,
        title: p.title,
        commentCount: p.commentCount || 0,
        createdAt: new Date(p.createdAt).toISOString(),
        updatedAt: new Date(p.updatedAt).toISOString(),
      })),
    },
  });
});
