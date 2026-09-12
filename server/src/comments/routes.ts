import { Hono } from "hono";
import { ObjectId } from "mongodb";
import { getDb } from "../database/index.js";
import { requireAuth } from "../middleware/auth.js";
import { createCommentSchema, updateCommentSchema } from "@threadly/validation";
import { runModerationPipeline } from "../moderation/index.js";
import { Comment, PaginationResult } from "@threadly/types";

export const commentsRouter = new Hono();

// Helper to normalize and ensure page exists
async function ensurePage(db: any, siteId: string, pageId?: string, pageUrl?: string) {
  const resolvedPageId = pageId || (pageUrl ? new URL(pageUrl).pathname.replace(/\/+$/, "") || "root" : "default");
  const normalizedUrl = pageUrl || `https://${siteId}.example/${resolvedPageId}`;

  const existing = await db.collection("pages").findOne({ siteId, pageId: resolvedPageId });
  if (!existing) {
    await db.collection("pages").insertOne({
      siteId,
      pageId: resolvedPageId,
      url: normalizedUrl,
      title: resolvedPageId.replace(/[-_]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      commentCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  return resolvedPageId;
}

// GET /api/v1/sites/:siteId/comments - List comments with cursor pagination & sorting
commentsRouter.get("/sites/:siteId/comments", async (c) => {
  const db = await getDb();
  const siteId = c.req.param("siteId");
  const pageId = c.req.query("pageId");
  const pageUrl = c.req.query("pageUrl");
  const cursor = c.req.query("cursor");
  const limit = Math.min(50, Math.max(1, parseInt(c.req.query("limit") || "20", 10)));
  const sort = (c.req.query("sort") || "best") as "best" | "newest" | "oldest";

  const resolvedPageId = pageId || (pageUrl ? new URL(pageUrl).pathname.replace(/\/+$/, "") || "root" : undefined);

  const query: any = {
    siteId,
    parentId: null, // Only top-level root comments for primary thread list
    status: { $ne: "deleted" },
    moderationStatus: { $ne: "rejected" },
  };

  if (resolvedPageId) {
    query.pageId = resolvedPageId;
  }

  // Cursor pagination filter
  if (cursor) {
    try {
      const cursorObj = JSON.parse(Buffer.from(cursor, "base64").toString("utf-8"));
      if (sort === "newest" && cursorObj.createdAt) {
        query.createdAt = { $lt: new Date(cursorObj.createdAt) };
      } else if (sort === "oldest" && cursorObj.createdAt) {
        query.createdAt = { $gt: new Date(cursorObj.createdAt) };
      } else if (cursorObj._id) {
        query._id = { $lt: new ObjectId(cursorObj._id) };
      }
    } catch {
      // Invalid cursor ignored
    }
  }

  let sortCriteria: any = { createdAt: -1 };
  if (sort === "oldest") {
    sortCriteria = { createdAt: 1 };
  }

  const rawComments = await db
    .collection("comments")
    .find(query)
    .sort(sortCriteria)
    .limit(limit + 1)
    .toArray();

  const hasMore = rawComments.length > limit;
  const items = hasMore ? rawComments.slice(0, limit) : rawComments;

  // Compute "best" ranking if requested
  if (sort === "best") {
    const now = Date.now();
    items.sort((a, b) => {
      const ageHoursA = Math.max(0.1, (now - new Date(a.createdAt).getTime()) / 3600000);
      const ageHoursB = Math.max(0.1, (now - new Date(b.createdAt).getTime()) / 3600000);
      const scoreA = (a.replyCount || 0) / Math.pow(ageHoursA + 2, 1.2);
      const scoreB = (b.replyCount || 0) / Math.pow(ageHoursB + 2, 1.2);
      return scoreB - scoreA;
    });
  }

  // Fetch top 3 replies for each root comment inline
  const rootIds = items.map((c) => c._id.toString());
  const replies = await db
    .collection("comments")
    .find({
      parentId: { $in: rootIds },
      status: { $ne: "deleted" },
      moderationStatus: { $ne: "rejected" },
    })
    .sort({ createdAt: 1 })
    .toArray();

  const repliesByParent: Record<string, any[]> = {};
  for (const r of replies) {
    if (!repliesByParent[r.parentId]) repliesByParent[r.parentId] = [];
    repliesByParent[r.parentId].push(formatCommentDoc(r));
  }

  const formattedItems: Comment[] = items.map((doc) => {
    const formatted = formatCommentDoc(doc);
    formatted.replies = repliesByParent[formatted.id] || [];
    return formatted;
  });

  let nextCursor: string | null = null;
  if (hasMore && items.length > 0) {
    const lastItem = items[items.length - 1];
    nextCursor = Buffer.from(
      JSON.stringify({ _id: lastItem._id.toString(), createdAt: lastItem.createdAt })
    ).toString("base64");
  }

  return c.json({
    success: true,
    data: {
      items: formattedItems,
      nextCursor,
      hasMore,
    },
  });
});

// POST /api/v1/sites/:siteId/comments - Create comment or reply
commentsRouter.post("/sites/:siteId/comments", requireAuth(), async (c) => {
  const db = await getDb();
  const siteId = c.req.param("siteId");
  const user = c.get("user")!;

  // 1. Check if user is banned or muted on this site
  const member = await db.collection("siteMembers").findOne({ siteId, userId: user.id });
  if (member && (member.status === "banned" || member.status === "muted")) {
    return c.json(
      {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: member.status === "banned" ? "You have been banned from commenting on this site." : "You are currently muted on this site.",
        },
      },
      403
    );
  }

  // 2. Validate payload
  const body = await c.req.json();
  const parsed = createCommentSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      {
        success: false,
        error: {
          code: "INVALID_CONFIG",
          message: parsed.error.errors[0].message,
        },
      },
      400
    );
  }

  const { content, parentId, pageId, pageUrl } = parsed.data;
  const resolvedPageId = await ensurePage(db, siteId, pageId, pageUrl);

  // 3. Duplicate check (prevent spamming same comment within 60 seconds)
  const recentDuplicate = await db.collection("comments").findOne({
    siteId,
    userId: user.id,
    content: content.trim(),
    createdAt: { $gt: new Date(Date.now() - 60000) },
  });
  if (recentDuplicate) {
    return c.json(
      {
        success: false,
        error: {
          code: "RATE_LIMITED",
          message: "You submitted this exact comment recently. Please wait before posting again.",
        },
      },
      429
    );
  }

  // 4. Moderation check
  const site = await db.collection("sites").findOne({ siteId });
  const modResult = await runModerationPipeline(content, {
    profanityFilterEnabled: site?.settings?.profanityFilterEnabled ?? true,
    spamFilterEnabled: site?.settings?.spamFilterEnabled ?? true,
  });

  if (modResult.decision === "rejected") {
    return c.json(
      {
        success: false,
        error: {
          code: "CONTENT_REJECTED",
          message: modResult.reason || "Your comment was rejected by automatic moderation filters.",
        },
      },
      400
    );
  }

  // 5. Insert comment
  const newCommentDoc: any = {
    siteId,
    pageId: resolvedPageId,
    userId: user.id,
    author: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      avatarDecoration: user.avatarDecoration,
    },
    parentId: parentId || null,
    content: content.trim(),
    status: modResult.decision === "pending" ? "hidden" : "visible",
    moderationStatus: modResult.decision,
    moderationDetails: {
      flaggedCategories: modResult.flaggedCategories,
      reason: modResult.reason,
      autoModerated: true,
    },
    edited: false,
    deletedAt: null,
    replyCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const insertResult = await db.collection("comments").insertOne(newCommentDoc);
  newCommentDoc._id = insertResult.insertedId;

  // Increment parent comment reply count if it's a reply
  if (parentId) {
    await db.collection("comments").updateOne(
      { _id: new ObjectId(parentId) },
      { $inc: { replyCount: 1 } }
    );

    // Notify parent comment author
    const parentComment = await db.collection("comments").findOne({ _id: new ObjectId(parentId) });
    if (parentComment && parentComment.userId !== user.id) {
      await db.collection("notifications").insertOne({
        userId: parentComment.userId,
        type: "reply",
        title: `${user.displayName} replied to your comment`,
        body: content.slice(0, 100),
        read: false,
        data: { siteId, pageId: resolvedPageId, commentId: insertResult.insertedId.toString() },
        createdAt: new Date(),
      });
    }
  }

  // Increment page commentCount
  await db.collection("pages").updateOne(
    { siteId, pageId: resolvedPageId },
    { $inc: { commentCount: 1 }, $set: { updatedAt: new Date() } }
  );

  return c.json({
    success: true,
    data: formatCommentDoc(newCommentDoc),
  });
});

// GET /api/v1/comments/:commentId/replies
commentsRouter.get("/comments/:commentId/replies", async (c) => {
  const db = await getDb();
  const commentId = c.req.param("commentId");
  const limit = Math.min(50, Math.max(1, parseInt(c.req.query("limit") || "20", 10)));

  const replies = await db
    .collection("comments")
    .find({
      parentId: commentId,
      status: { $ne: "deleted" },
      moderationStatus: { $ne: "rejected" },
    })
    .sort({ createdAt: 1 })
    .limit(limit)
    .toArray();

  return c.json({
    success: true,
    data: {
      items: replies.map(formatCommentDoc),
      hasMore: replies.length === limit,
    },
  });
});

// PATCH /api/v1/comments/:commentId - Edit comment
commentsRouter.patch("/comments/:commentId", requireAuth(), async (c) => {
  const db = await getDb();
  const commentId = c.req.param("commentId");
  const user = c.get("user")!;

  const existing = await db.collection("comments").findOne({ _id: new ObjectId(commentId) });
  if (!existing) {
    return c.json({ success: false, error: { code: "NOT_FOUND", message: "Comment not found" } }, 404);
  }

  if (existing.userId !== user.id) {
    return c.json({ success: false, error: { code: "FORBIDDEN", message: "You can only edit your own comments" } }, 403);
  }

  const body = await c.req.json();
  const parsed = updateCommentSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: { code: "INVALID_CONFIG", message: parsed.error.errors[0].message } }, 400);
  }

  await db.collection("comments").updateOne(
    { _id: new ObjectId(commentId) },
    {
      $set: {
        content: parsed.data.content.trim(),
        edited: true,
        updatedAt: new Date(),
      },
    }
  );

  const updated = await db.collection("comments").findOne({ _id: new ObjectId(commentId) });
  return c.json({ success: true, data: formatCommentDoc(updated) });
});

