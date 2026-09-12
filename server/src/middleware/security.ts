import { MiddlewareHandler } from "hono";

export const securityHeaders = (): MiddlewareHandler => {
  return async (c, next) => {
    c.header("X-Content-Type-Options", "nosniff");
    c.header("X-XSS-Protection", "1; mode=block");
    c.header("Referrer-Policy", "strict-origin-when-cross-origin");
    c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

    // Prevent caching on authenticated API routes
    if (c.req.path.startsWith("/api/")) {
      c.header("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      c.header("Pragma", "no-cache");
      c.header("Expires", "0");
    }

    await next();
  };
};

// Protect against NoSQL injection by sanitizing keys with $ or .
export const sanitizeInput = (obj: any): any => {
  if (obj === null || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizeInput);
  }

  const cleaned: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    // Drop keys starting with $ (MongoDB operator injection)
    if (key.startsWith("$") || key.includes(".")) {
      continue;
    }
    cleaned[key] = sanitizeInput(obj[key]);
  }
  return cleaned;
};

export const noSqlInjectionProtection = (): MiddlewareHandler => {
  return async (c, next) => {
    const query = c.req.query();
    for (const [key, value] of Object.entries(query)) {
      if (typeof value === "object" || key.startsWith("$")) {
        return c.json(
          { success: false, error: { code: "INVALID_INPUT", message: "Malicious query parameter detected." } },
          400
        );
      }
    }
    await next();
  };
};
