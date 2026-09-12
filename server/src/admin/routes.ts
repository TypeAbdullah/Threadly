import { Hono } from "hono";
import { ObjectId } from "mongodb";
import { getDb } from "../database/index.js";
import { requireAuth } from "../middleware/auth.js";

export const adminRouter = new Hono();

// GET /api/v1/admin/sites/:siteId/metrics - Dashboard analytics
adminRouter.get("/sites/:siteId/metrics", requireAuth(), async (c) => {
  const db = await getDb();
  const siteId = c.req.param("siteId");

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalComments,
    totalPages,
    commentsToday,
    commentsThisWeek,
    repliesCount,
    pendingModeration,
    openReports,
    blockedSpam,
  ] = await Promise.all([
    db.collection("comments").countDocuments({ siteId, status: { $ne: "deleted" } }),
    db.collection("pages").countDocuments({ siteId }),
    db.collection("comments").countDocuments({ siteId, createdAt: { $gte: startOfToday } }),
    db.collection("comments").countDocuments({ siteId, createdAt: { $gte: oneWeekAgo } }),
    db.collection("comments").countDocuments({ siteId, parentId: { $ne: null }, status: { $ne: "deleted" } }),
    db.collection("comments").countDocuments({ siteId, moderationStatus: "pending" }),
    db.collection("reports").countDocuments({ siteId, status: "pending" }),
    db.collection("comments").countDocuments({ siteId, moderationStatus: "rejected" }),
  ]);

  const activeCommenters = await db.collection("comments").distinct("userId", {
    siteId,
    createdAt: { $gte: oneWeekAgo },
  });

  return c.json({
    success: true,
    data: {
      totalComments,
      totalPages,
      commentsToday,
      commentsThisWeek,
      activeCommentersCount: activeCommenters.length,
      repliesCount,
      pendingModeration,
      openReports,
      blockedSpam,
    },
  });
});

// GET /api/v1/admin/sites/:siteId/moderation - Pending moderation queue
adminRouter.get("/sites/:siteId/moderation", requireAuth(), async (c) => {
  const db = await getDb();
  const siteId = c.req.param("siteId");

  const pending = await db
    .collection("comments")
    .find({ siteId, moderationStatus: "pending" })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  return c.json({
    success: true,
    data: {
      items: pending.map((p) => ({
        id: p._id.toString(),
        siteId: p.siteId,
        pageId: p.pageId,
        author: p.author,
        content: p.content,
        moderationStatus: p.moderationStatus,
        moderationDetails: p.moderationDetails,
        createdAt: new Date(p.createdAt).toISOString(),
      })),
    },
  });
});

// POST /api/v1/admin/sites/:siteId/moderation/:commentId/:action - Approve/Reject
adminRouter.post("/sites/:siteId/moderation/:commentId/:action", requireAuth(), async (c) => {
  const db = await getDb();
  const commentId = c.req.param("commentId");
  const action = c.req.param("action"); // "approve" or "reject"
  const user = c.get("user")!;

  if (action !== "approve" && action !== "reject") {
    return c.json({ success: false, error: { code: "INVALID_ACTION", message: "Action must be approve or reject" } }, 400);
  }

  const newStatus = action === "approve" ? "approved" : "rejected";
  const commentStatus = action === "approve" ? "visible" : "hidden";

  await db.collection("comments").updateOne(
    { _id: new ObjectId(commentId) },
    {
      $set: {
        moderationStatus: newStatus,
        status: commentStatus,
        updatedAt: new Date(),
      },
    }
  );

  // Audit log
  await db.collection("auditLogs").insertOne({
    siteId: c.req.param("siteId"),
    userId: user.id,
    action: `comment_${action}`,
    targetType: "comment",
    targetId: commentId,
    createdAt: new Date(),
  });

  return c.json({ success: true, data: { success: true } });
});

// GET /api/v1/admin/sites/:siteId/reports - Reports queue
adminRouter.get("/sites/:siteId/reports", requireAuth(), async (c) => {
  const db = await getDb();
  const siteId = c.req.param("siteId");

  const reports = await db
    .collection("reports")
    .find({ siteId, status: "pending" })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  return c.json({
    success: true,
    data: {
      items: reports.map((r) => ({
        id: r._id.toString(),
        commentId: r.commentId,
        siteId: r.siteId,
        reporter: r.reporter,
        reason: r.reason,
        details: r.details,
        commentSnippet: r.commentSnippet,
        status: r.status,
        createdAt: new Date(r.createdAt).toISOString(),
      })),
    },
  });
});

// POST /api/v1/admin/sites/:siteId/reports/:reportId/:action - Resolve/Dismiss
adminRouter.post("/sites/:siteId/reports/:reportId/:action", requireAuth(), async (c) => {
  const db = await getDb();
  const reportId = c.req.param("reportId");
  const action = c.req.param("action"); // "resolve" or "dismiss"
  const user = c.get("user")!;

  const newStatus = action === "resolve" ? "resolved" : "dismissed";
  await db.collection("reports").updateOne(
    { _id: new ObjectId(reportId) },
    { $set: { status: newStatus, updatedAt: new Date() } }
  );

  return c.json({ success: true, data: { success: true } });
});

// POST /api/v1/admin/sites/:siteId/members/:userId/ban
adminRouter.post("/sites/:siteId/members/:userId/ban", requireAuth(), async (c) => {
  const db = await getDb();
  const siteId = c.req.param("siteId");
  const targetUserId = c.req.param("userId");
  const body = await c.req.json().catch(() => ({}));
  const user = c.get("user")!;

  await db.collection("siteMembers").updateOne(
    { siteId, userId: targetUserId },
    {
      $set: {
        siteId,
        userId: targetUserId,
        status: "banned",
        role: "member",
        bannedAt: new Date(),
        reason: body.reason || "Violating community standards",
      },
    },
    { upsert: true }
  );

  await db.collection("auditLogs").insertOne({
    siteId,
    userId: user.id,
    action: "user_banned",
    targetType: "user",
    targetId: targetUserId,
    details: { reason: body.reason },
    createdAt: new Date(),
  });

  return c.json({ success: true, data: { success: true, status: "banned" } });
});

// POST /api/v1/admin/sites/:siteId/members/:userId/unban
adminRouter.post("/sites/:siteId/members/:userId/unban", requireAuth(), async (c) => {
  const db = await getDb();
  const siteId = c.req.param("siteId");
  const targetUserId = c.req.param("userId");

  await db.collection("siteMembers").updateOne(
    { siteId, userId: targetUserId },
    { $set: { status: "active", bannedAt: null } }
  );

  return c.json({ success: true, data: { success: true, status: "active" } });
});
