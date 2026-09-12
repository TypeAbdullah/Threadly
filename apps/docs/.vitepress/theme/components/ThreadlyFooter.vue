<template>
  <footer class="threadly-footer">
    <div class="footer-container">
      <p class="footer-message">
        <a
          href="https://opensource.org/licenses/MIT"
          target="_blank"
          rel="noopener"
          class="footer-link"
        >Open-source MIT Licensed</a>
        <span class="footer-sep">|</span>
        <a
          :href="withBase('/privacy')"
          class="footer-link"
        >Privacy policy</a>
      </p>
      <p class="footer-copyright">
        Copyright © {{ currentYear }} Threadly
      </p>
    </div>
  </footer>
</template>

<script setup>
import { withBase } from 'vitepress';

const currentYear = new Date().getFullYear();
</script>

<style scoped>
.threadly-footer {
  width: 100%;
  padding: 2.5rem 1rem 3rem;
  border-top: 1px solid var(--vp-c-border);
  background: var(--th-nav-bg, transparent);
  text-align: center;
  transition: border-color 0.25s ease, background 0.25s ease;
}

.footer-container {
  max-width: 1120px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.footer-message {
  margin: 0;
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
}

.footer-link {
  color: var(--vp-c-brand-1);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.footer-link:hover {
  color: var(--vp-c-brand-2);
  text-decoration: underline;
}

.footer-sep {
  margin: 0 0.5rem;
  color: var(--vp-c-border);
}

.footer-copyright {
  margin: 0;
  font-size: 0.82rem;
  color: var(--vp-c-text-2);
}
</style>
