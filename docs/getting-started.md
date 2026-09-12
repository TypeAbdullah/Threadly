# Getting Started

Getting started with Threadly takes less than 3 minutes.

## 1. Create your Site

Navigate to the Threadly Client portal at [http://localhost:5173/sites](http://localhost:5173/sites) and create a new Site.
Give it a human-readable name (e.g. `Mist Scans` or `My Blog`) and a unique slug `siteId` (e.g. `mist-scans`).

Configure your **Allowed Origin** (e.g. `https://mistscans.com` or `http://localhost:5175`).

## 2. Add the Widget to Your Website

Add a container element and initialize the widget with your `siteId` and `pageId`:

```html
<!-- Comments Mount Point -->
<div id="threadly-comments"></div>

<!-- Threadly CDN Script -->
<script src="https://cdn.threadly.example/widget.js"></script>

<script>
  Threadly.init({
    siteId: "mist-scans",
    pageId: "lookism-500", // Unique identifier for this page
    container: "#threadly-comments",
    theme: "dark"
  });
</script>
```

That's it! Threadly automatically handles authentication, sorting, nested replies, avatar customization, and moderation.
