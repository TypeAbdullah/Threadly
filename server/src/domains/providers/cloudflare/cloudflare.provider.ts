import {
  DomainProvider,
  ProvisionDnsResult,
  ProvisionCustomHostnameResult,
  CustomHostnameVerificationResult,
} from "../domain-provider.js";
import { CloudflareClient } from "./cloudflare.client.js";
import { DnsVerificationRecord, SslStatus, DomainStatus } from "@threadly/types";

export interface CloudflareProviderConfig {
  apiToken: string;
  zoneId: string;
  accountId?: string;
  baseDomain: string; // e.g. "threadly.com"
  dnsTarget: string; // e.g. "app.threadly.com" or CNAME target
  customHostnameTarget: string; // e.g. "customers.threadly.com"
}

export class CloudflareProvider implements DomainProvider {
  public name = "cloudflare";
  private client: CloudflareClient;
  private baseDomain: string;
  private dnsTarget: string;
  private customHostnameTarget: string;

  constructor(config: CloudflareProviderConfig) {
    this.client = new CloudflareClient({
      apiToken: config.apiToken,
      zoneId: config.zoneId,
      accountId: config.accountId,
    });
    this.baseDomain = config.baseDomain.toLowerCase().replace(/^\.+|\.+$/g, "");
    this.dnsTarget = config.dnsTarget;
    this.customHostnameTarget = config.customHostnameTarget;
  }

  public async createDnsRecord(subdomain: string, target?: string): Promise<ProvisionDnsResult> {
    const fullHostname = `${subdomain}.${this.baseDomain}`;
    const destination = target || this.dnsTarget;

    const record = await this.client.createDnsRecord(subdomain, destination, "CNAME", true);

    return {
      recordId: record.id,
      hostname: fullHostname,
      target: destination,
      status: "active",
    };
  }

  public async deleteDnsRecord(recordId: string): Promise<void> {
    await this.client.deleteDnsRecord(recordId);
  }

  public async createCustomHostname(hostname: string): Promise<ProvisionCustomHostnameResult> {
    const cfHostname = await this.client.createCustomHostname(hostname, this.customHostnameTarget);

    const verificationRecords: DnsVerificationRecord[] = [];

    // 1. Primary CNAME routing record
    verificationRecords.push({
      type: "CNAME",
      name: hostname,
      value: this.customHostnameTarget,
      status: "pending",
    });

    // 2. SSL/Ownership verification records from Cloudflare if present
    if (cfHostname.ownership_verification) {
      verificationRecords.push({
        type: cfHostname.ownership_verification.type || "TXT",
        name: cfHostname.ownership_verification.name,
        value: cfHostname.ownership_verification.value,
        status: "pending",
      });
    }

    if (cfHostname.ssl?.validation_records) {
      for (const rec of cfHostname.ssl.validation_records) {
        if (rec.txt_name && rec.txt_value) {
          verificationRecords.push({
            type: "TXT",
            name: rec.txt_name,
            value: rec.txt_value,
            status: rec.status || "pending",
          });
        }
      }
    }

    return {
      hostnameId: cfHostname.id,
      hostname: cfHostname.hostname,
      status: this.mapCloudflareStatus(cfHostname.status, cfHostname.ssl?.status),
      sslStatus: this.mapSslStatus(cfHostname.ssl?.status),
      verificationRecords,
    };
  }

  public async verifyCustomHostname(
    hostnameId: string,
    hostname: string
  ): Promise<CustomHostnameVerificationResult> {
    const cfHostname = await this.client.getCustomHostname(hostnameId);

    const status = this.mapCloudflareStatus(cfHostname.status, cfHostname.ssl?.status);
    const sslStatus = this.mapSslStatus(cfHostname.ssl?.status);
    const isVerified = status === "active";

    const verificationRecords: DnsVerificationRecord[] = [
      {
        type: "CNAME",
        name: hostname,
        value: this.customHostnameTarget,
        status: isVerified ? "active" : "pending",
      },
    ];

    if (cfHostname.ssl?.validation_records) {
      for (const rec of cfHostname.ssl.validation_records) {
        if (rec.txt_name && rec.txt_value) {
          verificationRecords.push({
            type: "TXT",
            name: rec.txt_name,
            value: rec.txt_value,
            status: rec.status || "pending",
          });
        }
      }
    }

    return {
      status,
      sslStatus,
      verificationRecords,
      isVerified,
      error: cfHostname.verification_errors?.[0],
    };
  }

  public async deleteCustomHostname(hostnameId: string): Promise<void> {
    await this.client.deleteCustomHostname(hostnameId);
  }

  private mapCloudflareStatus(cfStatus: string, sslStatus?: string): DomainStatus {
    if (cfStatus === "active" && sslStatus === "active") return "active";
    if (cfStatus === "active" && sslStatus !== "active") return "ssl_pending";
    if (cfStatus === "pending") return "verifying";
    if (cfStatus === "blocked") return "error";
    return "pending";
  }

  private mapSslStatus(sslStatus?: string): SslStatus {
    if (sslStatus === "active") return "active";
    if (sslStatus?.includes("pending")) return "pending";
    if (sslStatus === "expired") return "expired";
    return "pending";
  }
}
