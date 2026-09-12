---
layout: page
sidebar: false
aside: false
title: Threadly Docs
titleTemplate: false
---

<ThreadlyHero />

<div class="home-code-section">
  <div class="section-badge">QUICK INTEGRATION</div>
  <h2>Drop Into Any Website in Seconds</h2>
  <p class="section-desc">Threadly requires zero backend setup. Point the widget to your site and page ID, and discussions are live.</p>

::: code-group
```html [HTML / Vanilla]
<!-- 1. Load Isolated Threadly Web Component -->
<script type="module" src="https://unpkg.com/@threadly/widget/dist/widget.js"></script>

<!-- 2. Mount Threadly Anywhere in Your HTML -->
<threadly-comments 
  site-id="mist-scans" 
  page-id="lookism-500"
  theme="dark">
</threadly-comments>
```

```tsx [React / Next.js]
import { useEffect } from "react";
import { Threadly } from "@threadly/sdk";

export function CommentsSection({ chapterId }: { chapterId: string }) {
  useEffect(() => {
    const thread = Threadly.init({
      siteId: "mist-scans",
      pageId: chapterId,
      container: "#comments-container",
      theme: "dark",
      sort: "best"
    });

    return () => thread.destroy();
  }, [chapterId]);

  return <div id="comments-container" />;
}
```

```vue [Vue 3 / Nuxt]
<script setup>
import { onMounted, onUnmounted } from 'vue';
import { Threadly } from '@threadly/sdk';

let instance = null;

onMounted(() => {
  instance = Threadly.init({
    siteId: 'mist-scans',
    pageId: 'lookism-500',
    container: '#threadly-root',
    theme: 'dark'
  });
});

onUnmounted(() => {
  instance?.destroy();
});
</script>

<template>
  <div id="threadly-root" />
</template>
```
:::
</div>

<style>
.home-code-section {
  max-width: 900px;
  margin: 5rem auto 4rem;
  padding: 0 1rem;
  text-align: center;
}

.section-badge {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: #7079fe;
  margin-bottom: 0.6rem;
}

.home-code-section h2 {
  font-size: 2.2rem;
  font-weight: 800;
  color: var(--th-headline-color, #ffffff);
  letter-spacing: -0.02em;
  margin-bottom: 0.6rem;
  transition: color 0.25s ease;
}

.section-desc {
  font-size: 1rem;
  color: var(--th-subtext-color, #949bb0);
  max-width: 600px;
  margin: 0 auto 2.5rem;
  transition: color 0.25s ease;
}
</style>