// DELETE /api/v1/comments/:commentId - Soft delete comment
commentsRouter.delete("/comments/:commentId", requireAuth(), async (c) => {
  const db = await getDb();
  const commentId = c.req.param("commentId");
  const user = c.get("user")!;

  const existing = await db.collection("comments").findOne({ _id: new ObjectId(commentId) });
  if (!existing) {
    return c.json({ success: false, error: { code: "NOT_FOUND", message: "Comment not found" } }, 404);
  }

  // Check if site admin or comment author
  const siteMember = await db.collection("siteMembers").findOne({ siteId: existing.siteId, userId: user.id });
  const isSiteMod = siteMember && (siteMember.role === "owner" || siteMember.role === "admin" || siteMember.role === "moderator");

  if (existing.userId !== user.id && !isSiteMod) {
    return c.json({ success: false, error: { code: "FORBIDDEN", message: "Unauthorized to delete this comment" } }, 403);
  }

  await db.collection("comments").updateOne(
    { _id: new ObjectId(commentId) },
    {
      $set: {
        status: "deleted",
        content: "[Comment deleted]",
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    }
  );

  return c.json({ success: true, data: { success: true } });
});

function formatCommentDoc(doc: any): Comment {
  return {
    id: doc._id.toString(),
    siteId: doc.siteId,
    pageId: doc.pageId,
    userId: doc.userId,
    author: doc.author,
    parentId: doc.parentId,
    content: doc.content,
    status: doc.status,
    moderationStatus: doc.moderationStatus,
    moderationDetails: doc.moderationDetails,
    edited: doc.edited || false,
    deletedAt: doc.deletedAt ? new Date(doc.deletedAt).toISOString() : null,
    replyCount: doc.replyCount || 0,
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}
