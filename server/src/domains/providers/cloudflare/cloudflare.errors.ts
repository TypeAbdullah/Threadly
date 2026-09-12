export class CloudflareApiError extends Error {
  public readonly statusCode?: number;
  public readonly cloudflareErrors: Array<{ code: number; message: string }>;

  constructor(
    message: string,
    options?: { statusCode?: number; errors?: Array<{ code: number; message: string }> }
  ) {
    super(message);
    this.name = "CloudflareApiError";
    this.statusCode = options?.statusCode;
    this.cloudflareErrors = options?.errors || [];
    Object.setPrototypeOf(this, CloudflareApiError.prototype);
  }
}
