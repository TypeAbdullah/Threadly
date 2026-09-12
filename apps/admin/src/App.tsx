import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  FileText,
  ShieldAlert,
  Flag,
  Users,
  Key,
  Globe,
  Settings,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";

export default function App() {
  const [selectedSite, setSelectedSite] = useState("mist-scans");
  const [sites, setSites] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "pages" | "moderation" | "reports" | "users" | "domains" | "settings">("dashboard");
  const [metrics, setMetrics] = useState<any>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [moderationQueue, setModerationQueue] = useState<any[]>([]);
  const [reportsQueue, setReportsQueue] = useState<any[]>([]);
  const [adminDomains, setAdminDomains] = useState<any[]>([]);
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [domainSearch, setDomainSearch] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [banUserId, setBanUserId] = useState("");
  const [banReason, setBanReason] = useState("");

  const fetchAdminDomains = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/v1/admin/domains", { credentials: "include" });
      const data = await res.json();
      if (data.success && data.data) {
        setAdminDomains(data.data.items || []);
      }
    } catch (err) {
      console.error("Failed to load admin domains", err);
    }
  };

  const fetchSites = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/v1/sites", { credentials: "include" });
      const data = await res.json();
      if (data.success && data.data.items) {
        setSites(data.data.items);
      }
    } catch {
      // Fallback demo sites
      setSites([
        { siteId: "mist-scans", name: "Mist Scans" },
        { siteId: "example-blog", name: "Example Blog" },
        { siteId: "tech-news", name: "Tech News" },
      ]);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Metrics
      const resMetrics = await fetch(`http://localhost:3000/api/v1/admin/sites/${selectedSite}/metrics`, { credentials: "include" });
      const dataMetrics = await resMetrics.json();
      if (dataMetrics.success) setMetrics(dataMetrics.data);

      // 2. Pages
      const resPages = await fetch(`http://localhost:3000/api/v1/sites/${selectedSite}/pages`, { credentials: "include" });
      const dataPages = await resPages.json();
      if (dataPages.success) setPages(dataPages.data.items || []);

      // 3. Moderation
      const resMod = await fetch(`http://localhost:3000/api/v1/admin/sites/${selectedSite}/moderation`, { credentials: "include" });
      const dataMod = await resMod.json();
      if (dataMod.success) setModerationQueue(dataMod.data.items || []);

      // 4. Reports
      const resRep = await fetch(`http://localhost:3000/api/v1/admin/sites/${selectedSite}/reports`, { credentials: "include" });
      const dataRep = await resRep.json();
      if (dataRep.success) setReportsQueue(dataRep.data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
    fetchAdminDomains();
  }, []);

  useEffect(() => {
    loadData();
  }, [selectedSite]);

  const handleModeration = async (commentId: string, action: "approve" | "reject") => {
    await fetch(`http://localhost:3000/api/v1/admin/sites/${selectedSite}/moderation/${commentId}/${action}`, {
      method: "POST",
      credentials: "include",
    });
    loadData();
  };

  const handleReportAction = async (reportId: string, action: "resolve" | "dismiss") => {
    await fetch(`http://localhost:3000/api/v1/admin/sites/${selectedSite}/reports/${reportId}/${action}`, {
      method: "POST",
      credentials: "include",
    });
    loadData();
  };

  const handleBanUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banUserId) return;
    await fetch(`http://localhost:3000/api/v1/admin/sites/${selectedSite}/members/${banUserId}/ban`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: banReason }),
      credentials: "include",
    });
    alert(`User ${banUserId} has been banned on ${selectedSite}.`);
    setBanUserId("");
    setBanReason("");
  };

  const handleDisableDomain = async (domainId: string) => {
    if (!confirm("Are you sure you want to disable this domain? It will immediately stop resolving traffic.")) return;
    try {
      await fetch(`http://localhost:3000/api/v1/admin/domains/${domainId}/disable`, {
        method: "POST",
        credentials: "include",
      });
      fetchAdminDomains();
    } catch (err) {
      alert("Failed to disable domain");
    }
  };

  const filteredDomains = adminDomains.filter((d) => {
    if (domainFilter !== "all" && d.status !== domainFilter) return false;
    if (domainSearch) {
      const q = domainSearch.toLowerCase();
      return (
        d.hostname?.toLowerCase().includes(q) ||
        d.siteId?.toLowerCase().includes(q) ||
        d.providerHostnameId?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#27272a] bg-[#121214] p-5 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-lg">
              🛡️
            </span>
            <div>
              <div className="font-black text-sm tracking-tight text-white">THREADLY</div>
              <div className="text-[10px] text-[#71717a] uppercase font-bold tracking-wider">Admin Console</div>
            </div>
          </div>

          {/* Site Selector */}
          <div>
            <label className="block text-[11px] font-bold text-[#71717a] uppercase tracking-wider mb-2">
              Active Site
            </label>
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="w-full bg-[#1e1e24] border border-[#2e2e36] rounded-xl px-3 py-2 text-xs font-semibold text-white outline-none"
            >
              <option value="mist-scans">Mist Scans (mist-scans)</option>
              <option value="example-blog">Example Blog (example-blog)</option>
              <option value="tech-news">Tech News Daily (tech-news)</option>
              {sites
                .filter((s) => !["mist-scans", "example-blog", "tech-news"].includes(s.siteId))
                .map((s) => (
                  <option key={s.siteId} value={s.siteId}>
                    {s.name} ({s.siteId})
                  </option>
                ))}
            </select>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {[
              { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
              { id: "pages", label: "Pages & Threads", icon: FileText },
              { id: "moderation", label: "Moderation Queue", icon: ShieldAlert, badge: moderationQueue.length },
              { id: "reports", label: "User Reports", icon: Flag, badge: reportsQueue.length },
              { id: "users", label: "User Bans & Mutes", icon: Users },
              {
                id: "domains",
                label: "Global Domains",
                icon: Globe,
                badge: adminDomains.filter((d) => d.status === "pending" || d.status === "verifying").length,
              },
              { id: "settings", label: "Site Security", icon: Key },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      : "text-[#a1a1aa] hover:bg-[#18181c] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                  {Boolean(tab.badge) && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-[#27272a] text-xs text-[#71717a]">
          Connected to <span className="text-white font-mono">http://localhost:3000</span>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white capitalize">{activeTab}</h1>
            <p className="text-xs text-[#a1a1aa]">Managing site: <strong className="text-rose-400 font-mono">{selectedSite}</strong></p>
          </div>

          <button
            onClick={loadData}
            className="px-3.5 py-2 rounded-xl bg-[#18181c] border border-[#27272a] hover:bg-[#232328] text-xs font-semibold text-[#d4d4d8] flex items-center gap-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            {/* Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Comments", value: metrics?.totalComments ?? 0, color: "text-white" },
                { label: "Total Pages", value: metrics?.totalPages ?? 0, color: "text-blue-400" },
                { label: "Comments Today", value: metrics?.commentsToday ?? 0, color: "text-emerald-400" },
                { label: "Active Commenters", value: metrics?.activeCommentersCount ?? 0, color: "text-amber-400" },
                { label: "Pending Moderation", value: metrics?.pendingModeration ?? 0, color: "text-rose-400" },
                { label: "Open Reports", value: metrics?.openReports ?? 0, color: "text-orange-400" },
                { label: "Total Replies", value: metrics?.repliesCount ?? 0, color: "text-purple-400" },
                { label: "Blocked Spam", value: metrics?.blockedSpam ?? 0, color: "text-red-500" },
              ].map((m, idx) => (
                <div key={idx} className="bg-[#18181c] border border-[#27272a] rounded-2xl p-5 space-y-2">
                  <span className="text-xs font-bold text-[#71717a] uppercase tracking-wider">{m.label}</span>
                  <div className={`text-3xl font-black ${m.color}`}>{m.value}</div>
                </div>
              ))}
            </div>

            {/* Quick overview of pages */}
            <div className="bg-[#18181c] border border-[#27272a] rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-white text-sm">Top Discussed Content</h3>
              <div className="space-y-3">
                {pages.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-[#1e1e24] border border-[#27272a]">
                    <div>
                      <div className="font-bold text-xs text-white">{p.title}</div>
                      <div className="text-[11px] text-[#71717a] font-mono">{p.pageId}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      {p.commentCount} comments
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Pages Tab */}
        {activeTab === "pages" && (
          <div className="space-y-4">
            <div className="bg-[#18181c] border border-[#27272a] rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-white text-sm">Registered Pages on {selectedSite}</h3>
              <p className="text-xs text-[#a1a1aa]">
                Pages are tracked dynamically whenever a user opens a discussion thread or submits a comment.
              </p>

              <div className="space-y-3">
                {pages.map((p) => (
                  <div key={p.id} className="p-4 rounded-xl bg-[#1e1e24] border border-[#27272a] flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white">{p.title}</h4>
                      <p className="text-xs text-[#71717a] font-mono mt-0.5">{p.url}</p>
                      <span className="text-[11px] text-rose-400 font-mono">Page ID: {p.pageId}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-white">{p.commentCount}</span>
                      <span className="text-xs text-[#71717a] block">comments</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Moderation Queue Tab */}
        {activeTab === "moderation" && (
          <div className="space-y-4">
            {moderationQueue.length === 0 ? (
              <div className="bg-[#18181c] border border-[#27272a] rounded-2xl p-12 text-center text-[#71717a]">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-emerald-500 opacity-60" />
                <p className="text-sm font-semibold text-white mb-1">Queue is clear</p>
                <p className="text-xs">No comments are currently pending review.</p>
              </div>
            ) : (
              moderationQueue.map((item) => (
                <div key={item.id} className="bg-[#18181c] border border-[#27272a] rounded-2xl p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">{item.author?.displayName}</span>
                      <span className="text-xs text-[#71717a]">(@{item.author?.username})</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-semibold uppercase">
                        Flagged: {item.moderationDetails?.flaggedCategories?.join(", ") || "Filter"}
                      </span>
                    </div>
                    <span className="text-xs text-[#71717a]">{new Date(item.createdAt).toLocaleTimeString()}</span>
                  </div>

                  <p className="text-sm text-[#e4e4e7] p-3 rounded-xl bg-[#24242a] border border-[#2e2e38]">
                    "{item.content}"
                  </p>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => handleModeration(item.id, "reject")}
                      className="px-4 py-1.5 rounded-full bg-[#27272a] hover:bg-rose-950 text-rose-400 text-xs font-bold transition flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject / Hide
                    </button>
                    <button
                      onClick={() => handleModeration(item.id, "approve")}
                      className="px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* User Reports Tab */}
        {activeTab === "reports" && (
          <div className="space-y-4">
            {reportsQueue.length === 0 ? (
              <div className="bg-[#18181c] border border-[#27272a] rounded-2xl p-12 text-center text-[#71717a]">
                <Flag className="w-10 h-10 mx-auto mb-3 text-orange-400 opacity-60" />
                <p className="text-sm font-semibold text-white mb-1">No open reports</p>
                <p className="text-xs">Community members have not flagged any comments recently.</p>
              </div>
            ) : (
              reportsQueue.map((rep) => (
                <div key={rep.id} className="bg-[#18181c] border border-[#27272a] rounded-2xl p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-300">
                      Reason: {rep.reason}
                    </span>
                    <span className="text-xs text-[#71717a]">{new Date(rep.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="text-xs text-[#a1a1aa]">
                    Reported comment snippet: <span className="text-white font-medium">"{rep.commentSnippet}"</span>
                  </div>

                  {rep.details && (
                    <div className="text-xs text-orange-200 bg-orange-950/40 p-2.5 rounded-lg border border-orange-900/40">
                      Reporter note: {rep.details}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => handleReportAction(rep.id, "dismiss")}
                      className="px-3.5 py-1.5 rounded-full bg-[#27272a] text-xs font-semibold text-[#a1a1aa]"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => handleReportAction(rep.id, "resolve")}
                      className="px-3.5 py-1.5 rounded-full bg-rose-500 text-xs font-semibold text-white"
                    >
                      Action & Resolve
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Users & Bans Tab */}
        {activeTab === "users" && (
          <div className="bg-[#18181c] border border-[#27272a] rounded-2xl p-6 space-y-6 max-w-xl">
            <div>
              <h3 className="font-bold text-white text-base mb-1">Site User Ban & Mute Controls</h3>
              <p className="text-xs text-[#a1a1aa]">
                Bans applied here are scoped strictly to <strong>{selectedSite}</strong> and do not ban the user from other sites.
              </p>
            </div>

            <form onSubmit={handleBanUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white mb-1">User ID or Username</label>
                <input
                  type="text"
                  placeholder="e.g. user-daniel or reader"
                  value={banUserId}
                  onChange={(e) => setBanUserId(e.target.value)}
                  className="w-full bg-[#24242a] border border-[#32323a] rounded-xl px-3 py-2 text-xs text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1">Reason for Ban</label>
                <input
                  type="text"
                  placeholder="e.g. Unsolicited spam promotion or harassment"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="w-full bg-[#24242a] border border-[#32323a] rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition"
              >
                Apply Site Ban
              </button>
            </form>
          </div>
        )}

        {/* Global Domains Tab */}
        {activeTab === "domains" && (
          <div className="space-y-6">
            {/* Header and Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-white text-base">Global Domain Infrastructure</h3>
                <p className="text-xs text-[#a1a1aa]">
                  Manage Cloudflare DNS subdomains, SaaS custom hostnames, and SSL provisioning across all sites.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search hostname, siteId..."
                  value={domainSearch}
                  onChange={(e) => setDomainSearch(e.target.value)}
                  className="bg-[#18181c] border border-[#27272a] rounded-xl px-3 py-1.5 text-xs text-white placeholder-[#71717a] outline-none w-56"
                />
                <button
                  onClick={fetchAdminDomains}
                  className="p-2 rounded-xl bg-[#18181c] border border-[#27272a] hover:bg-[#232328] text-[#a1a1aa] hover:text-white transition"
                  title="Reload Domains"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                { id: "all", label: "All Domains" },
                { id: "active", label: "Active" },
                { id: "pending", label: "Pending" },
                { id: "verifying", label: "Verifying" },
                { id: "ssl_pending", label: "SSL Pending" },
                { id: "disabled", label: "Disabled" },
                { id: "error", label: "Error" },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setDomainFilter(pill.id)}
                  className={`px-3 py-1.5 rounded-full font-medium transition ${
                    domainFilter === pill.id
                      ? "bg-rose-500 text-white font-bold"
                      : "bg-[#18181c] text-[#a1a1aa] hover:text-white border border-[#27272a]"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Domains Table */}
            <div className="bg-[#18181c] border border-[#27272a] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#121215] border-b border-[#27272a] text-[#71717a] uppercase text-[10px] tracking-wider font-bold">
                    <tr>
                      <th className="px-5 py-3">Hostname</th>
                      <th className="px-5 py-3">Site ID</th>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">SSL</th>
                      <th className="px-5 py-3">Provider ID</th>
                      <th className="px-5 py-3">Created</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27272a]">
                    {filteredDomains.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-5 py-12 text-center text-[#71717a]">
                          No domains match the selected criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredDomains.map((domain) => (
                        <tr key={domain.id} className="hover:bg-[#202026] transition">
                          <td className="px-5 py-3.5 font-mono text-white font-semibold">
                            <div className="flex items-center gap-2">
                              <span>{domain.hostname}</span>
                              {domain.isPrimary && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  Primary
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-rose-400">{domain.siteId}</td>
                          <td className="px-5 py-3.5 text-[#a1a1aa]">
                            {domain.type === "threadly_subdomain" ? "Subdomain" : "Custom Domain"}
                          </td>
                          <td className="px-5 py-3.5">
                            {domain.status === "active" ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Active
                              </span>
                            ) : domain.status === "pending" || domain.status === "verifying" ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                {domain.status}
                              </span>
                            ) : domain.status === "disabled" ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400">
                                Disabled
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                {domain.status}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-[#a1a1aa] font-mono text-[11px]">
                            {domain.sslStatus || "—"}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-[11px] text-[#71717a] max-w-[120px] truncate" title={domain.providerHostnameId}>
                            {domain.providerHostnameId || "—"}
                          </td>
                          <td className="px-5 py-3.5 text-[#71717a] text-[11px]">
                            {new Date(domain.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            {domain.status !== "disabled" ? (
                              <button
                                onClick={() => handleDisableDomain(domain.id)}
                                className="px-2.5 py-1 rounded-lg bg-rose-950/40 border border-rose-900/60 hover:bg-rose-900/60 text-rose-300 text-[11px] font-semibold transition"
                              >
                                Disable
                              </button>
                            ) : (
                              <span className="text-[#71717a] text-[11px]">Disabled</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="bg-[#18181c] border border-[#27272a] rounded-2xl p-6 space-y-6 max-w-xl">
            <h3 className="font-bold text-white text-base">Site Security & Allowed Origins</h3>
            <p className="text-xs text-[#a1a1aa]">
              Only requests originating from allowed domains will be permitted to load comments or submit data.
            </p>

            <div className="space-y-3">
              <div className="p-3 bg-[#24242a] rounded-xl border border-[#2e2e38] text-xs font-mono text-emerald-400">
                http://localhost:5175
              </div>
              <div className="p-3 bg-[#24242a] rounded-xl border border-[#2e2e38] text-xs font-mono text-emerald-400">
                https://mistscans.com
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
