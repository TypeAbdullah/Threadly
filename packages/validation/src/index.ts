import { z } from "zod";

export const usernameRegex = /^[a-z0-9_]{3,30}$/;

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment cannot exceed 2000 characters")
    .trim(),
  pageId: z.string().optional(),
  pageUrl: z.string().url().optional(),
  parentId: z.string().nullable().optional(),
});

export const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment cannot exceed 2000 characters")
    .trim(),
});

export const createReportSchema = z.object({
  commentId: z.string().min(1, "commentId is required"),
  reason: z.enum([
    "Spam",
    "Harassment",
    "Hate",
    "Sexual content",
    "Violence",
    "Spoiler",
    "Other",
  ]),
  details: z.string().max(500, "Details cannot exceed 500 characters").optional(),
});

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, "Display name cannot be empty")
    .max(50, "Display name cannot exceed 50 characters")
    .trim(),
  username: z
    .string()
    .regex(
      usernameRegex,
      "Username must be 3-30 characters, lowercase letters, numbers, and underscores only"
    )
    .trim(),
  bio: z
    .string()
    .max(500, "Bio cannot exceed 500 characters")
    .optional()
    .default(""),
  avatarDecoration: z.string().optional(),
});

export const createSiteSchema = z.object({
  name: z.string().min(1, "Site name is required").max(100),
  siteId: z
    .string()
    .min(3, "Site ID must be at least 3 characters")
    .max(50)
    .regex(
      /^[a-z0-9-_]+$/,
      "Site ID can only contain lowercase letters, numbers, hyphens, and underscores"
    ),
  allowedOrigins: z
    .array(z.string().min(1))
    .min(1, "At least one allowed origin is required"),
});

export const updateSiteSchema = z.object({
  name: z.string().min(1, "Site name is required").max(100).optional(),
  allowedOrigins: z.array(z.string().min(1)).optional(),
});

export const hostnameRegex =
  /^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}?$/;

export const subdomainRegex = /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/;

export const createDomainSchema = z.object({
  hostname: z
    .string()
    .min(3, "Hostname must be at least 3 characters")
    .max(253, "Hostname cannot exceed 253 characters")
    .trim()
    .toLowerCase()
    .refine((h) => !h.includes("://") && !h.includes("/") && !h.includes(" "), {
      message: "Please provide a valid hostname (e.g. comments.mysite.com) without protocol or path",
    })
    .refine((h) => hostnameRegex.test(h), {
      message: "Invalid domain format",
    }),
});

export const setSubdomainSchema = z.object({
  subdomain: z
    .string()
    .min(3, "Subdomain must be at least 3 characters")
    .max(63, "Subdomain cannot exceed 63 characters")
    .trim()
    .toLowerCase()
    .refine((s) => subdomainRegex.test(s), {
      message: "Subdomain can only contain lowercase letters, numbers, and hyphens, and cannot begin or end with a hyphen",
    }),
});

export type CreateDomainInput = z.infer<typeof createDomainSchema>;
export type SetSubdomainInput = z.infer<typeof setSubdomainSchema>;

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateSiteInput = z.infer<typeof createSiteSchema>;
export type UpdateSiteInput = z.infer<typeof updateSiteSchema>;
