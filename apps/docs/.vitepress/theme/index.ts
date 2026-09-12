// @ts-nocheck
import DefaultTheme from "vitepress/theme";
import { h } from "vue";
import ThreadlyHero from "./components/ThreadlyHero.vue";
import ThreadlyLogo from "./components/ThreadlyLogo.vue";
import ThreadlyFooter from "./components/ThreadlyFooter.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      "nav-bar-title-before": () => h(ThreadlyLogo),
      "layout-bottom": () => h(ThreadlyFooter),
    });
  },
  enhanceApp({ app }: { app: any }) {
    app.component("ThreadlyHero", ThreadlyHero);
    app.component("ThreadlyLogo", ThreadlyLogo);
    app.component("ThreadlyFooter", ThreadlyFooter);
  },
};
