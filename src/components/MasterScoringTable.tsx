import React from 'react';
import { GameState } from '../game/gameLogic';
import { TOTAL_NUMBERS } from '../game/boardLayout';
import { useTheme, ThemeType } from '../hooks/useTheme';

interface MasterScoringTableProps {
    gameState: GameState;
    theme?: ThemeType;
}

const MasterScoringTable: React.FC<MasterScoringTableProps> = ({ gameState, theme = 'avalanche' }) => {
    const colors = useTheme(theme);

    const getOrdinal = (n: number) => {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    const renderRow = (n: number) => {
        const p1 = gameState.players[0];
        const p2 = gameState.players[1];
        const seq = gameState.hitSequences[n];

        const p1Positions = seq.map((p, i) => p === 0 ? getOrdinal(i + 1) : null).filter(Boolean);
        const p2Positions = seq.map((p, i) => p === 1 ? getOrdinal(i + 1) : null).filter(Boolean);

        const p1HitsDisplay = p1Positions.length > 0 ? p1Positions.join(', ') : '-';
        const p2HitsDisplay = p2Positions.length > 0 ? p2Positions.join(', ') : '-';

        const fillerEarners = seq.map(p => p === 0 ? 'A' : 'B').join(', ');

        let tfpEarner = '-';
        let tfpA = 0;
        let tfpB = 0;
        if (n >= 2) {
            const threshold = n / 2;
            if (p1.hits[n] > threshold || p2.hits[n] > threshold) {
                if (p1.hits[n] > p2.hits[n]) {
                    tfpEarner = 'A';
                    tfpA = 7;
                } else if (p2.hits[n] > p1.hits[n]) {
                    tfpEarner = 'B';
                    tfpB = 7;
                } else {
                    tfpEarner = 'A, B';
                    tfpA = 3.5;
                    tfpB = 3.5;
                }
            }
        }

        let fuEarner = '-';
        let fuA = 0;
        let fuB = 0;
        if (n === 1) {
            const earners = [];
            if (p1.hits[1] > 0) earners.push('A');
            if (p2.hits[1] > 0) earners.push('B');
            fuEarner = earners.join(', ') || '-';
            fuA = p1.hits[1] * 10;
            fuB = p2.hits[1] * 10;
        } else if (gameState.closedNumbers.has(n) && seq.length > 0) {
            const lastPlayer = seq[seq.length - 1];
            fuEarner = lastPlayer === 0 ? 'A' : 'B';
            if (lastPlayer === 0) fuA = 10; else fuB = 10;
        }

        const fillerA = n === 1 ? (p1.hits[1] * 2) : Math.min(p1.hits[n] * 2 + p1.bonusPoints[n], n * 2);
        const fillerB = n === 1 ? (p2.hits[1] * 2) : Math.min(p2.hits[n] * 2 + p2.bonusPoints[n], n * 2);

        const totalA = fillerA + tfpA + fuA;
        const totalB = fillerB + tfpB + fuB;

        return (
            <tr key={n} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                <td className="py-2 px-3 text-white/50 text-xs font-mono font-bold">{n}</td>
                <td className={`py-2 px-3 font-medium text-[11px] ${p1.completed[n] ? 'text-primary' : 'text-white/70'}`}>
                    {p1HitsDisplay}
                </td>
                <td className={`py-2 px-3 font-medium text-[11px] ${p2.completed[n] ? 'text-secondary' : 'text-white/70'}`}>
                    {p2HitsDisplay}
                </td>
                <td className="py-2 px-3 text-white/50 text-[10px] text-center">{fillerEarners || '-'}</td>
                <td className="py-2 px-3 text-primary text-[11px] font-black text-center" style={{ color: colors.accent }}>{tfpEarner}</td>
                <td className="py-2 px-3 text-secondary text-[11px] font-black text-center">{fuEarner}</td>
                <td className="py-2 px-3 text-primary font-bold text-xs text-center" style={{ color: colors.accent }}>
                    {totalA > 0 ? totalA : '-'}
                </td>
                <td className="py-2 px-3 text-secondary font-bold text-xs text-center">{totalB > 0 ? totalB : '-'}</td>
            </tr>
        );
    };

    return (
        <div
            className="glass-panel rounded-3xl overflow-hidden border-white/10 shadow-2xl flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-700"
            style={{ borderColor: colors.border }}
        >
            <div className="bg-white/5 p-3 sm:p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-[10px] sm:text-sm font-black tracking-[0.2em] uppercase text-white flex items-center gap-2 sm:gap-3">
                    <span
                        className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: colors.accent, boxShadow: `0 0 8px ${colors.glow}` }}
                    />
                    MASTER SCORING TABLE
                </h3>
                <span className="text-[8px] sm:text-[10px] font-mono-game text-white/30 uppercase tracking-widest hidden sm:inline">Strategy Logic Applied</span>
            </div>

            {/* ✅ FIXED: Scroll wrapper with horizontal scroll on mobile */}
            <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
                <div className="min-w-[700px] lg:min-w-0">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-black/40 text-[8px] sm:text-[9px] uppercase tracking-widest text-white/40 border-b border-white/10">
                                <th className="py-2 sm:py-3 px-2 sm:px-3 font-black">Dart No</th>
                                <th className="py-2 sm:py-3 px-2 sm:px-3 font-black">{gameState.players[0].name.toUpperCase()} (Hit)</th>
                                <th className="py-2 sm:py-3 px-2 sm:px-3 font-black">{gameState.players[1].name.toUpperCase()} (Hit)</th>
                                <th className="py-2 sm:py-3 px-2 sm:px-3 font-black text-center">Filler +2</th>
                                <th className="py-2 sm:py-3 px-2 sm:px-3 font-black text-center">Top Filler +7</th>
                                <th className="py-2 sm:py-3 px-2 sm:px-3 font-black text-center">Fill Up +10</th>
                                <th className="py-2 sm:py-3 px-2 sm:px-3 font-black text-center">{gameState.players[0].name.toUpperCase()} Total</th>
                                <th className="py-2 sm:py-3 px-2 sm:px-3 font-black text-center">{gameState.players[1].name.toUpperCase()} Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1).map(renderRow)}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-black/40 p-3 sm:p-4 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0 font-mono-game">
                <div className="flex flex-col items-center sm:items-start gap-1">
                    <span className="text-[8px] sm:text-[9px] text-white/30 uppercase tracking-widest">Board Status</span>
                    <span
                        className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest"
                        style={{ color: colors.accent }}
                    >
                        {gameState.closedNumbers.size} / {TOTAL_NUMBERS} Closed
                    </span>
                </div>
                <div className="flex gap-4 sm:gap-6">
                    <div className="text-center sm:text-right">
                        <span className="block text-[7px] sm:text-[8px] text-white/40 uppercase">Total {gameState.players[0].name}</span>
                        <span className="text-lg sm:text-xl font-black text-white">{gameState.players[0].totalScore}</span>
                    </div>
                    <div className="text-center sm:text-right">
                        <span className="block text-[7px] sm:text-[8px] text-white/40 uppercase">Total {gameState.players[1].name}</span>
                        <span className="text-lg sm:text-xl font-black text-white">{gameState.players[1].totalScore}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MasterScoringTable;