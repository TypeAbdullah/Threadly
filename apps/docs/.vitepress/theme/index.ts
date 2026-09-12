import DefaultTheme from "vitepress/theme";
// @ts-ignore
import ThreadlyHero from "./components/ThreadlyHero.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }: { app: any }) {
    app.component("ThreadlyHero", ThreadlyHero);
  },
};
