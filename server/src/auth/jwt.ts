import crypto from "crypto";

export interface JwtPayload {
  sub: string;
  username: string;
  displayName: string;
  role?: string;
  exp: number;
  iat: number;
  type: "access" | "refresh";
}

const base64UrlEncode = (str: string | Buffer): string => {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};

const base64UrlDecode = (str: string): string => {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) {
    str += "=";
  }
  return Buffer.from(str, "base64").toString("utf-8");
};

export const signJwt = (
  payload: Record<string, any>,
  secret: string,
  expiresInSeconds: number = 900 // 15 minutes default
): string => {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JwtPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
    type: payload.type || "access",
    sub: payload.sub,
    username: payload.username,
    displayName: payload.displayName,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac("sha256", secret)
    .update(dataToSign)
    .digest();

  const encodedSignature = base64UrlEncode(signature);
  return `${dataToSign}.${encodedSignature}`;
};

export const verifyJwt = (token: string, secret: string): JwtPayload | null => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const dataToSign = `${encodedHeader}.${encodedPayload}`;

    const expectedSignature = base64UrlEncode(
      crypto.createHmac("sha256", secret).update(dataToSign).digest()
    );

    // Constant-time comparison to prevent timing attacks
    if (
      !crypto.timingSafeEqual(
        Buffer.from(encodedSignature),
        Buffer.from(expectedSignature)
      )
    ) {
      return null;
    }

    const payload: JwtPayload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return null; // Token expired
    }

    return payload;
  } catch {
    return null;
  }
};
