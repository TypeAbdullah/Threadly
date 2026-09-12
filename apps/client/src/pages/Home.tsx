import React from "react";
import { Link } from "react-router-dom";
import { ThreadlyUser } from "@threadly/types";
import { MessageSquare, ShieldCheck, Sparkles, Layers, ArrowRight, Code2, Globe } from "lucide-react";

export default function Home({ user }: { user: ThreadlyUser | null }) {
  return (
    <div className="space-y-16 py-6">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#18181c] border border-[#27272a] text-xs font-semibold text-rose-400">
          <Sparkles className="w-3.5 h-3.5" /> Modern Embeddable Commenting Infrastructure
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Drop-in comment threads for <span className="bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">any website</span>.
        </h1>
        <p className="text-base sm:text-lg text-[#a1a1aa] leading-relaxed">
          From manga chapters and technical blogs to news portals and documentation. Zero host CSS leakage with Shadow DOM isolation, automated moderation, and developer-first SDKs.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <a
            href="http://localhost:5175"
            target="_blank"
            rel="noreferrer"
            className="px-6 py-3 rounded-full bg-white hover:bg-[#e4e4e7] text-[#09090b] font-bold text-sm transition flex items-center gap-2 shadow-lg shadow-white/5"
          >
            Launch Live Embed Demo <ArrowRight className="w-4 h-4" />
          </a>
          <Link
            to={user ? "/sites" : "/login"}
            className="px-6 py-3 rounded-full bg-[#18181c] hover:bg-[#232328] border border-[#27272a] text-white font-semibold text-sm transition flex items-center gap-2"
          >
            {user ? "Manage My Sites" : "Sign In to Threadly"}
          </Link>
        </div>
      </div>

      {/* 3-Step Integration Snippet */}
      <div className="bg-[#121214] border border-[#27272a] rounded-2xl p-6 sm:p-8 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#71717a]">Quick Integration</span>
          <span className="text-xs text-rose-400 font-mono">HTML / JS / React</span>
        </div>
        <pre className="bg-[#09090b] p-4 rounded-xl border border-[#27272a] text-xs text-[#d4d4d8] font-mono overflow-x-auto leading-relaxed">
{`<!-- 1. Add comment container -->
<div id="threadly-comments"></div>

<!-- 2. Import SDK -->
<script type="module">
  import { Threadly } from "@threadly/sdk";

  // 3. Initialize Threadly for this page
  Threadly.init({
    siteId: "site_abc123",
    pageId: "lookism-500", // or my-first-post, article-99
    container: "#threadly-comments",
    theme: "dark"
  });
</script>`}
        </pre>
      </div>

      {/* Feature Grid */}
      <div className="grid sm:grid-cols-3 gap-6">
        <div className="bg-[#18181c] border border-[#27272a] rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base">Shadow DOM Isolation</h3>
          <p className="text-xs text-[#a1a1aa] leading-relaxed">
            Host stylesheets cannot override widget buttons or layout, and Threadly styles never leak into the host application.
          </p>
        </div>

        <div className="bg-[#18181c] border border-[#27272a] rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Globe className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base">Content Agnostic</h3>
          <p className="text-xs text-[#a1a1aa] leading-relaxed">
            No rigid schemas. Pass arbitrary page IDs or URLs to automatically bind independent discussions anywhere on the web.
          </p>
        </div>

        <div className="bg-[#18181c] border border-[#27272a] rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base">Automated Moderation</h3>
          <p className="text-xs text-[#a1a1aa] leading-relaxed">
            Spam detection, heuristic rate limiting, profanity filters, and site-scoped user bans and mutes.
          </p>
        </div>
      </div>
    </div>
  );
}
