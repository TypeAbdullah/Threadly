import { DomainResolution } from "@threadly/types";
import { DomainRepository } from "./domain.repository.js";
import { normalizeHostname } from "./domain.validation.js";

interface CacheEntry {
  resolution: DomainResolution | null;
  expiresAt: number;
}

export class DomainResolver {
  private repository: DomainRepository;
  private cache: Map<string, CacheEntry> = new Map();
  private ttlMs: number;

  constructor(repository: DomainRepository, ttlSeconds: number = 60) {
    this.repository = repository;
    this.ttlMs = ttlSeconds * 1000;
  }

  public async resolveHostname(hostname: string): Promise<DomainResolution | null> {
    const normalized = normalizeHostname(hostname);
    if (!normalized) return null;

    const now = Date.now();
    const cached = this.cache.get(normalized);
    if (cached && cached.expiresAt > now) {
      return cached.resolution;
    }

    const domain = await this.repository.findByNormalizedHostname(normalized);
    let resolution: DomainResolution | null = null;

    if (domain && domain.status !== "deleted") {
      resolution = {
        siteId: domain.siteId,
        domainId: domain.id,
        hostname: domain.hostname,
        type: domain.type,
        status: domain.status,
        isPrimary: domain.isPrimary,
      };
    }

    this.cache.set(normalized, {
      resolution,
      expiresAt: now + this.ttlMs,
    });

    return resolution;
  }

  public invalidate(hostname: string): void {
    const normalized = normalizeHostname(hostname);
    this.cache.delete(normalized);
  }

  public clear(): void {
    this.cache.clear();
  }
}
