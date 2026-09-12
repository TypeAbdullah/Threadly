import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Threadly Docs",
  description: "The universal embeddable commenting platform for the modern web.",
  base: process.env.GITHUB_PAGES === "true" || process.env.GITHUB_ACTIONS ? "/Threadly/" : "/",
  srcDir: "docs",
  ignoreDeadLinks: true,
  themeConfig: {
    nav: [
      { text: "Docs", link: "/getting-started" },
      { text: "Widget", link: "/install-widget" },
      { text: "SDK", link: "/sdk" },
      { text: "API", link: "/api" },
      { text: "Troubleshoot", link: "/domains/troubleshooting" },
    ],
    sidebar: [
      {
        text: "Introduction",
        items: [
          { text: "Overview", link: "/" },
          { text: "Getting Started", link: "/getting-started" },
          { text: "Create a Site", link: "/create-a-site" },
        ],
      },
      {
        text: "Widget Integration",
        items: [
          { text: "Install Widget", link: "/install-widget" },
          { text: "Page Identification", link: "/page-identification" },
          { text: "Widget Configuration", link: "/widget-configuration" },
          { text: "Authentication", link: "/authentication" },
        ],
      },
      {
        text: "Core Platform",
        items: [
          { text: "Comments & Replies", link: "/comments-and-replies" },
          { text: "Moderation Pipeline", link: "/moderation" },
          { text: "Reports System", link: "/reports" },
          { text: "Domain Security & CORS", link: "/domain-security" },
          { text: "Rate Limits", link: "/rate-limits" },
          { text: "Webhooks", link: "/webhooks" },
        ],
      },
      {
        text: "Domains & Cloudflare",
        items: [
          { text: "Overview & Architecture", link: "/domains/overview" },
          { text: "Threadly Subdomains", link: "/domains/threadly-subdomains" },
          { text: "Custom Domains (SaaS)", link: "/domains/custom-domains" },
          { text: "DNS Setup Guide", link: "/domains/dns-setup" },
          { text: "Troubleshooting & Cloudflare Setup", link: "/domains/troubleshooting" },
        ],
      },
      {
        text: "Developers",
        items: [
          { text: "JavaScript SDK (@threadly/sdk)", link: "/sdk" },
          { text: "Custom UI / Headless API", link: "/custom-ui" },
          { text: "REST API Reference", link: "/api" },
          { text: "Errors & Status Codes", link: "/errors" },
        ],
      },
    ],
    socialLinks: [{ icon: "github", link: "https://github.com/TypeAbdullah/Threadly" }],
  },
});
