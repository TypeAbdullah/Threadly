# Page Identification

Threadly identifies discussion threads using two complementary strategies: **Explicit Page IDs** and **URL-Based Resolution**.

## 1. Explicit `pageId` (Recommended)

External content systems typically have permanent, stable identifiers such as slugs, database IDs, or chapter identifiers:

```js
// Manga Chapter
Threadly.init({
  siteId: "mist-scans",
  pageId: "lookism-500",
  container: "#comments"
});

// Blog Post
Threadly.init({
  siteId: "my-blog",
  pageId: "my-first-post",
  container: "#comments"
});

// News Article
Threadly.init({
  siteId: "daily-news",
  pageId: "article-12345",
  container: "#comments"
});
```

Using an explicit `pageId` guarantees that even if the page URL changes or query parameters are added, the discussion thread remains attached to the content.

## 2. URL-Based Resolution (`pageUrl`)

Alternatively, you can provide the content URL:

```js
Threadly.init({
  siteId: "mist-scans",
  pageUrl: window.location.href,
  container: "#comments"
});
```

The Threadly backend automatically normalizes the URL by removing transient tracking query parameters (e.g. `utm_source`, `fbclid`) and trailing slashes to maintain a canonical thread identity.
