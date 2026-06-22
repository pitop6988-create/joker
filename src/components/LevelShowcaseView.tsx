import React from "react";
import { motion } from "motion/react";
import { ChevronLeft } from "lucide-react";
import { LevelBadge } from "../App";

export const levelRanges = [
  { min: 1, max: 16, label: "LV 1–16" },
  { min: 17, max: 32, label: "LV 17–32" },
  { min: 33, max: 48, label: "LV 33–48" },
  { min: 49, max: 64, label: "LV 49–64" },
  { min: 65, max: 80, label: "LV 65–80" },
  { min: 81, max: 100, label: "LV 81–100" },
  { min: 101, max: 120, label: "LV 101–120" },
];

export function AvatarFrame({
  level,
  className = "w-[60px] h-[60px]",
  src,
}: {
  level: number;
  className?: string;
  src?: string;
}) {
  let theme = {
    outer: "border-[#82a4a1] bg-[#a1c4c1]",
    badge: "from-[#82a4a1] to-[#608584]",
    gem: "#569b82",
  };

  if (level >= 101)
    theme = {
      outer: "border-[#ffd84a] bg-[#ffec8b] !border-4",
      badge: "from-[#ffd84a] to-[#d6961c]",
      gem: "#ff003c",
    };
  else if (level >= 81)
    theme = {
      outer: "border-[#ffa1d6] bg-[#ffcce7] !border-[3px]",
      badge: "from-[#ffa1d6] to-[#d85c9f]",
      gem: "#ff0084",
    };
  else if (level >= 65)
    theme = {
      outer: "border-[#b176ff] bg-[#cd9eff]",
      badge: "from-[#b176ff] to-[#7c38db]",
      gem: "#5b00ff",
    };
  else if (level >= 49)
    theme = {
      outer: "border-[#549cff] bg-[#8abdff]",
      badge: "from-[#549cff] to-[#1c66d6]",
      gem: "#0033ff",
    };
  else if (level >= 33)
    theme = {
      outer: "border-[#4de0d3] bg-[#87efe5]",
      badge: "from-[#4de0d3] to-[#1ca196]",
      gem: "#0066ff",
    };
  else if (level >= 17)
    theme = {
      outer: "border-[#8ee069] bg-[#b6f09e]",
      badge: "from-[#8ee069] to-[#51a329]",
      gem: "#00a35c",
    };

  return (
    <div
      className={`relative flex items-center justify-center ${className} shrink-0`}
    >
      <div
        className={`w-full h-full rounded-full border-[2.5px] ${theme.outer} flex items-center justify-center bg-transparent shrink-0 shadow-[0_4px_10px_rgba(0,0,0,0.5)] z-10 p-0.5`}
      >
        <div className="w-full h-full bg-white/90 rounded-full flex items-center justify-center overflow-hidden bg-black">
          {src ? (
            <img src={src} className="w-full h-full object-cover" alt="" />
          ) : (
            <div className="w-5 h-5 bg-gray-200 rounded-full border border-gray-100" />
          )}
        </div>
      </div>

      {/* Wings or side ornaments based on level */}
      {level >= 17 && level < 49 && (
        <>
          <div
            className={`absolute top-1/2 -left-2 w-3 h-5 bg-gradient-to-b ${theme.badge} rounded-full rotate-[30deg] z-0 -translate-y-1/2`}
          />
          <div
            className={`absolute top-1/2 -right-2 w-3 h-5 bg-gradient-to-b ${theme.badge} rounded-full -rotate-[30deg] z-0 -translate-y-1/2`}
          />
        </>
      )}
      {level >= 49 && level < 81 && (
        <>
          <div
            className={`absolute top-1/2 -left-2.5 w-4 h-6 bg-gradient-to-b ${theme.badge} rounded-full rotate-[40deg] z-0 -translate-y-1/2`}
          />
          <div
            className={`absolute top-1/2 -right-2.5 w-4 h-6 bg-gradient-to-b ${theme.badge} rounded-full -rotate-[40deg] z-0 -translate-y-1/2`}
          />
        </>
      )}
      {level >= 81 && (
        <>
          <div
            className={`absolute inset-x-[-12px] top-1/2 -translate-y-1/2 h-10 bg-gradient-to-b ${theme.badge} rounded-full z-0 opacity-80`}
            style={{
              clipPath:
                "polygon(0% 20%, 20% 0%, 50% 10%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 50% 90%, 20% 100%, 0% 80%)",
            }}
          />
        </>
      )}

      {/* Top Crown/Badge */}
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-20 drop-shadow-md">
        {level >= 101 ? (
          <div
            className={`w-6 h-4 bg-gradient-to-b ${theme.badge} rounded-sm flex items-start justify-center pt-[1px]`}
            style={{
              clipPath: "polygon(50% 0%, 100% 30%, 80% 100%, 20% 100%, 0% 30%)",
            }}
          >
            <div className="w-1.5 h-1.5 rotate-45 bg-[#ff003c]" />
          </div>
        ) : level >= 65 ? (
          <div
            className={`w-5 h-4 bg-gradient-to-b ${theme.badge} rounded-sm flex items-start justify-center pt-[1px]`}
            style={{
              clipPath: "polygon(50% 0%, 100% 40%, 75% 100%, 25% 100%, 0% 40%)",
            }}
          ></div>
        ) : (
          <div
            className={`w-4 h-3 bg-gradient-to-b ${theme.badge}`}
            style={{
              clipPath: "polygon(50% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)",
            }}
          />
        )}
      </div>

      {/* Bottom Gem/Badge */}
      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 z-20">
        <div
          className="w-3 h-3 rotate-45 border-[1.5px] border-white shadow-sm"
          style={{ backgroundColor: theme.gem }}
        />
      </div>
    </div>
  );
}

