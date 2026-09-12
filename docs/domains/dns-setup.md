# DNS Setup Guide

This guide walks you through setting up DNS records for both Threadly subdomains and custom domains.

---

## 1. Threadly Subdomain Setup (Zero Configuration)

If you use a Threadly subdomain such as:
`my-manga.threadly.com`

**No manual DNS action is required by you.**

Threadly automatically manages DNS records and SSL termination through our own Cloudflare zone. As soon as you claim your subdomain, it is immediately active and protected by Cloudflare CDN, SSL, and DDoS mitigation.

---

## 2. Customer Custom Domain Setup

When connecting your own domain (e.g. `comments.yourwebsite.com`), you must configure a DNS record at your domain registrar or DNS provider.

### Recommended Record: CNAME

| Setting | Value | Notes |
| :--- | :--- | :--- |
| **Record Type** | `CNAME` | Canonical Name record |
| **Host / Name** | `comments` (or your subdomain prefix) | In Cloudflare or Namecheap, enter just the prefix `comments`. In AWS Route53 or Google Cloud DNS, enter the full hostname `comments.yourwebsite.com`. |
| **Target / Value** | `customers.threadly.com` | Configured by `THREADLY_CUSTOM_HOSTNAME_TARGET`. Points to Threadly's Cloudflare for SaaS edge. |
| **TTL** | Auto or 300 seconds | Low TTL helps DNS propagate quickly during setup. |
| **Proxy Status (Cloudflare users)** | **DNS Only (Grey Cloud)** | If your apex domain is also on Cloudflare, set proxy to DNS Only so Cloudflare for SaaS can terminate the custom hostname certificate. |

---

### Ownership Verification (TXT Record)

In certain configurations, Cloudflare may require an ownership verification `TXT` record before issuing an SSL certificate:

| Setting | Value |
| :--- | :--- |
| **Record Type** | `TXT` |
| **Host / Name** | `_cf-custom-hostname.comments` |
| **Target / Value** | `<unique-verification-token>` |

The Threadly Dashboard displays this record automatically if required by Cloudflare for your domain.

---

## Popular DNS Provider Instructions

### Cloudflare
1. Go to your Cloudflare dashboard and select your domain.
2. Navigate to **DNS** > **Records**.
3. Click **Add Record**.
4. Select `CNAME`, enter `comments` as the Name, and `customers.threadly.com` as the Target.
5. Set Proxy status to **DNS only (Grey Cloud)**.
6. Click **Save**.

### Namecheap
1. Go to **Domain List** > click **Manage** next to your domain.
2. Select the **Advanced DNS** tab.
3. Click **Add New Record**.
4. Choose `CNAME Record`.
5. Enter `comments` in **Host** and `customers.threadly.com` in **Value**.
6. Set TTL to `Automatic` and click the green checkmark.

### GoDaddy
1. In your GoDaddy Domain Portfolio, select your domain.
2. Scroll to **DNS** and click **Add New Record**.
3. Choose `CNAME`.
4. Enter `comments` in **Name**, and `customers.threadly.com` in **Value**.
5. Set TTL to `1/2 Hour` and click **Save**.
