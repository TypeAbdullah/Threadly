# Install Widget

Embedding Threadly takes less than 3 lines of HTML.

```html
<div id="threadly"></div>

<script src="https://cdn.threadly.example/widget.js"></script>

<script>
  Threadly.init({
    siteId: "mist-scans",
    pageId: "lookism-500",
    container: "#threadly"
  });
</script>
```

The widget automatically manages:
- Authentication state
- Comment submission
- Nested replies
- Sorting (Best / Newest)
- User profile customizations
- Reporting modal
- Loading and error states
