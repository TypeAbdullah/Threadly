import { ThreadlyCommentsElement } from "./element.js";

export { ThreadlyCommentsElement };

// Universal global script API
export const Threadly = {
  init(config: {
    siteId: string;
    pageId?: string;
    pageUrl?: string;
    container: string | HTMLElement;
    theme?: string;
    sort?: string;
    apiUrl?: string;
  }) {
    let container: HTMLElement | null = null;
    if (typeof config.container === "string") {
      container = document.querySelector(config.container);
    } else {
      container = config.container;
    }

    if (!container) {
      console.error(`[Threadly] Container "${config.container}" not found.`);
      return null;
    }

    container.innerHTML = "";
    const el = document.createElement("threadly-comments") as ThreadlyCommentsElement;
    el.setAttribute("site-id", config.siteId);
    if (config.pageId) el.setAttribute("page-id", config.pageId);
    if (config.pageUrl) el.setAttribute("page-url", config.pageUrl);
    if (config.apiUrl) el.setAttribute("api-url", config.apiUrl);
    if (config.theme) el.setAttribute("theme", config.theme);
    if (config.sort) el.setAttribute("sort", config.sort);

    container.appendChild(el);
    return el;
  },

  destroy(containerSelector: string = "#threadly") {
    const el = document.querySelector(containerSelector);
    if (el) el.innerHTML = "";
  },

  refresh(containerSelector: string = "#threadly") {
    const el = document.querySelector(`${containerSelector} threadly-comments`) as ThreadlyCommentsElement;
    if (el) el.refresh();
  },

  updatePage(params: { pageId?: string; pageUrl?: string }, containerSelector: string = "#threadly") {
    const el = document.querySelector(`${containerSelector} threadly-comments`) as ThreadlyCommentsElement;
    if (el) el.updatePage(params);
  },

  openLogin(containerSelector: string = "#threadly") {
    const el = document.querySelector(`${containerSelector} threadly-comments`) as ThreadlyCommentsElement;
    if (el) el.openLogin();
  },
};

if (typeof window !== "undefined") {
  (window as any).Threadly = Threadly;
}

export default Threadly;
