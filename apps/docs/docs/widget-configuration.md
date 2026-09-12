# Widget Configuration

```ts
Threadly.init({
  siteId: string,              // Required: Site identifier
  pageId?: string,             // Recommended: Unique content identifier
  pageUrl?: string,            // Optional: URL alternative
  container: string | Element, // Required: DOM target
  theme?: "dark" | "light",    // Optional: UI theme (default: "dark")
  sort?: "best" | "newest",    // Optional: Default sorting
  accentColor?: string,        // Optional: Hex accent
  apiUrl?: string              // Optional: API endpoint override
});
```

### Methods
- `Threadly.updatePage({ pageId, pageUrl })`
- `Threadly.refresh()`
- `Threadly.openLogin()`
- `Threadly.logout()`
- `Threadly.destroy()`
