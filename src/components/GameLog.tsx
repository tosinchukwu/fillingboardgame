import React from 'react';
import { RING_NUMBERS } from '../game/boardLayout';
import { useTheme, ThemeType } from '../hooks/useTheme';

interface GameLogProps {
  messages: string[];
  p1Name: string;
  p2Name: string;
  theme?: ThemeType;
}

const GameLog: React.FC<GameLogProps> = ({ messages, p1Name, p2Name, theme = 'avalanche' }) => {
  const colors = useTheme(theme);

  return (
    <div
      className="bg-black/40 border border-white/10 rounded-2xl p-3 max-h-[300px] min-h-[200px] overflow-y-auto shadow-2xl glass-panel custom-scrollbar"
      style={{ borderColor: colors.border }}
    >
      <h4
        className="text-[9px] font-bold uppercase tracking-[0.2em] mb-3 font-mono-game border-b border-white/10 pb-2 flex items-center justify-between"
        style={{ color: colors.accent }}
      >
        Tactical Log
        <span className="text-[8px] text-white/30 animate-pulse">Live</span>
      </h4>
      <div className="space-y-2">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-32 border-2 border-dashed border-white/5 rounded-xl">
            <p className="text-[9px] text-white/20 uppercase tracking-widest font-mono-game animate-pulse">Waiting...</p>
          </div>
        ) : (
          [...messages].reverse().slice(0, 30).map((msg, i) => {
            const isP1 = msg.includes(`[${p1Name}]`);
            const isP2 = msg.includes(`[${p2Name}]`);
            const isSystem = msg.includes("[SYSTEM]");

            let displayMsg = msg;
            let bgColor = "bg-white/5";
            let textColor = "text-white/80";
            let borderColor = "border-white/5";

            if (isP1) {
              textColor = "text-primary";
              borderColor = `border-primary/30`;
              bgColor = "bg-primary/5";
              displayMsg = msg.replace(/\[.*?\]:\s*/, "");
            } else if (isP2) {
              textColor = "text-red-400";
              borderColor = "border-red-500/30";
              bgColor = "bg-red-500/5";
              displayMsg = msg.replace(/\[.*?\]:\s*/, "");
            } else if (isSystem) {
              textColor = "text-white";
              borderColor = "border-white/20";
              bgColor = "bg-white/10";
              displayMsg = msg.replace(/\[SYSTEM\]:\s*/, "");
            }

            return (
              <div
                key={i}
                className={`text-[10px] sm:text-[10px] font-medium font-mono-game leading-relaxed border-l-2 pl-3 py-1.5 ${bgColor} rounded-r-xl ${textColor} ${borderColor} transition-all hover:bg-white/10 group`}
                style={isP1 ? { borderColor: colors.accent } : undefined}
              >
                <span className="opacity-100 group-hover:opacity-100 transition-opacity truncate">{displayMsg}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default GameLog;