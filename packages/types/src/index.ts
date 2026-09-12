export type ModerationDecision = "approved" | "pending" | "rejected" | "hidden";

export type CommentStatus = "visible" | "hidden" | "deleted";

export type SiteMemberRole = "owner" | "admin" | "moderator" | "member";

export type SiteMemberStatus = "active" | "banned" | "muted" | "shadow_banned";

export type ThreadlySort = "best" | "newest" | "oldest";

// ==========================================
// DOMAIN MANAGEMENT TYPES
// ==========================================

export type DomainType = "threadly_subdomain" | "custom";

export type DomainStatus =
  | "pending"
  | "verifying"
  | "ssl_pending"
  | "active"
  | "error"
  | "disabled"
  | "deleting"
  | "deleted";

export type SslStatus = "pending" | "active" | "error" | "expired";

export interface DnsVerificationRecord {
  type: string; // e.g. "CNAME" or "TXT"
  name: string; // e.g. "comments" or "_cf-custom-hostname.comments"
  value: string; // e.g. "customers.threadly.com"
  status?: string;
}

export interface Domain {
  id: string;
  siteId: string;
  hostname: string;
  normalizedHostname: string;
  type: DomainType;
  status: DomainStatus;
  isPrimary: boolean;
  provider: "cloudflare";
  providerHostnameId?: string;
  dnsRecords?: DnsVerificationRecord[];
  verification?: {
    type: string;
    name: string;
    value: string;
  };
  sslStatus?: SslStatus;
  errorDetails?: string;
  createdAt: string;
  updatedAt: string;
  verifiedAt?: string | null;
  deletedAt?: string | null;
}

export interface DomainResolution {
  siteId: string;
  domainId: string;
  hostname: string;
  type: DomainType;
  status: DomainStatus;
  isPrimary: boolean;
}

// ==========================================
// USER & SITE MODELS
// ==========================================

export interface ThreadlyUser {
  id: string;
  name: string;
  email?: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  avatarDecoration?: string;
  role?: string;
  bio?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SiteSettings {
  allowGuestComments?: boolean;
  moderationEnabled: boolean;
  autoApproveComments: boolean;
  requireEmailVerification?: boolean;
  profanityFilterEnabled: boolean;
  spamFilterEnabled: boolean;
  aiModerationEnabled: boolean;
  maxCommentLength: number;
}

export interface Site {
  id: string;
  siteId: string; // public identifier (e.g. site_xyz123 or mist-scans)
  name: string;
  allowedOrigins: string[];
  publicKey: string;
  privateKeyHash?: string;
  ownerId: string;
  subdomain?: string;
  primaryHostname?: string;
  settings: SiteSettings;
  createdAt: string;
  updatedAt: string;
}

export interface SiteMember {
  id: string;
  siteId: string;
  userId: string;
  role: SiteMemberRole;
  status: SiteMemberStatus;
  bannedAt?: string | null;
  reason?: string | null;
  createdAt: string;
}

export interface Page {
  id: string;
  siteId: string;
  pageId: string;
  url: string;
  title: string;
  metadata?: Record<string, unknown>;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  siteId: string;
  pageId: string;
  userId: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    avatarDecoration?: string;
  };
  parentId: string | null;
  content: string;
  status: CommentStatus;
  moderationStatus: ModerationDecision;
  moderationDetails?: {
    flaggedCategories?: string[];
    reason?: string;
    autoModerated?: boolean;
  };
  edited: boolean;
  deletedAt: string | null;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
  replies?: Comment[];
}

export interface Report {
  id: string;
  commentId: string;
  siteId: string;
  userId: string;
  reporter?: {
    id: string;
    username: string;
    displayName: string;
  };
  reason:
    | "Spam"
    | "Harassment"
    | "Hate"
    | "Sexual content"
    | "Violence"
    | "Spoiler"
    | "Other";
  details?: string;
  status: "pending" | "resolved" | "dismissed";
  commentSnippet?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: "reply" | "moderation" | "mention" | "report_resolved";
  title: string;
  body: string;
  read: boolean;
  data?: {
    siteId?: string;
    pageId?: string;
    commentId?: string;
    url?: string;
  };
  createdAt: string;
}

export interface ApiKey {
  id: string;
  siteId: string;
  name: string;
  prefix: string;
  lastUsedAt?: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  siteId?: string;
  userId: string;
  action: string;
  targetType: "comment" | "site" | "user" | "report" | "apikey" | "domain";
  targetId: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface PaginationResult<T> {
  items: T[];
  nextCursor?: string | null;
  hasMore: boolean;
  totalCount?: number;
}
