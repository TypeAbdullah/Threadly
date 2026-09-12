# THREADLY - Production Embeddable Commenting Platform

Threadly is an embeddable, generic commenting platform (similar to Disqus / Commento) designed to allow any website (manga reader, blog, news portal, docs) to embed modern, rich, nested commenting threads without managing a comment backend.

---

## Workspace Structure

```
threadly/
├── apps/
│   ├── client/                  # Main user portal (http://localhost:5173)
│   ├── admin/                   # Admin dashboard (http://localhost:5174)
│   ├── widget/                  # Embeddable widget & demo (http://localhost:5175)
│   └── docs/                    # VitePress documentation (http://localhost:5176)
├── server/                      # Hono + MongoDB + Better Auth REST API (http://localhost:3000)
├── packages/
│   ├── types/                   # Platform TypeScript definitions
│   ├── validation/              # Zod validation schemas
│   └── ui/                      # Design system tokens and avatar decorations
├── docker-compose.yml           # Containerized MongoDB & API server
└── pnpm-workspace.yaml
```

---

## Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Run All Applications
```bash
pnpm dev
```

Or run individual services:
```bash
pnpm --filter server dev    # Backend API on http://localhost:3000
pnpm --filter widget dev    # Embeddable Widget demo on http://localhost:5175
pnpm --filter client dev    # Client Portal on http://localhost:5173
pnpm --filter admin dev     # Admin Dashboard on http://localhost:5174
pnpm --filter docs dev      # VitePress Documentation
```

---

## Generic Page Architecture

Threadly is **content-agnostic**. The same system powers:
- Manga Chapter: `siteId: "mist-scans"`, `pageId: "lookism-500"`
- Blog Post: `siteId: "example-blog"`, `pageId: "my-first-post"`
- News Article: `siteId: "tech-news"`, `pageId: "ai-breakthrough"`

---

## Strictly No Reactions

Per design specifications, Threadly intentionally excludes comment reactions (likes, dislikes, reaction counts, reaction emojis, or reaction endpoints) to maintain clean, focused discussion and prevent engagement distortion.
