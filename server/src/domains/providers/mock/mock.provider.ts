import {
  DomainProvider,
  ProvisionDnsResult,
  ProvisionCustomHostnameResult,
  CustomHostnameVerificationResult,
} from "../domain-provider.js";
import { DnsVerificationRecord, DomainStatus, SslStatus } from "@threadly/types";

export class MockCloudflareProvider implements DomainProvider {
  public name = "mock-cloudflare";
  private baseDomain: string;
  private customHostnameTarget: string;
  private verificationAttempts: Map<string, number> = new Map();

  constructor(options?: { baseDomain?: string; customHostnameTarget?: string }) {
    this.baseDomain = (options?.baseDomain || "threadly.com").toLowerCase();
    this.customHostnameTarget = options?.customHostnameTarget || "customers.threadly.com";
  }

  public async createDnsRecord(subdomain: string, target?: string): Promise<ProvisionDnsResult> {
    const hostname = `${subdomain}.${this.baseDomain}`;
    return {
      recordId: `mock_dns_${Math.random().toString(36).substring(2, 10)}`,
      hostname,
      target: target || "app.threadly.com",
      status: "active",
    };
  }

  public async deleteDnsRecord(recordId: string): Promise<void> {
    // Simulated deletion
  }

  public async createCustomHostname(hostname: string): Promise<ProvisionCustomHostnameResult> {
    const hostnameId = `mock_cf_host_${Math.random().toString(36).substring(2, 10)}`;
    this.verificationAttempts.set(hostnameId, 0);

    const verificationRecords: DnsVerificationRecord[] = [
      {
        type: "CNAME",
        name: hostname,
        value: this.customHostnameTarget,
        status: "pending",
      },
      {
        type: "TXT",
        name: `_cf-custom-hostname.${hostname}`,
        value: `threadly-verify-${Math.random().toString(36).substring(2, 12)}`,
        status: "pending",
      },
    ];

    return {
      hostnameId,
      hostname,
      status: "pending",
      sslStatus: "pending",
      verificationRecords,
    };
  }

  public async verifyCustomHostname(
    hostnameId: string,
    hostname: string
  ): Promise<CustomHostnameVerificationResult> {
    const attempts = (this.verificationAttempts.get(hostnameId) || 0) + 1;
    this.verificationAttempts.set(hostnameId, attempts);

    // In mock mode, become active on verification request
    const isVerified = true;
    const status: DomainStatus = "active";
    const sslStatus: SslStatus = "active";

    const verificationRecords: DnsVerificationRecord[] = [
      {
        type: "CNAME",
        name: hostname,
        value: this.customHostnameTarget,
        status: "active",
      },
    ];

    return {
      status,
      sslStatus,
      verificationRecords,
      isVerified,
    };
  }

  public async deleteCustomHostname(hostnameId: string): Promise<void> {
    this.verificationAttempts.delete(hostnameId);
  }
}
