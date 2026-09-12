import React, { useState, useEffect } from "react";
import { ThreadlyUser, Site, Domain } from "@threadly/types";
import {
  Globe,
  Plus,
  Key,
  Shield,
  Code,
  Check,
  Copy,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Star,
  Clock,
  X,
  ChevronRight,
} from "lucide-react";

export default function Sites({ user }: { user: ThreadlyUser | null }) {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [siteId, setSiteId] = useState("");
  const [origin, setOrigin] = useState("http://localhost:5175");
  const [subdomainInput, setSubdomainInput] = useState("");
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [subdomainChecking, setSubdomainChecking] = useState(false);
  const [createdKeys, setCreatedKeys] = useState<{ publicKey: string; privateKey: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Domain Manager modal state
  const [managingSite, setManagingSite] = useState<Site | null>(null);
  const [siteDomains, setSiteDomains] = useState<Domain[]>([]);
  const [loadingDomains, setLoadingDomains] = useState(false);
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [customDomainInput, setCustomDomainInput] = useState("");
  const [subdomainClaimInput, setSubdomainClaimInput] = useState("");
  const [domainError, setDomainError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchSites = () => {
    fetch("http://localhost:3000/api/v1/sites", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSites(data.data.items || []);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSites();
  }, []);

  // Fetch domains for selected site
  const fetchDomains = async (targetSiteId: string) => {
    setLoadingDomains(true);
    setDomainError(null);
    try {
      const res = await fetch(`http://localhost:3000/api/v1/sites/${targetSiteId}/domains`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setSiteDomains(data.data.items || []);
      }
    } catch {
      setDomainError("Failed to load domains");
    } finally {
      setLoadingDomains(false);
    }
  };

  // Open domain management modal
  const openDomainManager = (site: Site) => {
    setManagingSite(site);
    setSubdomainClaimInput(site.siteId);
    fetchDomains(site.siteId);
  };

  // Auto-refresh pending domains every 15s while domain manager is open
  useEffect(() => {
    if (!managingSite) return;

    const hasPending = siteDomains.some(
      (d) => d.status === "pending" || d.status === "verifying" || d.status === "ssl_pending"
    );
    if (!hasPending) return;

    const timer = setInterval(() => {
      fetchDomains(managingSite.siteId);
    }, 15000);

    return () => clearInterval(timer);
  }, [managingSite, siteDomains]);

  // Check subdomain availability as user types in create site form
  useEffect(() => {
    const slug = subdomainInput.trim().toLowerCase();
    if (!slug || slug.length < 3) {
      setSubdomainAvailable(null);
      return;
    }

    setSubdomainChecking(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(
          `http://localhost:3000/api/v1/sites/temp/subdomain/availability?subdomain=${encodeURIComponent(
            slug
          )}`,
          { credentials: "include" }
        );
        const data = await res.json();
        setSubdomainAvailable(data.success && data.data.available);
      } catch {
        setSubdomainAvailable(null);
      } finally {
        setSubdomainChecking(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [subdomainInput]);

  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cleanSiteId = siteId.toLowerCase().replace(/[^a-z0-9-_]/g, "");
      const res = await fetch("http://localhost:3000/api/v1/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          siteId: cleanSiteId,
          allowedOrigins: [origin],
        }),
        credentials: "include",
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setCreatedKeys({
          publicKey: json.data.publicKey,
          privateKey: json.data.privateKey,
        });

        // Provision subdomain if specified
        if (subdomainInput.trim()) {
          try {
            await fetch(`http://localhost:3000/api/v1/sites/${cleanSiteId}/subdomain`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ subdomain: subdomainInput.trim().toLowerCase() }),
              credentials: "include",
            });
          } catch (subErr) {
            console.warn("Subdomain auto-provision note:", subErr);
          }
        }

        setIsCreating(false);
        setName("");
        setSiteId("");
        setSubdomainInput("");
        fetchSites();
      } else {
        alert(json.error?.message || "Failed to create site");
      }
    } catch {
      alert("Error creating site");
    }
  };

  // Add custom domain
  const handleAddCustomDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingSite) return;

    // Client-side validation
    let hostname = customDomainInput.trim().toLowerCase();
    if (hostname.includes("://") || hostname.includes("/") || hostname.includes(" ")) {
      setDomainError("Please enter a valid hostname without protocol, spaces, or paths (e.g. comments.mysite.com)");
      return;
    }

    setActionLoadingId("add-domain");
    setDomainError(null);
    try {
      const res = await fetch(`http://localhost:3000/api/v1/sites/${managingSite.siteId}/domains`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostname }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCustomDomainInput("");
        setIsAddingDomain(false);
        fetchDomains(managingSite.siteId);
      } else {
        setDomainError(data.error?.message || "Failed to add custom domain");
      }
    } catch {
      setDomainError("Network error while adding domain");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Provision / Claim Threadly Subdomain
  const handleClaimSubdomain = async () => {
    if (!managingSite) return;
    setActionLoadingId("claim-subdomain");
    setDomainError(null);
    try {
      const res = await fetch(`http://localhost:3000/api/v1/sites/${managingSite.siteId}/subdomain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subdomain: subdomainClaimInput.trim() || undefined }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchDomains(managingSite.siteId);
        fetchSites();
      } else {
        setDomainError(data.error?.message || "Failed to claim subdomain");
      }
    } catch {
      setDomainError("Network error while claiming subdomain");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Trigger manual verification check
  const handleVerifyDomain = async (domainId: string) => {
    if (!managingSite) return;
    setActionLoadingId(`verify-${domainId}`);
    setDomainError(null);
    try {
      const res = await fetch(
        `http://localhost:3000/api/v1/sites/${managingSite.siteId}/domains/${domainId}/verify`,
        { method: "POST", credentials: "include" }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        fetchDomains(managingSite.siteId);
        fetchSites();
      } else {
        setDomainError(data.error?.message || "Verification check failed");
      }
    } catch {
      setDomainError("Verification check failed");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Set as primary domain
  const handleSetPrimary = async (domainId: string) => {
    if (!managingSite) return;
    setActionLoadingId(`primary-${domainId}`);
    setDomainError(null);
    try {
      const res = await fetch(
        `http://localhost:3000/api/v1/sites/${managingSite.siteId}/domains/${domainId}/set-primary`,
        { method: "POST", credentials: "include" }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        fetchDomains(managingSite.siteId);
        fetchSites();
      } else {
        setDomainError(data.error?.message || "Could not set domain as primary");
      }
    } catch {
      setDomainError("Failed to update primary domain");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Remove domain
  const handleRemoveDomain = async (domainId: string, hostname: string) => {
    if (!managingSite) return;
    if (!confirm(`Are you sure you want to disconnect ${hostname}?`)) return;

    setActionLoadingId(`remove-${domainId}`);
    setDomainError(null);
    try {
      const res = await fetch(
        `http://localhost:3000/api/v1/sites/${managingSite.siteId}/domains/${domainId}`,
        { method: "DELETE", credentials: "include" }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        fetchDomains(managingSite.siteId);
        fetchSites();
      } else {
        setDomainError(data.error?.message || "Failed to remove domain");
      }
    } catch {
      setDomainError("Failed to delete domain");
    } finally {
      setActionLoadingId(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">My Threadly Sites</h1>
          <p className="text-xs text-[#a1a1aa]">
            Register websites, configure Cloudflare subdomains and customer custom domains to embed Threadly.
          </p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-4 py-2 rounded-full bg-white text-black font-semibold text-xs transition hover:bg-[#e4e4e7] flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Site
        </button>
      </div>

      {createdKeys && (
        <div className="bg-emerald-950/40 border border-emerald-800/80 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <Key className="w-4 h-4" /> Site Created Successfully!
          </div>
          <p className="text-xs text-emerald-200">
            Save your private API key now. It will <strong>never be shown again</strong>.
          </p>
          <div className="space-y-2 text-xs font-mono">
            <div className="p-3 bg-black/40 rounded-xl flex items-center justify-between border border-emerald-900/50">
              <span className="text-[#a1a1aa]">Public Key: {createdKeys.publicKey}</span>
            </div>
            <div className="p-3 bg-black/40 rounded-xl flex items-center justify-between border border-emerald-900/50 text-rose-300">
              <span>Private Secret: {createdKeys.privateKey}</span>
              <button
                onClick={() => copyToClipboard(createdKeys.privateKey, "secret")}
                className="text-xs text-white hover:underline flex items-center gap-1"
              >
                {copiedKey === "secret" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {isCreating && (
        <form
          onSubmit={handleCreateSite}
          className="bg-[#18181c] border border-[#27272a] rounded-2xl p-6 space-y-4 max-w-lg"
        >
          <h3 className="text-sm font-bold text-white">Create New Threadly Site</h3>
          <div>
            <label className="block text-xs font-semibold text-white mb-1">Site Name</label>
            <input
              type="text"
              placeholder="e.g. Mist Scans or Tech Blog"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!siteId) {
                  setSiteId(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "-"));
                  setSubdomainInput(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "-"));
                }
              }}
              className="w-full bg-[#24242a] border border-[#32323a] rounded-xl px-3 py-2 text-xs text-white outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-white mb-1">Site ID (slug)</label>
            <input
              type="text"
              placeholder="e.g. mist-scans"
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              className="w-full bg-[#24242a] border border-[#32323a] rounded-xl px-3 py-2 text-xs text-white outline-none"
              required
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-white">Threadly Subdomain (Optional)</label>
              {subdomainInput.length >= 3 && (
                <span className="text-[11px] flex items-center gap-1">
                  {subdomainChecking ? (
                    <span className="text-[#a1a1aa]">Checking...</span>
                  ) : subdomainAvailable === true ? (
                    <span className="text-emerald-400 font-medium">✓ Available</span>
                  ) : subdomainAvailable === false ? (
                    <span className="text-rose-400 font-medium">✗ Taken</span>
                  ) : null}
                </span>
              )}
            </div>
            <div className="flex items-center bg-[#24242a] border border-[#32323a] rounded-xl px-3 py-2">
              <input
                type="text"
                placeholder="my-manga"
                value={subdomainInput}
                onChange={(e) => setSubdomainInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                className="w-full bg-transparent text-xs text-white outline-none font-mono"
              />
              <span className="text-xs text-[#71717a] font-mono select-none">.threadly.com</span>
            </div>
            <p className="text-[11px] text-[#71717a] mt-1">
              Leave blank to automatically generate from site name.
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-white mb-1">Allowed Origin (CORS)</label>
            <input
              type="text"
              placeholder="e.g. https://mistscans.com or http://localhost:5175"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full bg-[#24242a] border border-[#32323a] rounded-xl px-3 py-2 text-xs text-white outline-none"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 rounded-full bg-[#27272a] text-xs font-semibold text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-full bg-rose-500 text-xs font-semibold text-white hover:bg-rose-600 transition"
            >
              Create Site
            </button>
          </div>
        </form>
      )}

      {/* Sites list */}
      <div className="grid md:grid-cols-2 gap-6">
        {sites.map((site) => (
          <div key={site.siteId} className="bg-[#18181c] border border-[#27272a] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">{site.name}</h3>
                <span className="text-xs text-rose-400 font-mono">siteId: {site.siteId}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openDomainManager(site)}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-[#27272a] text-white hover:bg-[#32323a] transition flex items-center gap-1.5 border border-[#3f3f46]"
                >
                  <Globe className="w-3.5 h-3.5 text-rose-400" />
                  Domains
                </button>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Active
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-[#a1a1aa]">
              <div>Allowed Origins:</div>
              <div className="flex flex-wrap gap-1.5">
                {site.allowedOrigins.map((orig) => (
                  <span key={orig} className="px-2 py-0.5 rounded bg-[#24242a] font-mono text-[11px] text-white">
                    {orig}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#27272a] flex items-center justify-between text-xs">
              <span className="text-[#71717a] font-mono text-[11px]">
                {site.publicKey.slice(0, 14)}...
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => openDomainManager(site)}
                  className="text-white hover:text-rose-400 font-medium text-xs flex items-center gap-1 transition"
                >
                  Manage Hostnames <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ======================================================== */}
      {/* DOMAIN MANAGEMENT MODAL                                  */}
      {/* ======================================================== */}
      {managingSite && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#121215] border border-[#27272a] rounded-3xl w-full max-w-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#27272a] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Domain Management</h2>
                    <p className="text-xs text-[#a1a1aa]">
                      Configure hostnames for <strong className="text-white">{managingSite.name}</strong> ({managingSite.siteId})
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setManagingSite(null)}
                className="p-1.5 rounded-full text-[#a1a1aa] hover:text-white hover:bg-[#27272a] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {domainError && (
              <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-xl text-xs text-rose-200 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  {domainError}
                </span>
                <button onClick={() => setDomainError(null)} className="text-rose-400 hover:text-white">
                  ✕
                </button>
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white tracking-wide uppercase">Connected Hostnames</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchDomains(managingSite.siteId)}
                  disabled={loadingDomains}
                  className="p-2 rounded-xl bg-[#1e1e24] text-[#a1a1aa] hover:text-white transition border border-[#2e2e36]"
                  title="Refresh Domains"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingDomains ? "animate-spin" : ""}`} />
                </button>
                <button
                  onClick={() => setIsAddingDomain(!isAddingDomain)}
                  className="px-3 py-1.5 rounded-xl bg-rose-500 text-white font-semibold text-xs transition hover:bg-rose-600 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Custom Domain
                </button>
              </div>
            </div>

            {/* Add Custom Domain Form */}
            {isAddingDomain && (
              <form
                onSubmit={handleAddCustomDomain}
                className="bg-[#18181c] border border-[#32323a] rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Connect Custom Domain</span>
                  <button
                    type="button"
                    onClick={() => setIsAddingDomain(false)}
                    className="text-xs text-[#71717a] hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#a1a1aa] mb-1">
                    Domain or Subdomain
                  </label>
                  <input
                    type="text"
                    placeholder="comments.mysite.com"
                    value={customDomainInput}
                    onChange={(e) => setCustomDomainInput(e.target.value)}
                    className="w-full bg-[#24242a] border border-[#32323a] rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-rose-500 transition"
                    required
                  />
                  <p className="text-[11px] text-[#71717a] mt-1">
                    Enter the exact hostname where Threadly comments will be embedded or routed.
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingDomain(false)}
                    className="px-3 py-1.5 rounded-lg bg-[#27272a] text-xs font-medium text-white hover:bg-[#32323a]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoadingId === "add-domain"}
                    className="px-4 py-1.5 rounded-lg bg-rose-500 text-xs font-semibold text-white hover:bg-rose-600 transition flex items-center gap-1.5"
                  >
                    {actionLoadingId === "add-domain" ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" /> Provisioning...
                      </>
                    ) : (
                      "Add Domain"
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Check if site has a Threadly-owned subdomain */}
            {siteDomains.filter((d) => d.type === "threadly_subdomain").length === 0 && (
              <div className="bg-[#18181c] border border-dashed border-[#32323a] rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-white text-xs font-bold">
                  <Globe className="w-4 h-4 text-rose-400" />
                  <span>No Threadly Subdomain Provisioned</span>
                </div>
                <p className="text-xs text-[#a1a1aa]">
                  Reserve a fast, global Cloudflare-proxied subdomain for your site (e.g.{" "}
                  <code>{managingSite.siteId}.threadly.com</code>).
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center bg-[#24242a] border border-[#32323a] rounded-xl px-3 py-2">
                    <input
                      type="text"
                      placeholder={managingSite.siteId}
                      value={subdomainClaimInput}
                      onChange={(e) => setSubdomainClaimInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      className="w-full bg-transparent text-xs text-white outline-none font-mono"
                    />
                    <span className="text-xs text-[#71717a] font-mono select-none">.threadly.com</span>
                  </div>
                  <button
                    onClick={handleClaimSubdomain}
                    disabled={actionLoadingId === "claim-subdomain"}
                    className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-[#e4e4e7] transition flex items-center gap-1.5"
                  >
                    {actionLoadingId === "claim-subdomain" ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      "Claim Subdomain"
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Domains List */}
            <div className="space-y-4">
              {loadingDomains && siteDomains.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#71717a] flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Loading hostnames...
                </div>
              ) : (
                siteDomains.map((domain) => {
                  const isActive = domain.status === "active";
                  const isPending = domain.status === "pending" || domain.status === "verifying";
                  const isSslPending = domain.status === "ssl_pending";

                  return (
                    <div
                      key={domain.id}
                      className="bg-[#18181c] border border-[#27272a] rounded-2xl p-5 space-y-4 transition hover:border-[#383842]"
                    >
                      {/* Domain Header Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white font-mono">{domain.hostname}</span>
                            {domain.isPrimary && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                <Star className="w-3 h-3 fill-amber-400" /> Primary
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[#a1a1aa]">
                            <span>
                              {domain.type === "threadly_subdomain" ? "Threadly Subdomain" : "Custom Domain"}
                            </span>
                            <span>•</span>
                            <span>Provider: Cloudflare</span>
                            {domain.sslStatus && (
                              <>
                                <span>•</span>
                                <span className={domain.sslStatus === "active" ? "text-emerald-400" : "text-amber-400"}>
                                  SSL: {domain.sslStatus}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                          {isActive && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                              Active
                            </span>
                          )}
                          {(isPending || isSslPending) && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              {isSslPending ? "SSL Pending" : "Pending Verification"}
                            </span>
                          )}
                          {domain.status === "error" && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Error
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Verification Instructions Card (For Custom Domains not yet active) */}
                      {domain.type === "custom" && !isActive && domain.dnsRecords && domain.dnsRecords.length > 0 && (
                        <div className="bg-[#121215] border border-amber-900/40 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-amber-300 flex items-center gap-1.5">
                              <AlertCircle className="w-4 h-4 text-amber-400" />
                              Required DNS Configuration
                            </span>
                            <span className="text-[11px] text-[#a1a1aa]">Add at your DNS provider</span>
                          </div>
                          <p className="text-[11px] text-[#a1a1aa]">
                            To route traffic and provision automatic Cloudflare SSL for{" "}
                            <strong className="text-white">{domain.hostname}</strong>, add the following record(s):
                          </p>

                          <div className="space-y-2">
                            {domain.dnsRecords.map((rec, i) => (
                              <div
                                key={i}
                                className="bg-black/50 border border-[#27272a] rounded-lg p-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono"
                              >
                                <div>
                                  <span className="text-[10px] text-[#71717a] block uppercase font-sans font-bold">
                                    Type
                                  </span>
                                  <span className="text-white font-bold">{rec.type}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-[#71717a] block uppercase font-sans font-bold">
                                    Name / Host
                                  </span>
                                  <div className="flex items-center justify-between gap-1 text-rose-300">
                                    <span className="truncate">{rec.name}</span>
                                    <button
                                      onClick={() => copyToClipboard(rec.name, `rec-name-${i}`)}
                                      className="text-[#71717a] hover:text-white"
                                    >
                                      {copiedKey === `rec-name-${i}` ? (
                                        <Check className="w-3 h-3 text-emerald-400" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                                <div>
                                  <span className="text-[10px] text-[#71717a] block uppercase font-sans font-bold">
                                    Value / Target
                                  </span>
                                  <div className="flex items-center justify-between gap-1 text-emerald-300">
                                    <span className="truncate">{rec.value}</span>
                                    <button
                                      onClick={() => copyToClipboard(rec.value, `rec-val-${i}`)}
                                      className="text-[#71717a] hover:text-white"
                                    >
                                      {copiedKey === `rec-val-${i}` ? (
                                        <Check className="w-3 h-3 text-emerald-400" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Domain Action Buttons */}
                      <div className="pt-2 border-t border-[#27272a] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {!domain.isPrimary && isActive && (
                            <button
                              onClick={() => handleSetPrimary(domain.id)}
                              disabled={actionLoadingId === `primary-${domain.id}`}
                              className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#24242a] text-white hover:bg-[#32323a] transition flex items-center gap-1"
                            >
                              <Star className="w-3 h-3" /> Set Primary
                            </button>
                          )}
                          {domain.type === "custom" && !isActive && (
                            <button
                              onClick={() => handleVerifyDomain(domain.id)}
                              disabled={actionLoadingId === `verify-${domain.id}`}
                              className="px-3 py-1 rounded-lg text-xs font-semibold bg-white text-black hover:bg-[#e4e4e7] transition flex items-center gap-1.5"
                            >
                              <RefreshCw
                                className={`w-3 h-3 ${
                                  actionLoadingId === `verify-${domain.id}` ? "animate-spin" : ""
                                }`}
                              />
                              Check Status
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyToClipboard(`https://${domain.hostname}`, `url-${domain.id}`)}
                            className="p-1.5 rounded-lg text-[#71717a] hover:text-white transition"
                            title="Copy Hostname URL"
                          >
                            {copiedKey === `url-${domain.id}` ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleRemoveDomain(domain.id, domain.hostname)}
                            disabled={actionLoadingId === `remove-${domain.id}`}
                            className="p-1.5 rounded-lg text-[#71717a] hover:text-rose-400 transition"
                            title="Disconnect Domain"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Notice */}
            <div className="border-t border-[#27272a] pt-4 flex items-center justify-between text-xs text-[#71717a]">
              <span>Powered by Cloudflare Custom Hostnames & DNS.</span>
              <button
                onClick={() => setManagingSite(null)}
                className="px-4 py-1.5 rounded-xl bg-[#27272a] text-white font-medium hover:bg-[#32323a] transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
