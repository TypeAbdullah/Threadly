# Custom UI & Headless Integration

You are never forced to use the official Threadly widget. You can build bespoke commenting interfaces in **React, Vue, Svelte, or React Native** using `@threadly/sdk`:

```tsx
import React, { useState, useEffect } from "react";
import { ThreadlyClient, ThreadlyComment } from "@threadly/sdk";

const client = new ThreadlyClient({ siteId: "mist-scans" });

export function CustomReaderComments({ chapterId }: { chapterId: string }) {
  const [comments, setComments] = useState<ThreadlyComment[]>([]);

  useEffect(() => {
    client.comments.list({ pageId: chapterId }).then((res) => {
      setComments(res.items);
    });
  }, [chapterId]);

  return (
    <div className="custom-comments-list">
      {comments.map((c) => (
        <div key={c.id} className="comment-item">
          <strong>{c.author.displayName}</strong>: {c.content}
        </div>
      ))}
    </div>
  );
}
```
