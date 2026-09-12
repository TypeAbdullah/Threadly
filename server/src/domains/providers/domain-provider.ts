import { DnsVerificationRecord, SslStatus, DomainStatus } from "@threadly/types";

export interface ProvisionDnsResult {
  recordId: string;
  hostname: string;
  target: string;
  status: DomainStatus;
}

export interface ProvisionCustomHostnameResult {
  hostnameId: string;
  hostname: string;
  status: DomainStatus;
  sslStatus: SslStatus;
  verificationRecords: DnsVerificationRecord[];
}

export interface CustomHostnameVerificationResult {
  status: DomainStatus;
  sslStatus: SslStatus;
  verificationRecords: DnsVerificationRecord[];
  isVerified: boolean;
  error?: string;
}

export interface DomainProvider {
  name: string;

  /**
   * Provisions a DNS record for a Threadly-owned subdomain (e.g. my-manga.threadly.com)
   */
  createDnsRecord(subdomain: string, target?: string): Promise<ProvisionDnsResult>;

  /**
   * Deletes a provisioned DNS record
   */
  deleteDnsRecord(recordId: string): Promise<void>;

  /**
   * Provisions a Cloudflare Custom Hostname for customer custom domains (e.g. comments.mysite.com)
   */
  createCustomHostname(hostname: string): Promise<ProvisionCustomHostnameResult>;

  /**
   * Queries Cloudflare for verification and SSL issuance status of a Custom Hostname
   */
  verifyCustomHostname(hostnameId: string, hostname: string): Promise<CustomHostnameVerificationResult>;

  /**
   * Deletes a Custom Hostname
   */
  deleteCustomHostname(hostnameId: string): Promise<void>;
}
