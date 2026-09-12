import { Db, ObjectId } from "mongodb";
import { Domain, DomainStatus } from "@threadly/types";
import { DomainProvider } from "./providers/domain-provider.js";
import { CloudflareProvider } from "./providers/cloudflare/cloudflare.provider.js";
import { MockCloudflareProvider } from "./providers/mock/mock.provider.js";
import { DomainRepository } from "./domain.repository.js";
import { DomainResolver } from "./domain.resolver.js";
import { DomainError } from "./domain.errors.js";
import { getDb } from "../database/index.js";
import {
  validateSubdomain,
  validateCustomHostname,
  generateSubdomainSlug,
} from "./domain.validation.js";

let domainServiceInstance: DomainService | null = null;

export const getDomainService = async (customProvider?: DomainProvider): Promise<DomainService> => {
  if (domainServiceInstance && !customProvider) return domainServiceInstance;
  const db = await getDb();
  const instance = new DomainService(db, customProvider);
  await instance.init();
  if (!customProvider) {
    domainServiceInstance = instance;
  }
  return instance;
};

export class DomainService {
  private repository: DomainRepository;
  private resolver: DomainResolver;
  private provider: DomainProvider;
  private db: Db;
  private baseDomain: string;

  constructor(db: Db, customProvider?: DomainProvider) {
    this.db = db;
    this.repository = new DomainRepository(db);
    this.resolver = new DomainResolver(this.repository);
    this.baseDomain = (process.env.CLOUDFLARE_BASE_DOMAIN || "threadly.com").toLowerCase();

    if (customProvider) {
      this.provider = customProvider;
    } else if (
      process.env.CLOUDFLARE_API_TOKEN &&
      process.env.CLOUDFLARE_ZONE_ID &&
      process.env.MOCK_CLOUDFLARE !== "true"
    ) {
      console.log("[DomainService] Initializing production CloudflareProvider...");
      this.provider = new CloudflareProvider({
        apiToken: process.env.CLOUDFLARE_API_TOKEN,
        zoneId: process.env.CLOUDFLARE_ZONE_ID,
        accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
        baseDomain: this.baseDomain,
        dnsTarget: process.env.THREADLY_DOMAIN_TARGET || "app.threadly.com",
        customHostnameTarget:
          process.env.THREADLY_CUSTOM_HOSTNAME_TARGET || "customers.threadly.com",
      });
    } else {
      console.log("[DomainService] Initializing MockCloudflareProvider for local development...");
      this.provider = new MockCloudflareProvider({
        baseDomain: this.baseDomain,
        customHostnameTarget:
          process.env.THREADLY_CUSTOM_HOSTNAME_TARGET || "customers.threadly.com",
      });
    }
  }

  public getResolver(): DomainResolver {
    return this.resolver;
  }

  public async init(): Promise<void> {
    await this.repository.initIndexes();
  }

  public async checkSubdomainAvailability(
    subdomain: string
  ): Promise<{ available: boolean; hostname: string; reason?: string }> {
    try {
      const clean = validateSubdomain(subdomain, this.baseDomain);
      const fullHostname = `${clean}.${this.baseDomain}`;
      const existing = await this.repository.findByNormalizedHostname(fullHostname);

      if (existing) {
        return { available: false, hostname: fullHostname, reason: "Already taken" };
      }
      return { available: true, hostname: fullHostname };
    } catch (err: any) {
      return {
        available: false,
        hostname: `${subdomain}.${this.baseDomain}`,
        reason: err.message,
      };
    }
  }

  public async provisionSubdomain(
    siteId: string,
    userId: string,
    requestedSubdomain?: string
  ): Promise<Domain> {
    await this.verifySiteAdmin(siteId, userId);

    const site = await this.db.collection("sites").findOne({ siteId });
    if (!site) {
      throw new DomainError("Site not found", { code: "NOT_FOUND", status: 404 });
    }

    // Determine target subdomain: use requested or generate from site name
    let targetSubdomain = requestedSubdomain
      ? validateSubdomain(requestedSubdomain, this.baseDomain)
      : generateSubdomainSlug(site.name);

    let fullHostname = `${targetSubdomain}.${this.baseDomain}`;

    // Handle slug collision fallback atomically
    let counter = 1;
    while (await this.repository.findByNormalizedHostname(fullHostname)) {
      counter++;
      targetSubdomain = `${generateSubdomainSlug(site.name)}-${counter}`;
      fullHostname = `${targetSubdomain}.${this.baseDomain}`;
      if (counter > 100) {
        throw new DomainError("Unable to reserve a unique subdomain. Please specify one explicitly.", {
          code: "SUBDOMAIN_GENERATION_FAILED",
          status: 409,
        });
      }
    }

    // Provision Cloudflare DNS record
    let dnsResult;
    try {
      dnsResult = await this.provider.createDnsRecord(targetSubdomain);
    } catch (err: any) {
      console.error("[DomainService] Provider DNS error:", err);
      throw new DomainError("Failed to provision DNS record with Cloudflare", {
        code: "PROVIDER_ERROR",
        status: 502,
        details: err.message,
      });
    }

    // Check if site already has a primary domain
    const existingDomains = await this.repository.findBySiteId(siteId);
    const hasPrimary = existingDomains.some((d) => d.isPrimary);

    // Save to database
    const newDomain = await this.repository.insert({
      siteId,
      hostname: fullHostname,
      normalizedHostname: fullHostname,
      type: "threadly_subdomain",
      status: "active",
      isPrimary: !hasPrimary, // First domain becomes primary
      provider: "cloudflare",
      providerHostnameId: dnsResult.recordId,
      dnsRecords: [
        {
          type: "CNAME",
          name: fullHostname,
          value: dnsResult.target,
          status: "active",
        },
      ],
      sslStatus: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      verifiedAt: new Date().toISOString(),
    });

    // Update site's primaryHostname and subdomain
    const siteUpdates: any = { subdomain: targetSubdomain, updatedAt: new Date() };
    if (!hasPrimary) {
      siteUpdates.primaryHostname = fullHostname;
    }
    await this.db.collection("sites").updateOne({ siteId }, { $set: siteUpdates });

    // Automatically allow origin for this subdomain
    await this.addAllowedOriginToSite(siteId, `https://${fullHostname}`);

    await this.recordAuditLog(siteId, userId, "subdomain_created", newDomain.id, {
      hostname: fullHostname,
      subdomain: targetSubdomain,
    });

    this.resolver.invalidate(fullHostname);
    return newDomain;
  }

