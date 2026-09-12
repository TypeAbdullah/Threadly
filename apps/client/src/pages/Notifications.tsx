import React, { useState, useEffect } from "react";
import { Bell, Check, MessageSquare, ShieldAlert } from "lucide-react";

export default function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = () => {
    fetch("http://localhost:3000/api/v1/users/me/notifications", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setNotifications(data.data.items || []);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    await fetch(`http://localhost:3000/api/v1/users/me/notifications/${id}/read`, {
      method: "PATCH",
      credentials: "include",
    });
    fetchNotifications();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Notifications</h1>
        <p className="text-xs text-[#a1a1aa]">Updates on replies to your comments and moderation reviews.</p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-[#71717a] text-sm">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="bg-[#18181c] border border-[#27272a] rounded-2xl p-12 text-center text-[#71717a]">
          <Bell className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">You're all caught up! No notifications.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-xl border flex items-center justify-between transition ${
                notif.read
                  ? "bg-[#18181c] border-[#27272a] text-[#a1a1aa]"
                  : "bg-[#1f1f26] border-rose-500/30 text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center">
                  {notif.type === "reply" ? <MessageSquare className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold">{notif.title}</h4>
                  <p className="text-xs text-[#71717a]">{notif.body}</p>
                </div>
              </div>

              {!notif.read && (
                <button
                  onClick={() => markAsRead(notif.id)}
                  className="px-3 py-1 rounded-full bg-[#27272a] hover:bg-[#323238] text-[11px] font-semibold text-white flex items-center gap-1 transition"
                >
                  <Check className="w-3 h-3" /> Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
