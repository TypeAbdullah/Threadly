import React, { useState, useEffect } from "react";
import { CornerDownRight, Clock } from "lucide-react";

export default function MyReplies() {
  const [replies, setReplies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3000/api/v1/users/me/replies", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setReplies(data.data.items || []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">My Replies</h1>
        <p className="text-xs text-[#a1a1aa]">Responses and nested replies you've made to other commenters.</p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-[#71717a] text-sm">Loading your replies...</div>
      ) : replies.length === 0 ? (
        <div className="bg-[#18181c] border border-[#27272a] rounded-2xl p-12 text-center text-[#71717a]">
          <CornerDownRight className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">You haven't replied to any comments yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {replies.map((reply) => (
            <div
              key={reply.id}
              className="bg-[#18181c] border border-[#27272a] rounded-2xl p-5 space-y-2.5"
            >
              <div className="flex items-center justify-between text-xs text-[#71717a]">
                <div className="flex items-center gap-2">
                  <CornerDownRight className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-white font-semibold">{reply.siteId}</span>
                  <span>•</span>
                  <span>{reply.pageId}</span>
                </div>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(reply.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-[#e4e4e7] pl-5 border-l-2 border-rose-500/40">
                "{reply.content}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
