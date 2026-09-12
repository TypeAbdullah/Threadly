import { Hono } from "hono";
import { ObjectId } from "mongodb";
import { getDb } from "../database/index.js";
import { requireAuth } from "../middleware/auth.js";
import { updateProfileSchema } from "@threadly/validation";
import { formatUser } from "../auth/index.js";

export const usersRouter = new Hono();

// GET /api/v1/users/me/profile
usersRouter.get("/me/profile", requireAuth(), async (c) => {
  const user = c.get("user")!;
  return c.json({ success: true, data: user });
});

// PATCH /api/v1/users/me/profile - Update display name, username, bio, decoration
usersRouter.patch("/me/profile", requireAuth(), async (c) => {
  const db = await getDb();
  const user = c.get("user")!;
  const body = await c.req.json();

  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      {
        success: false,
        error: { code: "INVALID_CONFIG", message: parsed.error.errors[0].message },
      },
      400
    );
  }

  const { displayName, username, bio, avatarDecoration } = parsed.data;

  // Check if username is already taken by another user
  const existingWithUsername = await db.collection("users").findOne({
    username: username.toLowerCase(),
    _id: { $ne: new ObjectId(user.id) },
  });

  if (existingWithUsername) {
    return c.json(
      {
        success: false,
        error: { code: "USERNAME_TAKEN", message: `Username @${username} is already taken.` },
      },
      400
    );
  }

  await db.collection("users").updateOne(
    { _id: new ObjectId(user.id) },
    {
      $set: {
        displayName,
        username: username.toLowerCase(),
        bio: bio || "",
        avatarDecoration: avatarDecoration || "none",
        updatedAt: new Date(),
      },
    }
  );

  const updatedUserDoc = await db.collection("users").findOne({ _id: new ObjectId(user.id) });
  return c.json({ success: true, data: formatUser(updatedUserDoc) });
});

// GET /api/v1/users/me/comments - "My Comments" across all Threadly sites
usersRouter.get("/me/comments", requireAuth(), async (c) => {
  const db = await getDb();
  const user = c.get("user")!;

  const comments = await db
    .collection("comments")
    .find({ userId: user.id, parentId: null, status: { $ne: "deleted" } })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  // Attach site and page info
  const siteIds = [...new Set(comments.map((c) => c.siteId))];
  const sites = await db
    .collection("sites")
    .find({ siteId: { $in: siteIds } })
    .toArray();
  const sitesMap = new Map(sites.map((s) => [s.siteId, s]));

  const enriched = comments.map((c) => {
    const site = sitesMap.get(c.siteId);
    return {
      id: c._id.toString(),
      siteId: c.siteId,
      siteName: site?.name || c.siteId,
      pageId: c.pageId,
      pageUrl: c.pageUrl || `https://${c.siteId}.example/${c.pageId}`,
      content: c.content,
      replyCount: c.replyCount || 0,
      moderationStatus: c.moderationStatus,
      createdAt: new Date(c.createdAt).toISOString(),
    };
  });

  return c.json({ success: true, data: { items: enriched } });
});

// GET /api/v1/users/me/replies - "My Replies"
usersRouter.get("/me/replies", requireAuth(), async (c) => {
  const db = await getDb();
  const user = c.get("user")!;

  const replies = await db
    .collection("comments")
    .find({ userId: user.id, parentId: { $ne: null }, status: { $ne: "deleted" } })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  return c.json({
    success: true,
    data: {
      items: replies.map((r) => ({
        id: r._id.toString(),
        siteId: r.siteId,
        pageId: r.pageId,
        parentId: r.parentId,
        content: r.content,
        replyCount: r.replyCount || 0,
        createdAt: new Date(r.createdAt).toISOString(),
      })),
    },
  });
});

// GET /api/v1/users/me/notifications
usersRouter.get("/me/notifications", requireAuth(), async (c) => {
  const db = await getDb();
  const user = c.get("user")!;

  const notifications = await db
    .collection("notifications")
    .find({ userId: user.id })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  return c.json({
    success: true,
    data: {
      items: notifications.map((n) => ({
        id: n._id.toString(),
        userId: n.userId,
        type: n.type,
        title: n.title,
        body: n.body,
        read: n.read || false,
        data: n.data,
        createdAt: new Date(n.createdAt).toISOString(),
      })),
    },
  });
});

// PATCH /api/v1/users/me/notifications/:id/read
usersRouter.patch("/me/notifications/:id/read", requireAuth(), async (c) => {
  const db = await getDb();
  const id = c.req.param("id");
  const user = c.get("user")!;

  await db.collection("notifications").updateOne(
    { _id: new ObjectId(id), userId: user.id },
    { $set: { read: true, updatedAt: new Date() } }
  );

  return c.json({ success: true, data: { success: true } });
});
