import { DomainError } from "./domain.errors.js";

export const DEFAULT_RESERVED_SUBDOMAINS = new Set([
  "www",
  "api",
  "admin",
  "app",
  "docs",
  "cdn",
  "mail",
  "email",
  "smtp",
  "pop",
  "imap",
  "support",
  "help",
  "status",
  "dashboard",
  "login",
  "signin",
  "signup",
  "auth",
  "oauth",
  "blog",
  "billing",
  "account",
  "settings",
  "assets",
  "static",
  "webhook",
  "webhooks",
  "dev",
  "stage",
  "staging",
  "prod",
  "production",
  "test",
  "testing",
  "internal",
  "root",
  "ssl",
  "ns1",
  "ns2",
  "dns",
]);

export const SUBDOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/;
export const HOSTNAME_REGEX = /^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}?$/;

export const normalizeHostname = (input: string): string => {
  if (!input) return "";
  let clean = input.trim().toLowerCase();

  // Strip protocol if mistakenly passed
  clean = clean.replace(/^[a-zA-Z]+:\/\//, "");

  // Strip path, query, hash, port
  clean = clean.split("/")[0].split("?")[0].split("#")[0].split(":")[0];

  // Strip trailing dot
  clean = clean.replace(/\.+$/, "");

  return clean;
};

export const normalizeSubdomain = (input: string): string => {
  if (!input) return "";
  return input
    .trim()
    .toLowerCase()
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-");
};

export const validateSubdomain = (subdomain: string, baseDomain: string = "threadly.com"): string => {
  if (!subdomain) {
    throw new DomainError("Subdomain is required.", { code: "INVALID_SUBDOMAIN", status: 400 });
  }

  const trimmed = subdomain.trim();
  if (/[^a-zA-Z0-9-]/.test(trimmed)) {
    throw new DomainError(
      "Subdomain can only contain lowercase letters, numbers, and hyphens.",
      { code: "INVALID_SUBDOMAIN", status: 400 }
    );
  }

  const normalized = normalizeSubdomain(trimmed);

  if (!normalized || normalized.length < 3) {
    throw new DomainError("Subdomain must be at least 3 characters long.", {
      code: "INVALID_SUBDOMAIN",
      status: 400,
    });
  }

  if (normalized.length > 63) {
    throw new DomainError("Subdomain cannot exceed 63 characters.", {
      code: "INVALID_SUBDOMAIN",
      status: 400,
    });
  }

  if (!SUBDOMAIN_REGEX.test(normalized)) {
    throw new DomainError(
      "Subdomain can only contain lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen.",
      { code: "INVALID_SUBDOMAIN", status: 400 }
    );
  }

  if (DEFAULT_RESERVED_SUBDOMAINS.has(normalized)) {
    throw new DomainError(`"${normalized}" is a reserved Threadly hostname. Please choose another name.`, {
      code: "RESERVED_SUBDOMAIN",
      status: 400,
    });
  }

  return normalized;
};

export const validateCustomHostname = (hostname: string, baseDomain: string = "threadly.com"): string => {
  const normalized = normalizeHostname(hostname);

  if (!normalized || normalized.length < 3) {
    throw new DomainError("Domain hostname is required.", { code: "INVALID_HOSTNAME", status: 400 });
  }

  // Prevent connecting to baseDomain or subdomains through custom domain endpoint
  if (normalized === baseDomain || normalized.endsWith(`.${baseDomain}`)) {
    throw new DomainError(
      `To use a ${baseDomain} subdomain, please use the Subdomain configuration instead of Custom Domain.`,
      { code: "INVALID_HOSTNAME", status: 400 }
    );
  }

  // Reject local/private addresses
  if (
    normalized === "localhost" ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".test") ||
    /^(127\.|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(normalized)
  ) {
    throw new DomainError("Local or private network hostnames cannot be added as public custom domains.", {
      code: "INVALID_HOSTNAME",
      status: 400,
    });
  }

  if (!HOSTNAME_REGEX.test(normalized)) {
    throw new DomainError(
      "Invalid hostname format. Please provide a standard domain or subdomain (e.g. comments.mysite.com).",
      { code: "INVALID_HOSTNAME", status: 400 }
    );
  }

  return normalized;
};

export const generateSubdomainSlug = (siteName: string): string => {
  let slug = normalizeSubdomain(siteName);
  if (slug.length < 3) {
    slug = `site-${slug}`;
  }
  return slug.slice(0, 50);
};
