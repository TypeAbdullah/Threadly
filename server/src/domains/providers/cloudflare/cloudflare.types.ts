export interface CloudflareApiResponse<T> {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: string[];
  result: T;
}

export interface CloudflareDnsRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  proxiable: boolean;
  proxied: boolean;
  ttl: number;
  created_on: string;
  modified_on: string;
}

export interface CloudflareCustomHostname {
  id: string;
  hostname: string;
  ssl: {
    id: string;
    type: string;
    method: string;
    status: string; // "pending_validation", "active", "pending_issuance", "pending_deployment"
    validation_records?: Array<{
      status?: string;
      txt_name?: string;
      txt_value?: string;
      http_url?: string;
      http_body?: string;
      cname?: string;
      cname_target?: string;
    }>;
  };
  status: string; // "pending", "active", "moved", "blocked"
  ownership_verification?: {
    type: string;
    name: string;
    value: string;
  };
  verification_errors?: string[];
  created_at: string;
}
