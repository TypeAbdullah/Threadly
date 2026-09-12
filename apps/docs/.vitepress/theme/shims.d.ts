declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any> | any;
  export default component;
}

declare module "./components/ThreadlyHero.vue" {
  const component: any;
  export default component;
}

declare module "./components/ThreadlyLogo.vue" {
  const component: any;
  export default component;
}

declare module "./components/ThreadlyFooter.vue" {
  const component: any;
  export default component;
}
