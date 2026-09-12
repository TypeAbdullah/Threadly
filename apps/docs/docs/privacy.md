# Privacy Policy

**Last Updated:** September 12, 2026

Welcome to **Threadly** ("we", "our", or "us"). We provide an open-source, privacy-focused embeddable commenting infrastructure designed for modern web applications, blogs, and content publishers.

This Privacy Policy describes how Threadly collects, uses, and protects information when you interact with the Threadly commenting widget, SDK, or hosted platform.

---

## 1. Principles & Privacy-First Architecture

Threadly is built from the ground up to respect developer autonomy and visitor privacy:

- **No Cross-Site Tracking:** We do not track users across different domains or build behavioral advertising profiles.
- **Zero Third-Party Advertising:** We never sell, monetize, or broker personal information to advertisers or data brokers.
- **Minimal Data Footprint:** We collect only the data strictly necessary to deliver, authenticate, and moderate discussions.
- **Open Source Transparency:** Threadly's codebase is licensed under the MIT License. You can audit every line of code on [GitHub](https://github.com/TypeAbdullah/Threadly).

---

## 2. Information We Collect

### A. Information You Provide Directly
When you participate in a Threadly discussion thread:
- **Display Name & Avatar:** Provided during comment submission or linked via your authentication provider.
- **Comment Content:** The text, Markdown, or attachments submitted within a discussion thread.
- **Replies & Mentions:** Threading references linking your comment to parent comments.

### B. Information Collected Automatically
To protect communities against spam, DDoS attacks, and abuse:
- **IP Address & User-Agent:** Ephemerally processed and securely hashed for rate-limiting, abusive bot mitigation, and regional edge routing. We do not store raw IP addresses alongside comment histories.
- **Timestamps:** Accurate time markers (`createdAt`, `updatedAt`) for comment ordering and moderation audit logs.

### C. Local Storage & Client Cookies
- Threadly utilizes client-side storage (`localStorage`) solely to preserve session tokens, theme preferences (light/dark mode), and unsaved comment drafts.
- Threadly does **not** set third-party tracking cookies or canvas fingerprinting scripts.

---

## 3. How We Use Information

The information collected is used exclusively for:
1. **Rendering Discussions:** Delivering real-time comments, nested replies, and pinned threads inside the Shadow DOM widget.
2. **Abuse Prevention & Moderation:** Enforcing site-specific rate limits, word filters, spam heuristics, and moderator actions.
3. **Webhook Notifications:** Dispatching real-time event payloads to the site owner's configured webhook endpoints.
4. **Platform Reliability:** Monitoring edge routing performance and Cloudflare SSL/TLS termination.

---

## 4. Edge Infrastructure & Cloudflare

Threadly routes API and CDN traffic through Cloudflare's global edge network:
- **Custom Hostnames (SaaS):** When a site owner connects a custom domain (e.g. `comments.yoursite.com`), traffic is secured with automated edge SSL/TLS certificates.
- **Security Headers:** All API interactions enforce strict CORS policies validated against the site's registered allowed origins.

---

## 5. Self-Hosting & Data Sovereignty

If you choose to self-host Threadly via Docker or deploy it to your own cloud infrastructure:
- **Complete Data Ownership:** All MongoDB databases, authentication secrets, and comment assets remain entirely within your private infrastructure.
- **Zero Telemetry:** Self-hosted Threadly instances do not phone home or transmit analytics to our servers.

---

## 6. Data Retention & User Rights

- **Comment Deletion:** Users can request deletion of their comments according to the site owner's moderation policy. When a comment is permanently deleted, its content is purged from active databases.
- **Export & GDPR/CCPA Inquiries:** Because Threadly serves as a data processor on behalf of site owners, data access and removal requests can be initiated directly with the site administrator or through our support channels.

---

## 7. Open Source License

Threadly is licensed under the **MIT License**. You are free to inspect, modify, and distribute the software in compliance with the license terms.

For the full text of the license, visit the [MIT Official License](https://opensource.org/licenses/MIT).

---

## 8. Changes to This Policy

We may update this Privacy Policy periodically to reflect enhancements to our platform or legal requirements. Updates will be documented with a revised "Last Updated" date at the top of this document.

If you have questions regarding this Privacy Policy or Threadly's data practices, please open an issue or discussion on our [GitHub Repository](https://github.com/TypeAbdullah/Threadly).
