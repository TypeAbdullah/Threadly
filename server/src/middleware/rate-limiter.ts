import { MiddlewareHandler } from "hono";

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

const store: RateLimitStore = {};

export interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  keyGenerator?: (c: any) => string;
}

export const rateLimiter = (options: RateLimitOptions = {}): MiddlewareHandler => {
  const windowMs = options.windowMs || 60 * 1000; // 1 minute default
  const max = options.max || 60; // 60 requests per window

  return async (c, next) => {
    const key =
      options.keyGenerator?.(c) ||
      c.req.header("cf-connecting-ip") ||
      c.req.header("x-forwarded-for") ||
      "global";

    const now = Date.now();
    const entry = store[key];

    if (!entry || now > entry.resetTime) {
      store[key] = { count: 1, resetTime: now + windowMs };
    } else {
      entry.count++;
      if (entry.count > max) {
        c.header("Retry-After", String(Math.ceil((entry.resetTime - now) / 1000)));
        return c.json(
          {
            success: false,
            error: {
              code: "RATE_LIMITED",
              message: "Too many requests. Please slow down and try again shortly.",
            },
          },
          429
        );
      }
    }

    await next();
  };
};
