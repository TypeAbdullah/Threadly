import { Hono } from "hono";
import { ObjectId } from "mongodb";
import { getDb } from "../database/index.js";
import { requireAuth } from "../middleware/auth.js";
import { createReportSchema } from "@threadly/validation";

export const reportsRouter = new Hono();

// POST /api/v1/comments/:commentId/reports
reportsRouter.post("/comments/:commentId/reports", requireAuth(), async (c) => {
  const db = await getDb();
  const commentId = c.req.param("commentId");
  const user = c.get("user")!;

  const body = await c.req.json();
  const parsed = createReportSchema.safeParse({ ...body, commentId });
  if (!parsed.success) {
    return c.json(
      {
        success: false,
        error: { code: "INVALID_CONFIG", message: parsed.error.errors[0].message },
      },
      400
    );
  }

  const comment = await db.collection("comments").findOne({ _id: new ObjectId(commentId) });
  if (!comment) {
    return c.json({ success: false, error: { code: "NOT_FOUND", message: "Comment not found" } }, 404);
  }

  // Check for duplicate report by same user to prevent abuse
  const existing = await db.collection("reports").findOne({ commentId, userId: user.id });
  if (existing) {
    return c.json(
      {
        success: false,
        error: { code: "DUPLICATE_REPORT", message: "You have already reported this comment." },
      },
      400
    );
  }

  const reportDoc = {
    commentId,
    siteId: comment.siteId,
    userId: user.id,
    reporter: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
    },
    reason: parsed.data.reason,
    details: parsed.data.details || "",
    status: "pending",
    commentSnippet: comment.content.slice(0, 150),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection("reports").insertOne(reportDoc);

  return c.json({
    success: true,
    data: { success: true, id: result.insertedId.toString() },
  });
});
