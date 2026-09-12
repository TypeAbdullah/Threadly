# Threadly Documentation

Welcome to **Threadly**, the standalone, embeddable commenting platform designed to power discussions across any website without building or managing comment backends.

## Core Hierarchy

```
Threadly Account
      │
      └── Site (e.g. Mist Scans, Engineering Blog, Tech News)
            │
            ├── Page/Post A (lookism-500)
            │       └── Comments & Replies
            │
            └── Page/Post B (my-first-post)
                    └── Comments & Replies
```

## Universal Design Philosophy

Threadly is **generic and content-agnostic**. The exact same API and embeddable widget work for:
- Manga & manhwa chapter pages
- Engineering and lifestyle blogs
- News articles
- Video & media portals
- Documentation sites
- Product reviews and eCommerce
- Any arbitrary URL or page identifier

## Key Features

- **Shadow DOM Isolation**: Zero host CSS leakage. Host button styles will never destroy Threadly, and Threadly styles will never leak into your site.
- **Strictly No Reactions**: Focused strictly on high-quality discussion, nested replies, moderation, user profiles, and notifications.
- **Automated Moderation**: Multi-tier pipeline with spam heuristics, keyword filtering, and extensible AI providers.
- **Headless SDK**: Build your own custom UI using `@threadly/sdk` or embed the pre-styled modern dark-mode widget.
