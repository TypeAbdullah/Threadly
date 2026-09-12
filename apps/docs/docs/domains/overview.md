# Domain Management System Overview

Threadly provides a production-grade, Cloudflare-backed domain routing and provisioning architecture. This allows website owners to:
1. Automatically claim or auto-generate Threadly-owned subdomains (e.g. `my-manga.threadly.com`) proxied through Cloudflare DNS.
2. Connect arbitrary customer-owned custom domains (e.g. `comments.mysite.com`) using Cloudflare for SaaS / Custom Hostnames with automatic TLS certificates.

---

## Domain Architecture

```
                                  ┌──────────────────────────────┐
                                  │   Browser / Client Request   │
                                  └──────────────┬───────────────┘
                                                 │
                                                 ▼
                             ┌───────────────────────────────────────┐
                             │       Cloudflare Edge Network         │
                             └───────┬───────────────────────┬───────┘
                                     │                       │
                Type A: Threadly Subdomain         Type B: Custom Domain
            (e.g. my-manga.threadly.com)        (e.g. comments.mysite.com)
                                     │                       │
                       Cloudflare DNS Zone       Cloudflare Custom Hostname
                               (CNAME)              (Cloudflare for SaaS)
                                     │                       │
                                     └───────────┬───────────┘
                                                 │
                                                 ▼
                                ┌─────────────────────────────────┐
                                │   Threadly API & Origin Engine  │
                                └─────────────────────────────────┘
```

---

## Two Domain Types

### Type A: Threadly-Owned Subdomains
- **Format**: `<subdomain>.threadly.com` (e.g. `mist-scans.threadly.com`)
- **DNS Authority**: Owned and managed directly by Threadly within our Cloudflare Zone.
- **Provisioning**: Immediate upon site creation or on-demand via the Client Dashboard. A DNS CNAME record is created pointing to `THREADLY_DOMAIN_TARGET`.
- **Status**: Immediately active with wildcard or zone-level SSL.

### Type B: Customer Custom Domains
- **Format**: Any customer domain or subdomain (e.g. `comments.example.com`, `discussion.mysite.org`).
- **DNS Authority**: Customer controls their own DNS provider (Cloudflare, Route53, Namecheap, GoDaddy, etc.).
- **Provisioning**: Threadly registers a Cloudflare Custom Hostname under our Cloudflare for SaaS zone.
- **Verification**: Customer adds a `CNAME` (and optional verification `TXT`) record pointing to `THREADLY_CUSTOM_HOSTNAME_TARGET` (e.g. `customers.threadly.com`).
- **SSL**: Cloudflare automatically validates ownership and provisions dedicated SSL/TLS certificates.

---

## Domain Lifecycle & State Machine

Every domain in Threadly moves through an explicit state machine:

```
[ pending ] ──▶ [ verifying ] ──▶ [ ssl_pending ] ──▶ [ active ]
      │               │                  │
      ▼               ▼                  ▼
  [ error ] ◄─────────┴──────────────────┘
      │
      ▼
  [ disabled ] ──▶ [ deleting ] ──▶ [ deleted ]
```

- **`pending`**: Registered in Threadly, awaiting customer DNS configuration.
- **`verifying`**: Verification check initiated with Cloudflare API.
- **`ssl_pending`**: DNS ownership verified; Cloudflare is issuing the SSL/TLS certificate.
- **`active`**: Fully verified, TLS active, routing live traffic.
- **`error`**: DNS misconfigured or Cloudflare validation timed out.
- **`disabled`**: Suspended by administrator.
- **`deleting` / `deleted`**: Disconnected and decommissioned safely from Cloudflare and MongoDB.

---

## Zero-Credential Client Exposure

Security is strictly enforced:
- **Cloudflare API Tokens** are strictly stored in server environment variables (`CLOUDFLARE_API_TOKEN`).
- Tokens are **never** exposed to the frontend, SDK, embed widget, or git commits.
- Local development works effortlessly out of the box using `MockCloudflareProvider` when `MOCK_CLOUDFLARE=true`.
