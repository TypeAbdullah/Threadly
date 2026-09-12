# Domain Troubleshooting & Internal Cloudflare Guide

This document covers common domain configuration issues, troubleshooting tips, and internal Cloudflare configuration requirements.

---

## Common Issues & Resolutions

### 1. Domain Status Stuck on "Pending Verification"
- **Cause**: DNS changes have not propagated yet, or the CNAME target is incorrect.
- **Resolution**:
  - Verify your record points to `customers.threadly.com` (or your platform's configured target).
  - Use `dig` or `nslookup` to inspect propagation:
    ```bash
    dig CNAME comments.mysite.com +short
    ```
  - Click **Check Status** in the Threadly dashboard to trigger an immediate Cloudflare re-verification.

### 2. SSL Pending for More Than 15 Minutes
- **Cause**: The Certificate Authority (Let's Encrypt / Google Trust Services) is awaiting DCV (Domain Control Validation).
- **Resolution**:
  - Ensure any verification TXT records displayed in the dashboard have been added to your DNS zone.
  - If your domain registrar uses CAA records, verify that `letsencrypt.org` and `pki.goog` are permitted.

### 3. "Subdomain is Reserved" Error
- **Cause**: Attempting to claim an infrastructure subdomain such as `api`, `admin`, `app`, `docs`, `mail`, `auth`, etc.
- **Resolution**: Choose a different, unique subdomain name.

### 4. Cloudflare Error: "Orange Clouded CNAME Conflict"
- **Cause**: If the customer's apex domain is also managed on Cloudflare, proxying (Orange Cloud) the custom hostname CNAME record conflicts with Cloudflare for SaaS edge termination.
- **Resolution**: Toggle the CNAME record in the customer's Cloudflare DNS to **DNS Only (Grey Cloud)**.

---

## Internal Cloudflare Architecture & Production Setup

For platform administrators setting up Threadly in production:

### 1. Cloudflare Permissions Required
Create a scoped API Token with the following permissions:
- **Zone > DNS > Edit** (for managing Threadly-owned subdomain records)
- **Zone > Custom Hostnames (SSL for SaaS) > Edit** (for managing customer custom domains)

### 2. Environment Variables

```bash
# Base domain owned and managed by Threadly
CLOUDFLARE_BASE_DOMAIN=threadly.com

# Scoped API Token
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here

# Target Cloudflare Zone ID
CLOUDFLARE_ZONE_ID=your_zone_id_here

# Cloudflare Account ID
CLOUDFLARE_ACCOUNT_ID=your_account_id_here

# CNAME target for Threadly subdomains
THREADLY_DOMAIN_TARGET=app.threadly.com

# CNAME target for SaaS Custom Hostnames
THREADLY_CUSTOM_HOSTNAME_TARGET=customers.threadly.com

# In production, ensure MOCK_CLOUDFLARE is false or omitted
MOCK_CLOUDFLARE=false
```

### 3. Local Development Mock Provider
When developing locally without Cloudflare credentials:
- Set `MOCK_CLOUDFLARE=true`.
- Threadly automatically boots `MockCloudflareProvider`.
- It simulates DNS creation, verification, and SSL issuance with high fidelity, allowing end-to-end testing without making external network calls.
