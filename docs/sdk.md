# Official JavaScript & TypeScript SDK

Install the official npm package:

```bash
pnpm add @threadly/sdk
# or
npm install @threadly/sdk
```

## High-Level Widget Controller

```ts
import { Threadly } from "@threadly/sdk";

// Initialize
Threadly.init({
  siteId: "site_abc123",
  pageId: "lookism-500",
  container: "#comments",
  theme: "dark",
  sort: "best"
});

// Lifecycle events
Threadly.on("ready", () => console.log("Threadly ready"));
Threadly.on("commentCreated", (comment) => console.log("Comment posted:", comment));

// Single Page Application thread updates
Threadly.updatePage({ pageId: "lookism-501" });

// Teardown
Threadly.destroy();
```

## Headless API Client (`ThreadlyClient`)

Build custom comment interfaces in React, Vue, Svelte, or native mobile apps:

```ts
import { ThreadlyClient } from "@threadly/sdk";

const client = new ThreadlyClient({ siteId: "mist-scans" });

// List comments
const { items, nextCursor, hasMore } = await client.comments.list({
  pageId: "lookism-500",
  sort: "best",
  limit: 20
});

// Post comment
const comment = await client.comments.create({
  pageId: "lookism-500",
  content: "Fantastic chapter!"
});

// Reply
const reply = await client.comments.create({
  pageId: "lookism-500",
  parentId: comment.id,
  content: "Agreed!"
});
```
