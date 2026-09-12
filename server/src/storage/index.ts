export interface AvatarStorageProvider {
  cacheAvatar(providerUrl: string, userId: string): Promise<string>;
}

export class CloudflareR2AvatarStorage implements AvatarStorageProvider {
  private r2Bucket: string;
  private r2PublicUrl: string;

  constructor() {
    this.r2Bucket = process.env.R2_AVATAR_BUCKET || "threadly-avatars";
    this.r2PublicUrl = process.env.R2_PUBLIC_URL || "https://cdn.threadly.example/avatars";
  }

  public async cacheAvatar(providerUrl: string, userId: string): Promise<string> {
    // In production with AWS-SDK / S3 client:
    // 1. fetch(providerUrl)
    // 2. PutObjectCommand to R2 bucket with Content-Type: image/webp
    // 3. Return `${this.r2PublicUrl}/${userId}.webp`
    if (!process.env.R2_ACCESS_KEY_ID) {
      // If R2 credentials not configured, return provider URL directly safely
      return providerUrl;
    }

    return `${this.r2PublicUrl}/${userId}.webp`;
  }
}

export const avatarStorage = new CloudflareR2AvatarStorage();
