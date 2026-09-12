import {
  CloudflareApiResponse,
  CloudflareCustomHostname,
  CloudflareDnsRecord,
} from "./cloudflare.types.js";
import { CloudflareApiError } from "./cloudflare.errors.js";

export interface CloudflareClientConfig {
  apiToken: string;
  zoneId: string;
  accountId?: string;
  baseUrl?: string;
}

export class CloudflareClient {
  private apiToken: string;
  private zoneId: string;
  private baseUrl: string;

  constructor(config: CloudflareClientConfig) {
    this.apiToken = config.apiToken;
    this.zoneId = config.zoneId;
    this.baseUrl = (config.baseUrl || "https://api.cloudflare.com/client/v4").replace(/\/+$/, "");
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
    const headers = {
      Authorization: `Bearer ${this.apiToken}`,
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    let response: Response;
    try {
      response = await fetch(url, { ...options, headers });
    } catch (err: any) {
      throw new CloudflareApiError("Failed connecting to Cloudflare API", {
        errors: [{ code: 0, message: err?.message || "Network error" }],
      });
    }

    const payload: CloudflareApiResponse<T> = await response.json().catch(() => null);

    if (!response.ok || !payload?.success) {
      const firstError = payload?.errors?.[0]?.message || response.statusText || "Cloudflare API error";
      throw new CloudflareApiError(firstError, {
        statusCode: response.status,
        errors: payload?.errors || [],
      });
    }

    return payload.result;
  }

  public async createDnsRecord(
    name: string,
    content: string,
    type: string = "CNAME",
    proxied: boolean = true
  ): Promise<CloudflareDnsRecord> {
    return this.request<CloudflareDnsRecord>(`/zones/${this.zoneId}/dns_records`, {
      method: "POST",
      body: JSON.stringify({
        type,
        name,
        content,
        ttl: 1, // Auto
        proxied,
      }),
    });
  }

  public async deleteDnsRecord(recordId: string): Promise<{ id: string }> {
    return this.request<{ id: string }>(`/zones/${this.zoneId}/dns_records/${recordId}`, {
      method: "DELETE",
    });
  }

  public async createCustomHostname(
    hostname: string,
    customOriginServer?: string
  ): Promise<CloudflareCustomHostname> {
    const body: any = {
      hostname,
      ssl: {
        method: "http",
        type: "dv",
        settings: {
          min_tls_version: "1.2",
        },
      },
    };

    if (customOriginServer) {
      body.custom_origin_server = customOriginServer;
    }

    return this.request<CloudflareCustomHostname>(`/zones/${this.zoneId}/custom_hostnames`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  public async getCustomHostname(hostnameId: string): Promise<CloudflareCustomHostname> {
    return this.request<CloudflareCustomHostname>(
      `/zones/${this.zoneId}/custom_hostnames/${hostnameId}`,
      { method: "GET" }
    );
  }

  public async deleteCustomHostname(hostnameId: string): Promise<{ id: string }> {
    return this.request<{ id: string }>(
      `/zones/${this.zoneId}/custom_hostnames/${hostnameId}`,
      { method: "DELETE" }
    );
  }
}
