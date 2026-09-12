import { MiddlewareHandler } from "hono";
import { getDb } from "../database/index.js";

export const dynamicCors = (): MiddlewareHandler => {
  return async (c, next) => {
    const origin = c.req.header("Origin");
    const method = c.req.method;

    // Handle preflight requests
    if (method === "OPTIONS") {
      c.header("Access-Control-Allow-Origin", origin || "*");
      c.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
      c.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Threadly-Site-Id, X-Threadly-User-Id");
      c.header("Access-Control-Allow-Credentials", "true");
      return c.body(null, 204);
    }

    // Default headers
    if (origin) {
      c.header("Access-Control-Allow-Origin", origin);
      c.header("Access-Control-Allow-Credentials", "true");
    } else {
      c.header("Access-Control-Allow-Origin", "*");
    }
    c.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Threadly-Site-Id, X-Threadly-User-Id");

    // For site-specific endpoints, validate against site.allowedOrigins
    const siteId = c.req.param("siteId") || c.req.header("X-Threadly-Site-Id");
    if (siteId && origin && !origin.includes("localhost") && !origin.includes("127.0.0.1")) {
      const db = await getDb();
      const site = await db.collection("sites").findOne({ siteId });
      if (site && site.allowedOrigins && site.allowedOrigins.length > 0) {
        const isAllowed = site.allowedOrigins.some((allowed: string) => {
          try {
            const allowedUrl = new URL(allowed);
            const requestUrl = new URL(origin);
            return allowedUrl.host === requestUrl.host;
          } catch {
            return allowed === origin || allowed === "*";
          }
        });

        if (!isAllowed) {
          return c.json(
            {
              success: false,
              error: {
                code: "FORBIDDEN_ORIGIN",
                message: `Origin ${origin} is not allowed for site ${siteId}`,
              },
            },
            403
          );
        }
      }
    }

    await next();
  };
};
