import { MiddlewareHandler } from "hono";
import { getSessionUser } from "../auth/index.js";
import { ThreadlyUser } from "@threadly/types";

declare module "hono" {
  interface ContextVariableMap {
    user: ThreadlyUser | null;
  }
}

export const authMiddleware = (): MiddlewareHandler => {
  return async (c, next) => {
    try {
      const user = await getSessionUser(c.req.raw);
      c.set("user", user);
    } catch {
      c.set("user", null);
    }
    await next();
  };
};

export const requireAuth = (): MiddlewareHandler => {
  return async (c, next) => {
    const user = c.get("user");
    if (!user) {
      return c.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required to perform this action",
          },
        },
        401
      );
    }
    await next();
  };
};
