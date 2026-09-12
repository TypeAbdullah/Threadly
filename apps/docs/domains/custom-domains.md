# Custom Domains (Type B)

Threadly allows website owners to connect their own brand's domain (e.g. `comments.mysite.com`) directly to their Threadly site.

---

## How It Works

1. **User enters custom domain** in the Client Dashboard (e.g. `comments.mysite.com`).
2. **Server Validation**:
   - Rejects URLs, path segments, IP addresses, localhost, and internal hostnames.
   - Ensures hostname is not already claimed anywhere across the platform.
3. **Cloudflare for SaaS Provisioning**:
   - The server calls Cloudflare's Custom Hostnames API:
     `POST /zones/{zone_id}/custom_hostnames`
   - Cloudflare provisions a custom hostname record with SSL validation settings.
4. **Verification Instructions Returned**:
   - The UI immediately renders clear DNS instructions showing the required `CNAME` and any ownership `TXT` records.
5. **Customer Configures DNS**:
   - The customer logs into their DNS provider (Cloudflare, AWS Route 53, GoDaddy, Namecheap, etc.) and creates the record:
     - **Type**: `CNAME`
     - **Name**: `comments`
     - **Target**: `customers.threadly.com`
6. **Verification & SSL Provisioning**:
   - Cloudflare automatically verifies DNS propagation and issues an edge SSL/TLS certificate.
   - Status updates from `pending` -> `verifying` -> `ssl_pending` -> `active`.
7. **Live Routing & CORS Activation**:
   - The verified domain is automatically added to the Site's `allowedOrigins` list.

---

## API Endpoints

### Connect Custom Domain

```http
POST /api/v1/sites/:siteId/domains
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "hostname": "comments.mysite.com"
}
```

#### Response:
```json
{
  "success": true,
  "id": "domain_99ab12cd",
  "hostname": "comments.mysite.com",
  "type": "custom",
  "status": "pending",
  "verification": [
    {
      "type": "CNAME",
      "name": "comments.mysite.com",
      "value": "customers.threadly.com"
    }
  ],
  "data": { ... }
}
```

---

### Verify Custom Domain Status

```http
POST /api/v1/sites/:siteId/domains/:domainId/verify
Authorization: Bearer <jwt_token>
```

#### Response:
```json
{
  "success": true,
  "data": {
    "id": "domain_99ab12cd",
    "hostname": "comments.mysite.com",
    "status": "active",
    "sslStatus": "active",
    "verifiedAt": "2026-09-12T19:00:00.000Z"
  }
}
```

---

### Set Domain as Primary

Sites can have both a Threadly subdomain and a Custom domain. Site owners can choose which domain serves as the primary URL:

```http
POST /api/v1/sites/:siteId/domains/:domainId/set-primary
Authorization: Bearer <jwt_token>
```

---

### Disconnect Domain

```http
DELETE /api/v1/sites/:siteId/domains/:domainId
Authorization: Bearer <jwt_token>
```
Safe deletion: Removes the custom hostname from Cloudflare and marks the local MongoDB record as deleted.
