import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";

export default function Login({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleDevLogin = async (username: string) => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/v1/auth/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
        credentials: "include",
      });

      if (res.ok) {
        onLoginSuccess();
        navigate("/");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="bg-[#18181c] border border-[#27272a] rounded-2xl p-8 text-center shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 mx-auto flex items-center justify-center text-2xl mb-4 shadow-lg shadow-rose-950/50">
          💬
        </div>

        <h2 className="text-xl font-bold text-white mb-2">Be part of the discussion</h2>
        <p className="text-xs text-[#a1a1aa] mb-8">
          Sign in to <strong className="text-white">Threadly</strong> to comment, reply, and personalize your profile.
        </p>

        {/* OAuth Buttons */}
        <div className="space-y-3 mb-8">
          <button
            onClick={() => handleDevLogin("kimchi")}
            disabled={loading}
            className="w-full py-3 px-4 rounded-full bg-white hover:bg-[#e4e4e7] text-[#09090b] font-semibold text-xs transition flex items-center justify-center gap-3 shadow-md"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/><path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 17.4C3.7 21.1 7.5 24 12 24z"/></svg>
            Continue with Google
          </button>

          <button
            onClick={() => handleDevLogin("reader")}
            disabled={loading}
            className="w-full py-3 px-4 rounded-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold text-xs transition flex items-center justify-center gap-3 shadow-md shadow-[#5865F2]/20"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
            Continue with Discord
          </button>
        </div>

        {/* 1-Click Dev Testing Profiles */}
        <div className="pt-6 border-t border-[#27272a] text-left">
          <span className="text-[11px] font-bold text-[#71717a] uppercase tracking-wider block mb-3">
            Quick Dev Test Accounts
          </span>
          <div className="space-y-2">
            <button
              onClick={() => handleDevLogin("kimchi")}
              className="w-full p-2.5 rounded-xl bg-[#24242a] hover:bg-[#2b2b32] text-xs font-semibold text-white flex items-center justify-between transition border border-[#2f2f38]"
            >
              <span>👤 Aged Kimchi (@Kimchi)</span>
              <span className="text-rose-400 text-[10px]">Screenshot User →</span>
            </button>
            <button
              onClick={() => handleDevLogin("reader")}
              className="w-full p-2.5 rounded-xl bg-[#24242a] hover:bg-[#2b2b32] text-xs font-semibold text-white flex items-center justify-between transition border border-[#2f2f38]"
            >
              <span>👤 Reader (@Reader)</span>
              <span className="text-[#a1a1aa] text-[10px]">Active Reader →</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
