// @ts-nocheck
import DefaultTheme from "vitepress/theme";
import ThreadlyHero from "./components/ThreadlyHero.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }: { app: any }) {
    app.component("ThreadlyHero", ThreadlyHero);
  },
};
