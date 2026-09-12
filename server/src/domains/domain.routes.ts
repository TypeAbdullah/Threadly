import { Hono } from "hono";
import { requireAuth } from "../middleware/auth.js";
import { rateLimiter } from "../middleware/rate-limiter.js";
import { getDomainService } from "./domain.service.js";
import { DomainError } from "./domain.errors.js";

export const domainRouter = new Hono();

// Helper to handle DomainError gracefully
const handleError = (c: any, err: any) => {
  if (err instanceof DomainError) {
    return c.json(
      {
        success: false,
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
        },
      },
      err.status as any
    );
  }
  console.error("[Domain Route Unexpected Error]", err);
  return c.json(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred while processing domain request",
      },
    },
    500
  );
};

// -------------------------------------------------------------
// Public Domain Resolution
// -------------------------------------------------------------
// GET /api/v1/domains/resolve?hostname=comments.mysite.com
domainRouter.get(
  "/domains/resolve",
  rateLimiter({ max: 300, windowMs: 60 * 1000 }),
  async (c) => {
    try {
      const hostname = c.req.query("hostname");
      if (!hostname) {
        return c.json(
          {
            success: false,
            error: { code: "INVALID_REQUEST", message: "Query parameter 'hostname' is required" },
          },
          400
        );
      }

      const domainService = await getDomainService();
      const resolved = await domainService.getResolver().resolveHostname(hostname);
      if (!resolved) {
        return c.json(
          {
            success: false,
            error: { code: "NOT_FOUND", message: `Hostname '${hostname}' is not configured or not active` },
          },
          404
        );
      }

      return c.json({
        success: true,
        data: resolved,
      });
    } catch (err) {
      return handleError(c, err);
    }
  }
);

// -------------------------------------------------------------
// Subdomain Endpoints
// -------------------------------------------------------------
// GET /api/v1/sites/:siteId/subdomain/availability?subdomain=my-manga
domainRouter.get(
  "/sites/:siteId/subdomain/availability",
  requireAuth(),
  rateLimiter({ max: 60, windowMs: 60 * 1000 }),
  async (c) => {
    try {
      const subdomain = c.req.query("subdomain") || "";
      const domainService = await getDomainService();
      const result = await domainService.checkSubdomainAvailability(subdomain);
      return c.json({
        success: true,
        data: result,
      });
    } catch (err) {
      return handleError(c, err);
    }
  }
);

// POST /api/v1/sites/:siteId/subdomain - Claim or auto-generate Threadly subdomain
domainRouter.post(
  "/sites/:siteId/subdomain",
  requireAuth(),
  rateLimiter({ max: 15, windowMs: 60 * 1000 }),
  async (c) => {
    try {
      const siteId = c.req.param("siteId");
      const user = c.get("user")!;
      let body: any = {};
      try {
        body = await c.req.json();
      } catch {
        // Body can be empty for auto-generation from site name
      }

      const domainService = await getDomainService();
      const domain = await domainService.provisionSubdomain(siteId, user.id, body?.subdomain);
      return c.json(
        {
          success: true,
          hostname: domain.hostname,
          status: domain.status,
          data: domain,
        },
        201
      );
    } catch (err) {
      return handleError(c, err);
    }
  }
);

// -------------------------------------------------------------
// Custom Domain Endpoints
// -------------------------------------------------------------
// GET /api/v1/sites/:siteId/domains - List all domains for site
domainRouter.get("/sites/:siteId/domains", requireAuth(), async (c) => {
  try {
    const siteId = c.req.param("siteId");
    const domainService = await getDomainService();
    const domains = await domainService.getSiteDomains(siteId);
    return c.json({
      success: true,
      data: {
        items: domains,
      },
    });
  } catch (err) {
    return handleError(c, err);
  }
});

// POST /api/v1/sites/:siteId/domains - Add custom domain
domainRouter.post(
  "/sites/:siteId/domains",
  requireAuth(),
  rateLimiter({ max: 20, windowMs: 60 * 1000 }),
  async (c) => {
    try {
      const siteId = c.req.param("siteId");
      const user = c.get("user")!;
      const body = await c.req.json();

      if (!body?.hostname) {
        return c.json(
          {
            success: false,
            error: { code: "INVALID_REQUEST", message: "Field 'hostname' is required" },
          },
          400
        );
      }

      const domainService = await getDomainService();
      const domain = await domainService.addCustomDomain(siteId, user.id, body.hostname);
      return c.json(
        {
          success: true,
          id: domain.id,
          hostname: domain.hostname,
          type: domain.type,
          status: domain.status,
          verification: domain.dnsRecords,
          data: domain,
        },
        201
      );
    } catch (err) {
      return handleError(c, err);
    }
  }
);

