# Threadly Subdomains (Type A)

Threadly allows site creators to claim branded subdomains under the primary Threadly domain (e.g. `my-manga.threadly.com`).

---

## How It Works

1. **User enters or auto-generates a subdomain** during Site creation or via the Client Dashboard.
2. **Backend Normalization & Validation**:
   - Converts to lowercase.
   - Ensures length is between 3 and 63 characters.
   - Validates regex: `^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$`.
   - Rejects spaces, slashes, underscores, and protocol prefixes.
   - Enforces the **Reserved Names List** (e.g., `api`, `admin`, `app`, `docs`, `auth`, `support`, `billing`).
3. **Availability & Atomic Reservation**:
   - Pre-flight check via `GET /api/v1/sites/:siteId/subdomain/availability?subdomain=...`.
   - Guaranteed atomic reservation via MongoDB unique index on `normalizedHostname`.
4. **Cloudflare DNS Creation**:
   - The server calls Cloudflare Zone DNS API to create a `CNAME` record:
     - Name: `my-manga`
     - Target: `THREADLY_DOMAIN_TARGET` (e.g. `app.threadly.com`)
     - Proxied: `true` (Orange-clouded for CDN caching and DDoS protection).
5. **CORS Origin Integration**:
   - `https://my-manga.threadly.com` is automatically added to the Site's `allowedOrigins` list.

---

## API Endpoints

### Check Subdomain Availability

```http
GET /api/v1/sites/:siteId/subdomain/availability?subdomain=my-manga
Authorization: Bearer <jwt_token>
```

#### Response:
```json
{
  "success": true,
  "data": {
    "available": true,
    "hostname": "my-manga.threadly.com"
  }
}
```

---

### Provision Subdomain

```http
POST /api/v1/sites/:siteId/subdomain
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "subdomain": "my-manga"
}
```

> If `subdomain` is omitted, Threadly automatically generates an available slug from the site name (e.g. "My Manga" -> `my-manga`, or `my-manga-2` if taken).

#### Response:
```json
{
  "success": true,
  "hostname": "my-manga.threadly.com",
  "status": "active",
  "data": {
    "id": "6648bfa9...",
    "siteId": "site_123",
    "hostname": "my-manga.threadly.com",
    "type": "threadly_subdomain",
    "status": "active",
    "isPrimary": true,
    "provider": "cloudflare",
    "sslStatus": "active"
  }
}
```
