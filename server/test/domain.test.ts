import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { MongoClient, Db } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import {
  validateSubdomain,
  normalizeSubdomain,
  validateCustomHostname,
  normalizeHostname,
  generateSubdomainSlug,
  DEFAULT_RESERVED_SUBDOMAINS,
} from "../src/domains/domain.validation.js";
import { MockCloudflareProvider } from "../src/domains/providers/mock/mock.provider.js";
import { DomainService } from "../src/domains/domain.service.js";
import { DomainError } from "../src/domains/domain.errors.js";

describe("Domain Management System", () => {
  // -------------------------------------------------------------
  // 1. Validation & Normalization Unit Tests
  // -------------------------------------------------------------
  describe("Subdomain Validation & Rules", () => {
    it("should normalize valid subdomains correctly", () => {
      assert.strictEqual(normalizeSubdomain("  My-Manga-Site  "), "my-manga-site");
      assert.strictEqual(normalizeSubdomain("Awesome--Blog"), "awesome-blog");
      assert.strictEqual(normalizeSubdomain("-leading-trailing-"), "leading-trailing");
    });

    it("should accept valid subdomains", () => {
      const valid = validateSubdomain("my-manga", "threadly.com");
      assert.strictEqual(valid, "my-manga");
    });

    it("should reject subdomains shorter than 3 characters", () => {
      assert.throws(() => validateSubdomain("ab", "threadly.com"), {
        message: /at least 3 characters/,
      });
    });

    it("should reject subdomains longer than 63 characters", () => {
      const longSub = "a".repeat(64);
      assert.throws(() => validateSubdomain(longSub, "threadly.com"), {
        message: /cannot exceed 63 characters/,
      });
    });

    it("should reject reserved subdomains", () => {
      for (const reserved of ["www", "api", "admin", "app", "docs", "auth", "login", "status"]) {
        assert.throws(() => validateSubdomain(reserved, "threadly.com"), {
          message: /reserved Threadly hostname/,
        });
      }
    });

    it("should reject invalid characters in subdomains", () => {
      assert.throws(() => validateSubdomain("hello.world", "threadly.com"));
      assert.throws(() => validateSubdomain("hello/world", "threadly.com"));
      assert.throws(() => validateSubdomain("hello_world", "threadly.com"));
    });

    it("should generate clean subdomain slugs from site names", () => {
      assert.strictEqual(generateSubdomainSlug("My Awesome Manga"), "my-awesome-manga");
      assert.strictEqual(generateSubdomainSlug("Tech & Gadget Reviews!"), "tech-gadget-reviews");
      assert.strictEqual(generateSubdomainSlug("X"), "site-x");
    });
  });

  describe("Custom Hostname Validation", () => {
    it("should normalize custom hostnames correctly", () => {
      assert.strictEqual(
        normalizeHostname("https://comments.mysite.com/some/path?query=1"),
        "comments.mysite.com"
      );
      assert.strictEqual(normalizeHostname("COMMENTS.MYSITE.COM."), "comments.mysite.com");
    });

    it("should accept valid custom hostnames", () => {
      const normalized = validateCustomHostname("comments.mysite.com", "threadly.com");
      assert.strictEqual(normalized, "comments.mysite.com");
    });

    it("should reject base domain and base domain subdomains as custom domain", () => {
      assert.throws(() => validateCustomHostname("threadly.com", "threadly.com"), {
        message: /use the Subdomain configuration/,
      });
      assert.throws(() => validateCustomHostname("my-site.threadly.com", "threadly.com"), {
        message: /use the Subdomain configuration/,
      });
    });

    it("should reject localhost and private IP addresses", () => {
      assert.throws(() => validateCustomHostname("localhost", "threadly.com"), {
        message: /Local or private network hostnames cannot be added/,
      });
      assert.throws(() => validateCustomHostname("127.0.0.1", "threadly.com"));
      assert.throws(() => validateCustomHostname("192.168.1.1", "threadly.com"));
    });
  });

  // -------------------------------------------------------------
  // 2. Mock Cloudflare Provider Tests
  // -------------------------------------------------------------
  describe("MockCloudflareProvider", () => {
    const mock = new MockCloudflareProvider({
      baseDomain: "threadly.com",
      customHostnameTarget: "customers.threadly.com",
    });

    it("should create and delete DNS records", async () => {
      const record = await mock.createDnsRecord("test-sub");
      assert.strictEqual(record.hostname, "test-sub.threadly.com");
      assert.strictEqual(record.target, "app.threadly.com");
      assert.ok(record.recordId);

      await mock.deleteDnsRecord(record.recordId);
    });

    it("should create and verify custom hostnames", async () => {
      const created = await mock.createCustomHostname("comments.example.com");
      assert.strictEqual(created.status, "pending");
      assert.ok(created.hostnameId);
      assert.ok(created.verificationRecords.length > 0);

      const verified = await mock.verifyCustomHostname(created.hostnameId, "comments.example.com");
      assert.strictEqual(verified.isVerified, true);
      assert.strictEqual(verified.status, "active");
      assert.strictEqual(verified.sslStatus, "active");

      await mock.deleteCustomHostname(created.hostnameId);
    });
  });

  // -------------------------------------------------------------
  // 3. DomainService End-to-End Integration Tests
  // -------------------------------------------------------------
  describe("DomainService Integration", () => {
    let mongod: MongoMemoryServer;
    let client: MongoClient;
    let db: Db;
    let service: DomainService;
    const testSiteId = "test-site-alpha";
    const testUserId = "user-owner-123";

    before(async () => {
      mongod = await MongoMemoryServer.create();
      client = new MongoClient(mongod.getUri());
      await client.connect();
      db = client.db("threadly_test");

      // Seed test site
      await db.collection("sites").insertOne({
        siteId: testSiteId,
        name: "Test Manga Site",
        ownerId: testUserId,
        allowedOrigins: ["http://localhost:5175"],
        publicKey: "pk_test_123",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Seed owner membership
      await db.collection("siteMembers").insertOne({
        siteId: testSiteId,
        userId: testUserId,
        role: "owner",
        status: "active",
      });

      const mockProvider = new MockCloudflareProvider({
        baseDomain: "threadly.com",
        customHostnameTarget: "customers.threadly.com",
      });

      service = new DomainService(db, mockProvider);
      await service.init();
    });

    after(async () => {
      await client.close();
      await mongod.stop();
    });

    it("should check subdomain availability", async () => {
      const check = await service.checkSubdomainAvailability("new-manga");
      assert.strictEqual(check.available, true);
      assert.strictEqual(check.hostname, "new-manga.threadly.com");
    });

    it("should provision a Threadly-owned subdomain atomically", async () => {
      const domain = await service.provisionSubdomain(testSiteId, testUserId, "test-manga");
      assert.strictEqual(domain.hostname, "test-manga.threadly.com");
      assert.strictEqual(domain.type, "threadly_subdomain");
      assert.strictEqual(domain.status, "active");
      assert.strictEqual(domain.isPrimary, true);

      // Verify availability is now false
      const check = await service.checkSubdomainAvailability("test-manga");
      assert.strictEqual(check.available, false);

      // Verify site was updated with subdomain & allowedOrigins
      const site = await db.collection("sites").findOne({ siteId: testSiteId });
      assert.strictEqual(site?.subdomain, "test-manga");
      assert.strictEqual(site?.primaryHostname, "test-manga.threadly.com");
      assert.ok(site?.allowedOrigins.includes("https://test-manga.threadly.com"));
    });

    it("should resolve provisioned subdomain via DomainResolver", async () => {
      const resolver = service.getResolver();
      const resolved = await resolver.resolveHostname("test-manga.threadly.com");
      assert.ok(resolved);
      assert.strictEqual(resolved?.siteId, testSiteId);
      assert.strictEqual(resolved?.isPrimary, true);
    });

    it("should add a customer custom domain in pending status", async () => {
      const customDomain = await service.addCustomDomain(
        testSiteId,
        testUserId,
        "comments.mangaread.org"
      );
      assert.strictEqual(customDomain.hostname, "comments.mangaread.org");
      assert.strictEqual(customDomain.type, "custom");
      assert.strictEqual(customDomain.status, "pending");
      assert.strictEqual(customDomain.isPrimary, false);
      assert.ok(customDomain.dnsRecords && customDomain.dnsRecords.length > 0);
    });

    it("should verify custom domain and transition state to active", async () => {
      const domains = await service.getSiteDomains(testSiteId);
      const custom = domains.find((d) => d.hostname === "comments.mangaread.org");
      assert.ok(custom);

      const verified = await service.verifyCustomDomain(testSiteId, custom.id, testUserId);
      assert.strictEqual(verified.status, "active");
      assert.strictEqual(verified.sslStatus, "active");
      assert.ok(verified.verifiedAt);

      // Verify site allowed origins updated with custom domain
      const site = await db.collection("sites").findOne({ siteId: testSiteId });
      assert.ok(site?.allowedOrigins.includes("https://comments.mangaread.org"));
    });

    it("should allow setting the custom domain as primary", async () => {
      const domains = await service.getSiteDomains(testSiteId);
      const custom = domains.find((d) => d.hostname === "comments.mangaread.org");
      assert.ok(custom);

      const updated = await service.setPrimaryDomain(testSiteId, custom.id, testUserId);
      assert.strictEqual(updated.isPrimary, true);

      // Verify only ONE primary domain exists
      const all = await service.getSiteDomains(testSiteId);
      const primaries = all.filter((d) => d.isPrimary);
      assert.strictEqual(primaries.length, 1);
      assert.strictEqual(primaries[0].hostname, "comments.mangaread.org");
    });

    it("should prevent unauthorized users from managing site domains", async () => {
      await assert.rejects(
        () => service.provisionSubdomain(testSiteId, "intruder-user-999", "intruder-sub"),
        (err: any) => err instanceof DomainError && err.status === 403
      );
    });

    it("should remove domain safely", async () => {
      const domains = await service.getSiteDomains(testSiteId);
      const custom = domains.find((d) => d.hostname === "comments.mangaread.org");
      assert.ok(custom);

      await service.removeDomain(testSiteId, custom.id, testUserId);

      const remaining = await service.getSiteDomains(testSiteId);
      assert.strictEqual(
        remaining.some((d) => d.hostname === "comments.mangaread.org"),
        false
      );
    });
  });
});