  public async addCustomDomain(siteId: string, userId: string, rawHostname: string): Promise<Domain> {
    await this.verifySiteAdmin(siteId, userId);

    const normalized = validateCustomHostname(rawHostname, this.baseDomain);

    // Ensure not already connected anywhere
    const existing = await this.repository.findByNormalizedHostname(normalized);
    if (existing) {
      throw new DomainError(`Hostname "${normalized}" is already connected to a Threadly site.`, {
        code: "DOMAIN_ALREADY_EXISTS",
        status: 409,
      });
    }

    // Provision Cloudflare Custom Hostname
    let cfResult;
    try {
      cfResult = await this.provider.createCustomHostname(normalized);
    } catch (err: any) {
      console.error("[DomainService] Cloudflare custom hostname error:", err);
      throw new DomainError("Could not provision custom domain with Cloudflare. Please try again.", {
        code: "PROVIDER_ERROR",
        status: 502,
        details: err.message,
      });
    }

    const newDomain = await this.repository.insert({
      siteId,
      hostname: normalized,
      normalizedHostname: normalized,
      type: "custom",
      status: cfResult.status,
      isPrimary: false,
      provider: "cloudflare",
      providerHostnameId: cfResult.hostnameId,
      dnsRecords: cfResult.verificationRecords,
      sslStatus: cfResult.sslStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await this.recordAuditLog(siteId, userId, "domain_created", newDomain.id, {
      hostname: normalized,
      providerHostnameId: cfResult.hostnameId,
    });

    return newDomain;
  }

  public async verifyCustomDomain(
    siteId: string,
    domainId: string,
    userId: string
  ): Promise<Domain> {
    await this.verifySiteAdmin(siteId, userId);

    const domain = await this.repository.findById(domainId);
    if (!domain || domain.siteId !== siteId) {
      throw new DomainError("Domain not found for this site", { code: "NOT_FOUND", status: 404 });
    }

    if (domain.type !== "custom") {
      throw new DomainError("Only custom domains require verification", {
        code: "INVALID_OPERATION",
        status: 400,
      });
    }

    if (!domain.providerHostnameId) {
      throw new DomainError("Domain missing provider identifier", {
        code: "INVALID_STATE",
        status: 400,
      });
    }

    // Query Cloudflare
    let verifyResult;
    try {
      verifyResult = await this.provider.verifyCustomHostname(
        domain.providerHostnameId,
        domain.hostname
      );
    } catch (err: any) {
      console.error("[DomainService] Provider verification check failed:", err);
      throw new DomainError("Cloudflare verification check failed. Please retry shortly.", {
        code: "PROVIDER_ERROR",
        status: 502,
      });
    }

    const updates: Partial<Domain> = {
      status: verifyResult.status,
      sslStatus: verifyResult.sslStatus,
      dnsRecords: verifyResult.verificationRecords,
      errorDetails: verifyResult.error,
    };

    if (verifyResult.isVerified && !domain.verifiedAt) {
      updates.verifiedAt = new Date().toISOString();
      // Add custom domain to site's allowedOrigins once verified
      await this.addAllowedOriginToSite(siteId, `https://${domain.hostname}`);
      await this.addAllowedOriginToSite(siteId, `http://${domain.hostname}`);
    }

    const updated = await this.repository.update(domainId, updates);

    await this.recordAuditLog(siteId, userId, "domain_verified", domainId, {
      status: verifyResult.status,
      sslStatus: verifyResult.sslStatus,
      isVerified: verifyResult.isVerified,
    });

    this.resolver.invalidate(domain.hostname);
    return updated || domain;
  }

  public async setPrimaryDomain(siteId: string, domainId: string, userId: string): Promise<Domain> {
    await this.verifySiteAdmin(siteId, userId);

    const domain = await this.repository.findById(domainId);
    if (!domain || domain.siteId !== siteId) {
      throw new DomainError("Domain not found", { code: "NOT_FOUND", status: 404 });
    }

    if (domain.status !== "active") {
      throw new DomainError("Only active and verified domains can be selected as primary.", {
        code: "DOMAIN_NOT_ACTIVE",
        status: 400,
      });
    }

    await this.repository.setPrimary(siteId, domainId);
    await this.db
      .collection("sites")
      .updateOne({ siteId }, { $set: { primaryHostname: domain.hostname, updatedAt: new Date() } });

    await this.recordAuditLog(siteId, userId, "domain_primary_changed", domainId, {
      hostname: domain.hostname,
    });

    this.resolver.invalidate(domain.hostname);
    return (await this.repository.findById(domainId))!;
  }

  public async removeDomain(siteId: string, domainId: string, userId: string): Promise<void> {
    await this.verifySiteAdmin(siteId, userId);

    const domain = await this.repository.findById(domainId);
    if (!domain || domain.siteId !== siteId) {
      throw new DomainError("Domain not found", { code: "NOT_FOUND", status: 404 });
    }

    // Call provider to delete remote DNS or custom hostname
    try {
      if (domain.type === "threadly_subdomain" && domain.providerHostnameId) {
        await this.provider.deleteDnsRecord(domain.providerHostnameId);
      } else if (domain.type === "custom" && domain.providerHostnameId) {
        await this.provider.deleteCustomHostname(domain.providerHostnameId);
      }
    } catch (err) {
      console.warn("[DomainService] Provider deletion note:", err);
    }

    // Soft delete in database
    await this.repository.markDeleted(domainId);

    // If it was primary, pick another active domain if one exists
    if (domain.isPrimary) {
      const remaining = await this.repository.findBySiteId(siteId);
      const nextActive = remaining.find((d) => d.status === "active" && d.id !== domainId);
      if (nextActive) {
        await this.repository.setPrimary(siteId, nextActive.id);
        await this.db
          .collection("sites")
          .updateOne({ siteId }, { $set: { primaryHostname: nextActive.hostname, updatedAt: new Date() } });
      } else {
        await this.db
          .collection("sites")
          .updateOne({ siteId }, { $unset: { primaryHostname: "" }, $set: { updatedAt: new Date() } });
      }
    }

    await this.recordAuditLog(siteId, userId, "domain_deleted", domainId, {
      hostname: domain.hostname,
      type: domain.type,
    });

    this.resolver.invalidate(domain.hostname);
  }

  public async getSiteDomains(siteId: string): Promise<Domain[]> {
    return this.repository.findBySiteId(siteId);
  }

  public async getDomainById(siteId: string, domainId: string): Promise<Domain | null> {
    const domain = await this.repository.findById(domainId);
    if (!domain || domain.siteId !== siteId) return null;
    return domain;
  }

  public async adminGetAllDomains(filter: {
    status?: DomainStatus;
    type?: string;
    search?: string;
    limit?: number;
    skip?: number;
  }): Promise<{ items: Domain[]; total: number }> {
    return this.repository.findAll(filter);
  }

  public async adminDisableDomain(domainId: string, adminUserId: string): Promise<Domain> {
    const domain = await this.repository.findById(domainId);
    if (!domain) {
      throw new DomainError("Domain not found", { code: "NOT_FOUND", status: 404 });
    }

    const updated = await this.repository.update(domainId, { status: "disabled" });
    await this.recordAuditLog(domain.siteId, adminUserId, "domain_disabled", domainId, {
      hostname: domain.hostname,
    });

    this.resolver.invalidate(domain.hostname);
    return updated || domain;
  }

  private async verifySiteAdmin(siteId: string, userId: string): Promise<void> {
    const member = await this.db.collection("siteMembers").findOne({ siteId, userId });
    const isSiteAdmin = member && (member.role === "owner" || member.role === "admin");
    const site = await this.db.collection("sites").findOne({ siteId });
    const isOwner = site && site.ownerId === userId;

    if (!isSiteAdmin && !isOwner) {
      throw new DomainError("You do not have permission to manage domains for this site.", {
        code: "FORBIDDEN",
        status: 403,
      });
    }
  }

  private async addAllowedOriginToSite(siteId: string, origin: string): Promise<void> {
    const site = await this.db.collection("sites").findOne({ siteId });
    if (!site) return;

    const allowed = new Set(site.allowedOrigins || []);
    allowed.add(origin);

    await this.db
      .collection("sites")
      .updateOne({ siteId }, { $set: { allowedOrigins: Array.from(allowed), updatedAt: new Date() } });
  }

  private async recordAuditLog(
    siteId: string,
    userId: string,
    action: string,
    targetId: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    await this.db.collection("auditLogs").insertOne({
      siteId,
      userId,
      action,
      targetType: "domain",
      targetId,
      details,
      createdAt: new Date(),
    });
  }
}
