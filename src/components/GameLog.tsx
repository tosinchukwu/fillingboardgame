import React, { useEffect, useRef } from 'react';
import { useTheme, ThemeType } from '../hooks/useTheme';

interface GameLogProps {
  messages: string[];
  p1Name: string;
  p2Name: string;
  theme?: ThemeType;
}

const GameLog: React.FC<GameLogProps> = ({ messages, p1Name, p2Name, theme = 'avalanche' }) => {
  const colors = useTheme(theme);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  return (
    <div className="h-full w-full overflow-y-auto overflow-x-hidden pr-1 custom-scrollbar">
      <div className="space-y-1.5 p-1">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-32 border-2 border-dashed border-white/5 rounded-xl">
            <p className="text-[9px] text-white/20 uppercase tracking-widest font-mono-game animate-pulse">Waiting for throws...</p>
          </div>
        ) : (
          messages.map((msg, i) => {
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
                className={`text-[10px] sm:text-[10px] font-medium font-mono-game leading-relaxed border-l-2 pl-3 py-1.5 ${bgColor} rounded-r-xl ${textColor} ${borderColor} transition-all hover:bg-white/10 group break-words whitespace-pre-wrap`}
                style={isP1 ? { borderColor: colors.accent } : undefined}
              >
                <span>{displayMsg}</span>
              </div>
            );
          })
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
};

export default GameLog;