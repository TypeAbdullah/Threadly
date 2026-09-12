export interface AvatarDecoration {
  id: string;
  name: string;
  ringClass: string;
  glowColor: string;
  badge?: string;
}

export const AVATAR_DECORATIONS: AvatarDecoration[] = [
  {
    id: "none",
    name: "None",
    ringClass: "ring-0",
    glowColor: "transparent",
  },
  {
    id: "neon-cyan",
    name: "Cyber Neon",
    ringClass: "ring-2 ring-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.6)]",
    glowColor: "rgba(34, 211, 238, 0.6)",
    badge: "⚡",
  },
  {
    id: "crimson-flame",
    name: "Crimson Flame",
    ringClass: "ring-2 ring-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]",
    glowColor: "rgba(244, 63, 94, 0.6)",
    badge: "🔥",
  },
  {
    id: "gold-aura",
    name: "Golden Wreath",
    ringClass: "ring-2 ring-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)]",
    glowColor: "rgba(251, 191, 36, 0.6)",
    badge: "👑",
  },
  {
    id: "void-purple",
    name: "Void Astral",
    ringClass: "ring-2 ring-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.6)]",
    glowColor: "rgba(168, 85, 247, 0.6)",
    badge: "🌌",
  },
  {
    id: "emerald-glow",
    name: "Emerald Matrix",
    ringClass: "ring-2 ring-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]",
    glowColor: "rgba(52, 211, 153, 0.6)",
    badge: "💎",
  },
];

export const getDecoration = (id?: string): AvatarDecoration => {
  return AVATAR_DECORATIONS.find((d) => d.id === id) || AVATAR_DECORATIONS[0];
};

export const THREADLY_THEME = {
  dark: {
    bg: "#121214",
    surface: "#1a1a1e",
    surfaceHover: "#232328",
    border: "#27272a",
    textPrimary: "#f4f4f5",
    textSecondary: "#a1a1aa",
    accent: "#f43f5e",
  },
};
