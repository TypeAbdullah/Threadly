import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import { ThreadlyUser } from "@threadly/types";
import { MessageSquare, Bell, User, Globe, LogIn, LogOut, Code, Shield } from "lucide-react";
import Home from "./pages/Home";
import Login from "./pages/Login";
import MyComments from "./pages/MyComments";
import MyReplies from "./pages/MyReplies";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Sites from "./pages/Sites";

export default function App() {
  const [currentUser, setCurrentUser] = useState<ThreadlyUser | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const fetchSession = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/v1/users/me/profile", {
        credentials: "include",
      });
      if (res.ok) {
        const json = await res.json();
        setCurrentUser(json.data);
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [location.pathname]);

  const handleLogout = async () => {
    await fetch("http://localhost:3000/api/v1/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setCurrentUser(null);
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-[#27272a] bg-[#121214]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                <span className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#f43f5e] to-[#ec4899] flex items-center justify-center text-white text-base">
                  💬
                </span>
                THREADLY
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  location.pathname === "/" ? "bg-[#1f1f23] text-white" : "text-[#a1a1aa] hover:text-white"
                }`}
              >
                Overview
              </Link>
              {currentUser && (
                <>
                  <Link
                    to="/comments"
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      location.pathname === "/comments" ? "bg-[#1f1f23] text-white" : "text-[#a1a1aa] hover:text-white"
                    }`}
                  >
                    My Comments
                  </Link>
                  <Link
                    to="/replies"
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      location.pathname === "/replies" ? "bg-[#1f1f23] text-white" : "text-[#a1a1aa] hover:text-white"
                    }`}
                  >
                    My Replies
                  </Link>
                  <Link
                    to="/notifications"
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      location.pathname === "/notifications" ? "bg-[#1f1f23] text-white" : "text-[#a1a1aa] hover:text-white"
                    }`}
                  >
                    Notifications
                  </Link>
                  <Link
                    to="/sites"
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      location.pathname.startsWith("/sites") ? "bg-[#1f1f23] text-white" : "text-[#a1a1aa] hover:text-white"
                    }`}
                  >
                    My Sites
                  </Link>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/profile"
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#18181c] border border-[#27272a] hover:border-[#3f3f46] transition"
                >
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.displayName}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <span className="text-xs font-semibold text-rose-400">
                    @{currentUser.username}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-xs text-[#a1a1aa] hover:text-rose-400 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 text-xs font-bold rounded-full bg-white text-[#09090b] hover:bg-[#e4e4e7] transition flex items-center gap-2"
              >
                <LogIn className="w-3.5 h-3.5" /> Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home user={currentUser} />} />
          <Route path="/login" element={<Login onLoginSuccess={fetchSession} />} />
          <Route path="/comments" element={<MyComments />} />
          <Route path="/replies" element={<MyReplies />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile user={currentUser} onProfileUpdated={fetchSession} />} />
          <Route path="/sites" element={<Sites user={currentUser} />} />
        </Routes>
      </main>
    </div>
  );
}
