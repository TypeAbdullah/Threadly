import React, { useState, useEffect } from "react";
import { ThreadlyUser } from "@threadly/types";
import { AVATAR_DECORATIONS, getDecoration } from "@threadly/ui";
import { Save, LogOut, Check, AlertCircle } from "lucide-react";

interface ProfileProps {
  user: ThreadlyUser | null;
  onProfileUpdated: () => void;
}

export default function Profile({ user, onProfileUpdated }: ProfileProps) {
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [username, setUsername] = useState(user?.username || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarDecoration, setAvatarDecoration] = useState(user?.avatarDecoration || "none");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setUsername(user.username);
      setBio(user.bio || "");
      setAvatarDecoration(user.avatarDecoration || "none");
    }
  }, [user]);

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-[#a1a1aa] mb-4">Please sign in to view and edit your profile.</p>
        <a href="/login" className="px-5 py-2.5 rounded-full bg-white text-black font-semibold text-sm">
          Sign In
        </a>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("http://localhost:3000/api/v1/users/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          username,
          bio,
          avatarDecoration,
        }),
        credentials: "include",
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setMessage({ type: "success", text: "Profile saved successfully!" });
        onProfileUpdated();
      } else {
        setMessage({ type: "error", text: json.error?.message || "Failed to update profile." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error saving profile." });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await fetch("http://localhost:3000/api/v1/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    window.location.href = "/login";
  };

  const currentDecoration = getDecoration(avatarDecoration);

  return (
    <div className="max-w-md mx-auto">
      {/* Modal card styled after Screenshot 2 */}
      <div className="bg-[#18181c] border border-[#27272a] rounded-2xl p-7 shadow-2xl relative">
        <div className="flex justify-end mb-1">
          <button
            onClick={() => window.history.back()}
            className="text-[#71717a] hover:text-white text-xl transition"
          >
            ✕
          </button>
        </div>

        {/* Circular Avatar with Decoration Ring */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="relative">
            <img
              src={user.avatarUrl}
              alt={displayName}
              className={`w-24 h-24 rounded-full object-cover ${currentDecoration.ringClass}`}
            />
            {currentDecoration.badge && (
              <span className="absolute -bottom-1 -right-1 text-base bg-[#27272a] rounded-full px-1.5 py-0.5 border border-[#3f3f46]">
                {currentDecoration.badge}
              </span>
            )}
          </div>
        </div>

        {message && (
          <div
            className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
              message.type === "success"
                ? "bg-emerald-950/60 border border-emerald-800 text-emerald-300"
                : "bg-rose-950/60 border border-rose-800 text-rose-300"
            }`}
          >
            {message.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-white mb-2">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-[#24242a] border border-[#32323a] focus:border-[#f43f5e] rounded-xl px-4 py-3 text-sm text-white outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-white mb-2">Username</label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-[#71717a] text-sm">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                className="w-full bg-[#24242a] border border-[#32323a] focus:border-[#f43f5e] rounded-xl pl-9 pr-4 py-3 text-sm text-white outline-none transition"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-white">Bio</label>
              <span className="text-[11px] text-[#71717a]">{bio.length}/500</span>
            </div>
            <textarea
              value={bio}
              maxLength={500}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Say something about yourself..."
              rows={3}
              className="w-full bg-[#24242a] border border-[#32323a] focus:border-[#f43f5e] rounded-xl px-4 py-3 text-sm text-white outline-none resize-none transition placeholder:text-[#71717a]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-white mb-2">Avatar Decoration</label>
            <select
              value={avatarDecoration}
              onChange={(e) => setAvatarDecoration(e.target.value)}
              className="w-full bg-[#24242a] border border-[#32323a] focus:border-[#f43f5e] rounded-xl px-4 py-3 text-sm text-white outline-none transition"
            >
              {AVATAR_DECORATIONS.map((dec) => (
                <option key={dec.id} value={dec.id}>
                  {dec.name} {dec.badge || ""}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#24242a]">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-full bg-[#27272a] hover:bg-[#323238] border border-[#3f3f46] text-white font-semibold text-xs transition flex items-center gap-2"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="px-5 py-2.5 rounded-full bg-[#f43f5e] hover:bg-[#e11d48] text-white font-semibold text-xs transition flex items-center gap-2 shadow-lg shadow-rose-950/50"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
