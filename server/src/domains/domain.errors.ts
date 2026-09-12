export class DomainError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: unknown;

  constructor(message: string, options?: { code?: string; status?: number; details?: unknown }) {
    super(message);
    this.name = "DomainError";
    this.code = options?.code || "DOMAIN_ERROR";
    this.status = options?.status || 400;
    this.details = options?.details;
    Object.setPrototypeOf(this, DomainError.prototype);
  }
}
