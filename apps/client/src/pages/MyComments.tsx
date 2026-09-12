import React, { useState, useEffect } from "react";
import { MessageSquare, ExternalLink, MessageCircle, Clock } from "lucide-react";

export default function MyComments() {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3000/api/v1/users/me/comments", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setComments(data.data.items || []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">My Comments</h1>
        <p className="text-xs text-[#a1a1aa]">
          Every comment you've posted across all Threadly-powered websites.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-[#71717a] text-sm">Loading your comments...</div>
      ) : comments.length === 0 ? (
        <div className="bg-[#18181c] border border-[#27272a] rounded-2xl p-12 text-center text-[#71717a]">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">You haven't posted any comments yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-[#18181c] border border-[#27272a] hover:border-[#383842] rounded-2xl p-5 transition space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{comment.siteName}</span>
                  <span className="text-[#3f3f46]">•</span>
                  <span className="text-xs text-rose-400 font-medium">{comment.pageId}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#71717a]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                  <a
                    href={comment.pageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white transition flex items-center gap-1"
                  >
                    View Page <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <p className="text-sm text-[#e4e4e7] leading-relaxed">
                "{comment.content}"
              </p>

              <div className="flex items-center gap-4 text-xs text-[#a1a1aa] pt-1">
                <span className="flex items-center gap-1.5 font-medium">
                  <MessageCircle className="w-3.5 h-3.5 text-rose-400" />
                  {comment.replyCount} {comment.replyCount === 1 ? "reply" : "replies"}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] bg-[#27272a] text-[#a1a1aa]">
                  {comment.moderationStatus}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