// GET /api/v1/sites/:siteId/domains/:domainId - Single domain details
domainRouter.get("/sites/:siteId/domains/:domainId", requireAuth(), async (c) => {
  try {
    const siteId = c.req.param("siteId");
    const domainId = c.req.param("domainId");
    const domainService = await getDomainService();
    const domain = await domainService.getDomainById(siteId, domainId);
    if (!domain) {
      return c.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Domain not found for this site" },
        },
        404
      );
    }
    return c.json({
      success: true,
      data: domain,
    });
  } catch (err) {
    return handleError(c, err);
  }
});

// POST /api/v1/sites/:siteId/domains/:domainId/verify - Query Cloudflare for verification
domainRouter.post(
  "/sites/:siteId/domains/:domainId/verify",
  requireAuth(),
  rateLimiter({ max: 30, windowMs: 60 * 1000 }),
  async (c) => {
    try {
      const siteId = c.req.param("siteId");
      const domainId = c.req.param("domainId");
      const user = c.get("user")!;

      const domainService = await getDomainService();
      const updated = await domainService.verifyCustomDomain(siteId, domainId, user.id);
      return c.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      return handleError(c, err);
    }
  }
);

// POST /api/v1/sites/:siteId/domains/:domainId/set-primary
domainRouter.post(
  "/sites/:siteId/domains/:domainId/set-primary",
  requireAuth(),
  rateLimiter({ max: 20, windowMs: 60 * 1000 }),
  async (c) => {
    try {
      const siteId = c.req.param("siteId");
      const domainId = c.req.param("domainId");
      const user = c.get("user")!;

      const domainService = await getDomainService();
      const updated = await domainService.setPrimaryDomain(siteId, domainId, user.id);
      return c.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      return handleError(c, err);
    }
  }
);

// DELETE /api/v1/sites/:siteId/domains/:domainId
domainRouter.delete(
  "/sites/:siteId/domains/:domainId",
  requireAuth(),
  rateLimiter({ max: 20, windowMs: 60 * 1000 }),
  async (c) => {
    try {
      const siteId = c.req.param("siteId");
      const domainId = c.req.param("domainId");
      const user = c.get("user")!;

      const domainService = await getDomainService();
      await domainService.removeDomain(siteId, domainId, user.id);
      return c.json({
        success: true,
        message: "Domain disconnected successfully",
      });
    } catch (err) {
      return handleError(c, err);
    }
  }
);

// -------------------------------------------------------------
// Admin Endpoints
// -------------------------------------------------------------
// GET /api/v1/admin/domains - List all domains across sites
domainRouter.get("/admin/domains", requireAuth(), async (c) => {
  try {
    const user = c.get("user")!;
    if (user.role !== "admin" && user.role !== "superadmin") {
      return c.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Admin privileges required" },
        },
        403
      );
    }

    const status = c.req.query("status") as any;
    const type = c.req.query("type");
    const search = c.req.query("search");
    const limit = Number(c.req.query("limit")) || 50;
    const skip = Number(c.req.query("skip")) || 0;

    const domainService = await getDomainService();
    const result = await domainService.adminGetAllDomains({
      status,
      type,
      search,
      limit,
      skip,
    });

    return c.json({
      success: true,
      data: result,
    });
  } catch (err) {
    return handleError(c, err);
  }
});

// POST /api/v1/admin/domains/:domainId/disable
domainRouter.post("/admin/domains/:domainId/disable", requireAuth(), async (c) => {
  try {
    const user = c.get("user")!;
    if (user.role !== "admin" && user.role !== "superadmin") {
      return c.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Admin privileges required" },
        },
        403
      );
    }

    const domainId = c.req.param("domainId");
    const domainService = await getDomainService();
    const updated = await domainService.adminDisableDomain(domainId, user.id);
    return c.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    return handleError(c, err);
  }
});