export function ChatBubble({
  level,
  children,
}: {
  level: number;
  children: React.ReactNode;
}) {
  let theme = {
    bg: "bg-[#3b5453]",
    border: "border-[#82a4a1]",
    badgeBg: "bg-[#a1c4c1]",
    badgeIcon: "text-white",
  };

  if (level >= 101)
    theme = {
      bg: "bg-[#82531a]",
      border: "border-[#ffd84a]",
      badgeBg: "bg-[#ffd84a]",
      badgeIcon: "text-[#d6961c]",
    };
  else if (level >= 81)
    theme = {
      bg: "bg-[#8c2a63]",
      border: "border-[#ffa1d6]",
      badgeBg: "bg-[#ffa1d6]",
      badgeIcon: "text-[#d85c9f]",
    };
  else if (level >= 65)
    theme = {
      bg: "bg-[#533085]",
      border: "border-[#b176ff]",
      badgeBg: "bg-[#b176ff]",
      badgeIcon: "text-[#7c38db]",
    };
  else if (level >= 49)
    theme = {
      bg: "bg-[#29599c]",
      border: "border-[#549cff]",
      badgeBg: "bg-[#549cff]",
      badgeIcon: "text-[#1c66d6]",
    };
  else if (level >= 33)
    theme = {
      bg: "bg-[#2b6b66]",
      border: "border-[#4de0d3]",
      badgeBg: "bg-[#4de0d3]",
      badgeIcon: "text-[#1ca196]",
    };
  else if (level >= 17)
    theme = {
      bg: "bg-[#336320]",
      border: "border-[#8ee069]",
      badgeBg: "bg-[#8ee069]",
      badgeIcon: "text-[#51a329]",
    };

  return (
    <div
      className={`relative px-4 py-2 ${theme.bg} rounded-xl border border-transparent shadow-sm flex items-center justify-center min-w-[70px] min-h-[40px] max-w-fit`}
      style={{
        border: `1px solid ${level >= 33 ? "currentColor" : "transparent"}`,
        borderColor:
          level >= 33
            ? theme.border.replace("border-[", "").replace("]", "")
            : undefined,
      }}
    >
      {/* Decorative corners */}
      {level >= 81 && (
        <>
          <div
            className={`absolute -top-1 -left-1 w-2 h-2 ${theme.badgeBg} rounded-full`}
          />
          <div
            className={`absolute -top-1 -right-1 w-2 h-2 ${theme.badgeBg} rounded-full`}
          />
        </>
      )}
      {level >= 101 && (
        <>
          <div
            className={`absolute -top-1.5 -left-1.5 w-3 h-3 ${theme.badgeBg} rotate-45`}
          />
          <div
            className={`absolute -top-1.5 -right-1.5 w-3 h-3 ${theme.badgeBg} rotate-45`}
          />
        </>
      )}

      {/* Small badge icon at bottom right or bottom left */}
      <div
        className={`absolute -bottom-2 -left-2 w-4 h-4 rotate-45 ${theme.badgeBg} flex items-center justify-center shadow-sm z-10 border border-white/50`}
      >
        <div
          className={`w-1.5 h-1.5 ${theme.badgeIcon.replace("text-", "bg-")} rotate-45`}
        />
      </div>
      <div
        className={`absolute -bottom-1.5 -right-1 w-5 h-5 rounded-full ${theme.badgeBg} flex items-center justify-center shadow-sm z-10 border border-white/50 overflow-hidden`}
      >
        <div
          className={`w-full h-1/2 ${theme.badgeIcon.replace("text-", "bg-")} mt-2`}
        />
      </div>

      <span className="text-white font-medium text-[15px] z-10">
        {children}
      </span>
    </div>
  );
}

export function LevelShowcaseView({ onBack }: { onBack: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-[#111113] z-[200] flex flex-col font-sans overflow-hidden text-white"
    >
      {/* Header */}
      <div className="relative pt-12 pb-4 px-4 flex justify-between items-center z-10 bg-black/40 backdrop-blur-md">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-white/10 active:scale-95 transition-all"
        >
          <ChevronLeft size={28} className="text-white drop-shadow-md" />
        </button>
        <h1 className="text-[20px] font-extrabold tracking-tight">
          Level Assets
        </h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto pb-20 px-4 space-y-12 pt-8 scrollbar-hide">
        {/* Crowns / Badges */}
        <section>
          <h2 className="text-center font-bold text-2xl mb-8 opacity-90">
            Level Badge
          </h2>
          <div className="grid grid-cols-4 gap-y-10 gap-x-2">
            {levelRanges.slice(0, 4).map((r) => (
              <div key={r.label} className="flex flex-col items-center gap-3">
                <LevelBadge level={r.min} className="w-[60px] h-[60px]" />
                <span className="text-[13px] font-bold opacity-90">
                  {r.label}
                </span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-y-10 gap-x-2 mt-10 px-6">
            {levelRanges.slice(4).map((r) => (
              <div key={r.label} className="flex flex-col items-center gap-3">
                <LevelBadge level={r.min} className="w-[70px] h-[70px]" />
                <span className="text-[13px] font-bold opacity-90">
                  {r.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        <div className="h-[1px] w-full bg-white/10" />

        {/* Avatar Frames */}
        <section>
          <h2 className="text-center font-bold text-2xl mb-8 opacity-90">
            Avatar frame
          </h2>
          <div className="grid grid-cols-4 gap-y-10 gap-x-2">
            {levelRanges.slice(0, 4).map((r) => (
              <div key={r.label} className="flex flex-col items-center gap-3">
                <AvatarFrame level={r.min} className="w-[64px] h-[64px]" />
                <span className="text-[13px] font-bold opacity-90">
                  {r.label}
                </span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-y-10 gap-x-2 mt-10 px-6">
            {levelRanges.slice(4).map((r) => (
              <div key={r.label} className="flex flex-col items-center gap-3">
                <AvatarFrame level={r.min} className="w-[76px] h-[76px]" />
                <span className="text-[13px] font-bold opacity-90">
                  {r.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        <div className="h-[1px] w-full bg-white/10" />

        {/* Chat Bubbles */}
        <section>
          <h2 className="text-center font-bold text-2xl mb-8 opacity-90">
            Chat bubble
          </h2>
          <div className="grid grid-cols-4 gap-y-10 gap-x-2">
            {levelRanges.slice(0, 4).map((r) => (
              <div key={r.label} className="flex flex-col items-center gap-4">
                <ChatBubble level={r.min}>Hello</ChatBubble>
                <span className="text-[13px] font-bold opacity-90 mt-1">
                  {r.label}
                </span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-y-10 gap-x-2 mt-10 px-6">
            {levelRanges.slice(4).map((r) => (
              <div key={r.label} className="flex flex-col items-center gap-4">
                <ChatBubble level={r.min}>Hello</ChatBubble>
                <span className="text-[13px] font-bold opacity-90 mt-1">
                  {r.label}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </motion.div>
  );
}
