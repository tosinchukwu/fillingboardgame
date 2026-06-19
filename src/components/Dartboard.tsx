import React, { useState, useCallback, useEffect, useRef } from 'react';
import { BOARD_LAYOUT, RING_RADII, RING_NUMBERS } from '../game/boardLayout';
import { GameState } from '../game/gameLogic';
import { useTheme, ThemeType } from '../hooks/useTheme';

interface DartboardProps {
  gameState: GameState;
  onHitNumber: (num: number, dartPos?: { x: number; y: number; angle: number; tilt: number }) => void;
  onHitRing: (ringIndex: number, dartPos?: { x: number; y: number; angle: number; tilt: number }) => void;
  disabled: boolean;
  isSpectator?: boolean;
  turnSeconds?: number | null;
  theme?: ThemeType;
}

const CENTER = 250;
const SCALE = 1.0;
const OUTER_R = 235;
const RING_HIT_TOL = 10;

function polarToXY(angle: number, radius: number): [number, number] {
  const rad = ((angle - 90) * Math.PI) / 180;
  return [CENTER + radius * Math.cos(rad) * SCALE, CENTER + radius * Math.sin(rad) * SCALE];
}

type BoardPhase = 'idle' | 'aiming' | 'throwing';

interface Landing {
  lx: number;
  ly: number;
  angle: number;
  hitRingIdx: number;
  closestNum: number;
  hitRingLine: boolean;
  hitRingLineIdx: number;
}

/**
 * Skill-based landing resolver: maps a press→release swipe vector
 * (in SVG viewBox coordinates) to a deterministic landing point and
 * the nearest board element. ≥90% skill, tiny jitter for feel.
 */
function resolveSwipeLanding(
  pressX: number,
  pressY: number,
  releaseX: number,
  releaseY: number,
  withJitter = true
): Landing | null {
  const dx = releaseX - pressX;
  const dy = releaseY - pressY; // negative when swiping up
  // Reference distances within the 500x500 viewBox
  const HREF = 120; // upward swipe needed for full power
  const WREF = 150; // lateral swipe needed for full aim deflection
  const power = Math.max(0, Math.min(1, -dy / HREF));
  if (power < 0.1) return null; // canceled

  const aimX = Math.max(-1, Math.min(1, dx / WREF));

  // Map to a target inside the board.
  // power=1 -> top of board (y ~= CENTER - OUTER_R), power=0.5 -> bullseye, power small -> low.
  let targetX = CENTER + aimX * OUTER_R * 0.95;
  let targetY = CENTER - (power * 2 - 1) * OUTER_R * 0.95;

  // Add micro jitter (~5%) for realism.
  if (withJitter) {
    const g = () => (Math.random() + Math.random() + Math.random() - 1.5) * 4; // ~gaussian
    targetX += g();
    targetY += g();
  }

  // Clamp inside the outer ring so every dart scores.
  const fromCenterX = targetX - CENTER;
  const fromCenterY = targetY - CENTER;
  let r = Math.hypot(fromCenterX, fromCenterY);
  let theta = Math.atan2(fromCenterY, fromCenterX);
  if (r > OUTER_R) r = OUTER_R;
  const lx = CENTER + r * Math.cos(theta);
  const ly = CENTER + r * Math.sin(theta);

  // angle in board convention (degrees from top, clockwise)
  const angleDeg = (Math.atan2(fromCenterY, fromCenterX) * 180) / Math.PI + 90;

  // 1) Check ring-line proximity for ring hits.
  let bestRingDist = Infinity;
  let bestRingIdx = -1;
  RING_RADII.forEach((ring, i) => {
    const d = Math.abs(r - ring.outer);
    if (d < bestRingDist) {
      bestRingDist = d;
      bestRingIdx = i;
    }
  });

  if (bestRingDist < RING_HIT_TOL) {
    return {
      lx,
      ly,
      angle: angleDeg,
      hitRingIdx: bestRingIdx,
      closestNum: -1,
      hitRingLine: true,
      hitRingLineIdx: bestRingIdx,
    };
  }

  // 2) Else nearest gem dot.
  let best = { d: Infinity, num: BOARD_LAYOUT[0].number, ring: BOARD_LAYOUT[0].ring, ang: BOARD_LAYOUT[0].angle };
  BOARD_LAYOUT.forEach((pos) => {
    const [gx, gy] = polarToXY(pos.angle, RING_RADII[pos.ring].outer);
    const d = Math.hypot(lx - gx, ly - gy);
    if (d < best.d) best = { d, num: pos.number, ring: pos.ring, ang: pos.angle };
  });

  // Snap landing exactly onto the chosen gem so the stuck dart looks crisp.
  const snapR = RING_RADII[best.ring].outer * 0.85;
  const [snapX, snapY] = polarToXY(best.ang, snapR);
  return {
    lx: snapX,
    ly: snapY,
    angle: best.ang,
    hitRingIdx: best.ring,
    closestNum: best.num,
    hitRingLine: false,
    hitRingLineIdx: -1,
  };
}

/** Build a release vector that would land near a specific number (used by CPU). */
function synthesizeSwipeFor(target: { ring: number; angle: number }): { dx: number; dy: number } {
  const [tx, ty] = polarToXY(target.angle, RING_RADII[target.ring].outer);
  // Solve inverse of resolveSwipeLanding (without jitter):
  // targetX = CENTER + aimX * OUTER_R * 0.95
  // targetY = CENTER - (power*2 - 1) * OUTER_R * 0.95
  const aimX = (tx - CENTER) / (OUTER_R * 0.95);
  const power = ((CENTER - ty) / (OUTER_R * 0.95) + 1) / 2;
  return { dx: aimX * 220, dy: -power * 280 };
}

const Dartboard: React.FC<DartboardProps> = ({ gameState, onHitNumber, onHitRing, disabled, isSpectator = false, turnSeconds = null, theme = 'avalanche' }) => {
  const colors = useTheme(theme);
  const cp = gameState.currentPlayer;

  const [boardPhase, setBoardPhase] = useState<BoardPhase>('idle');
  const [stuckDarts, setStuckDarts] = useState<{ x: number; y: number; angle: number; tilt: number; playerIdx: number } | null>(null);
  const [dartFlying, setDartFlying] = useState(false);
  const [isLaunched, setIsLaunched] = useState(false);
  const [hitPulse, setHitPulse] = useState<{ id: string; type: 'number' | 'ring' } | null>(null);
  const [flightDest, setFlightDest] = useState<{ lx: number; ly: number; angle: number; tilt: number } | null>(null);

  // Aim state in SVG viewBox coordinates
  const [aim, setAim] = useState<{ pressX: number; pressY: number; curX: number; curY: number; pointerId: number } | null>(null);
  const [previewLanding, setPreviewLanding] = useState<Landing | null>(null);

  const phaseRef = useRef<BoardPhase>('idle');
  useEffect(() => { phaseRef.current = boardPhase; }, [boardPhase]);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  // Sync stuck darts from game state (for spectators or joined players)
  useEffect(() => {
    if (dartFlying) return;
    if (gameState?.latestDart !== undefined) {
      setStuckDarts(gameState.latestDart);
    }
  }, [gameState?.latestDart, dartFlying]);

  useEffect(() => {
    const totalHits = Object.values(gameState.hitSequences).reduce((acc, seq) => acc + seq.length, 0);
    if (totalHits === 0 && stuckDarts !== null) setStuckDarts(null);
  }, [gameState.hitSequences, stuckDarts]);

  const prevCpRef = useRef(cp);
  useEffect(() => { if (prevCpRef.current !== cp) prevCpRef.current = cp; }, [cp]);

  // Convert client (px) coordinates to SVG viewBox coordinates.
  const clientToSvg = useCallback((clientX: number, clientY: number): { x: number; y: number } => {
    const svg = svgRef.current;
    if (!svg) return { x: CENTER, y: CENTER };
    const rect = svg.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 500;
    const y = ((clientY - rect.top) / rect.height) * 500;
    return { x, y };
  }, []);

  const flightOriginRef = useRef<{ x: number; y: number }>({ x: CENTER, y: 640 });

  /** Run the flight + hit-resolution pipeline for a given landing. */
  const executeThrow = useCallback((landing: Landing, playerIdx: number, fromX: number, fromY: number) => {
    setBoardPhase('throwing');
    phaseRef.current = 'throwing';

    if (gameState.dartsRemaining === 3) setStuckDarts(null);

    flightOriginRef.current = { x: fromX, y: fromY };
    const tilt = (Math.random() - 0.5) * 30;
    setFlightDest({ lx: landing.lx, ly: landing.ly, angle: landing.angle, tilt });
    setDartFlying(true);
    setIsLaunched(false);

    // Notify Index for isDartFlying state / audio.
    window.dispatchEvent(new CustomEvent('THROW_DART'));

    // The flight uses CSS transition from (fromX,fromY) to (lx,ly).
    setTimeout(() => setIsLaunched(true), 10);

    setTimeout(() => {
      setDartFlying(false);
      setIsLaunched(false);
      setBoardPhase('idle');
      phaseRef.current = 'idle';
      window.dispatchEvent(new CustomEvent('DART_HIT_IMPACT'));

      const dartPos = { x: landing.lx, y: landing.ly, angle: landing.angle, tilt };
      setStuckDarts({ x: landing.lx, y: landing.ly, angle: landing.angle, tilt, playerIdx });
      setFlightDest(null);

      if (landing.hitRingLine && landing.hitRingLineIdx >= 0) {
        setHitPulse({ id: `ring-${landing.hitRingLineIdx}`, type: 'ring' });
        const rNums = RING_NUMBERS[landing.hitRingLineIdx] ?? [];
        if (rNums.length > 0) onHitRing(landing.hitRingLineIdx, dartPos);
      } else if (landing.closestNum !== -1) {
        setHitPulse({ id: `num-${landing.closestNum}`, type: 'number' });
        if (!gameState.closedNumbers.has(landing.closestNum)) {
          onHitNumber(landing.closestNum, dartPos);
        } else {
          const rNums = RING_NUMBERS[landing.hitRingIdx] ?? [];
          if (rNums.length > 0) onHitRing(landing.hitRingIdx, dartPos);
        }
      }
      setTimeout(() => setHitPulse(null), 1000);
    }, 560);
  }, [gameState.dartsRemaining, gameState.closedNumbers, onHitNumber, onHitRing]);


  // Pointer handlers
  const canAim = !disabled && !gameState.gameOver && phaseRef.current === 'idle' && !isSpectator && gameState.dartsRemaining > 0;

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!canAim) return;
    const { x, y } = clientToSvg(e.clientX, e.clientY);
    overlayRef.current?.setPointerCapture(e.pointerId);
    setAim({ pressX: x, pressY: y, curX: x, curY: y, pointerId: e.pointerId });
    setBoardPhase('aiming');
    phaseRef.current = 'aiming';
    e.preventDefault();
  }, [canAim, clientToSvg]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!aim || e.pointerId !== aim.pointerId) return;
    const { x, y } = clientToSvg(e.clientX, e.clientY);
    setAim((prev) => prev ? { ...prev, curX: x, curY: y } : prev);
    const preview = resolveSwipeLanding(aim.pressX, aim.pressY, x, y, false);
    setPreviewLanding(preview);
    e.preventDefault();
  }, [aim, clientToSvg]);

  const releaseAim = useCallback((e: React.PointerEvent) => {
    if (!aim || e.pointerId !== aim.pointerId) return;
    overlayRef.current?.releasePointerCapture?.(aim.pointerId);
    const { x, y } = clientToSvg(e.clientX, e.clientY);
    const landing = resolveSwipeLanding(aim.pressX, aim.pressY, x, y, true);
    const pressX = aim.pressX;
    const pressY = aim.pressY;
    setAim(null);
    setPreviewLanding(null);
    if (!landing) {
      // canceled — snap back
      setBoardPhase('idle');
      phaseRef.current = 'idle';
      return;
    }
    executeThrow(landing, cp, pressX, pressY);
  }, [aim, clientToSvg, executeThrow, cp]);

  // CPU / remote: animate a synthetic swipe to a known target
  useEffect(() => {
    const handleRemoteHit = (ev: any) => {
      if (phaseRef.current !== 'idle') return;
      const target = ev.detail?.target;
      if (typeof target !== 'number') return;
      const pos = BOARD_LAYOUT.find((p) => p.number === target) || BOARD_LAYOUT[0];
      const { dx, dy } = synthesizeSwipeFor({ ring: pos.ring, angle: pos.angle });
      const pressX = CENTER;
      const pressY = 660;
      const landing = resolveSwipeLanding(pressX, pressY, pressX + dx, pressY + dy, false);
      if (!landing) return;
      // Force the visual stuck dart to use playerIdx from event if provided.
      executeThrow(landing, ev.detail?.playerIdx ?? 1, pressX, pressY);
    };
    window.addEventListener('REMOTE_HIT_ANIMATION' as any, handleRemoteHit);
    return () => window.removeEventListener('REMOTE_HIT_ANIMATION' as any, handleRemoteHit);
  }, [executeThrow]);

  const getHint = () => {
    if (disabled) return 'GAME PAUSED';
    if (isSpectator) return 'SPECTATING';
    if (boardPhase === 'throwing') return 'Dart in flight...';
    if (boardPhase === 'aiming') return 'Release to throw';
    return 'Swipe up to throw';
  };

  // Dart handle position (in SVG coords) when idle.
  const handleX = CENTER;
  const handleY = 660;

  // While aiming, show the dart at the press point and angled toward swipe direction.
  const aimDx = aim ? aim.curX - aim.pressX : 0;
  const aimDy = aim ? aim.curY - aim.pressY : 0;
  const swipeDist = Math.hypot(aimDx, aimDy);
  const aimAngle = aim && swipeDist > 5
    ? (Math.atan2(aimDx, -aimDy) * 180) / Math.PI
    : 180;
  return (
    <div className="relative flex flex-col items-center gap-2 select-none mt-0 pb-36 xl:pb-0 overflow-visible">
      <div
        ref={overlayRef}
        className="relative touch-none overflow-visible"
        onPointerMove={onPointerMove}
        onPointerUp={releaseAim}
        onPointerCancel={releaseAim}
        style={{ touchAction: 'none' }}
      >
        <svg
          ref={svgRef}
          viewBox="0 0 500 790"
          className="w-[320px] h-[500px] sm:w-[380px] sm:h-[600px] md:w-[450px] md:h-[711px] overflow-visible"
          style={{
            filter: 'none',
            cursor: canAim ? (boardPhase === 'aiming' ? 'grabbing' : 'grab') : 'default',
          }}
        >
          <defs>
            <radialGradient id="ruby-grad" cx="35%" cy="35%" r="65%" fx="25%" fy="25%">
              <stop offset="0%" stopColor="#FF4D4D" />
              <stop offset="40%" stopColor="#B30000" />
              <stop offset="100%" stopColor="#4D0000" />
            </radialGradient>
            <radialGradient id="emerald-grad" cx="35%" cy="35%" r="65%" fx="25%" fy="25%">
              <stop offset="0%" stopColor="#4DFF4D" />
              <stop offset="40%" stopColor="#00B300" />
              <stop offset="100%" stopColor="#004D00" />
            </radialGradient>
            <filter id="inner-glow">
              <feGaussianBlur stdDeviation="1" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="crystal-shine">
              <feGaussianBlur stdDeviation="0.4" result="blur" />
            </filter>
          </defs>

          <circle cx={CENTER} cy={CENTER} r="255" fill="#002366" opacity="1.0" />
          <circle cx={CENTER} cy={CENTER} r="248" fill="none" stroke="#4169E1" strokeWidth="8" />

          {Array.from({ length: 20 }).map((_, i) => {
            const startAngle = (i * 18 - 9 - 90) * Math.PI / 180;
            const endAngle = ((i + 1) * 18 - 9 - 90) * Math.PI / 180;
            const x1 = CENTER + 245 * Math.cos(startAngle);
            const y1 = CENTER + 245 * Math.sin(startAngle);
            const x2 = CENTER + 245 * Math.cos(endAngle);
            const y2 = CENTER + 245 * Math.sin(endAngle);
            const sliceColor = i % 2 === 0 ? 'rgba(0,0,0,0.8)' : 'rgba(240,240,230,0.1)';
            return (
              <path
                key={`slice-${i}`}
                d={`M ${CENTER} ${CENTER} L ${x1} ${y1} A 245 245 0 0 1 ${x2} ${y2} Z`}
                fill={sliceColor}
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="1"
              />
            );
          })}

          {[...RING_RADII].map((ring, i) => (
            <circle
              key={`ring-line-${i}`}
              cx={CENTER} cy={CENTER}
              r={ring.outer * SCALE}
              fill="none"
              stroke={hitPulse?.type === 'ring' && hitPulse.id === `ring-${i}` ? '#FFFFFF' : 'rgba(255,255,255,0.8)'}
              strokeWidth={hitPulse?.type === 'ring' && hitPulse.id === `ring-${i}` ? '8' : '4'}
              className={hitPulse?.type === 'ring' && hitPulse.id === `ring-${i}` ? 'animate-pulse' : ''}
              style={{ transition: 'stroke-width 0.2s' }}
            />
          ))}

          {BOARD_LAYOUT.map((pos) => {
            const ringData = RING_RADII[pos.ring];
            const r = ringData.outer;
            const [x, y] = polarToXY(pos.angle, r);
            const isClosed = gameState.closedNumbers.has(pos.number);

            return (
              <g key={pos.number}>
                <circle
                  cx={x} cy={y} r={hitPulse?.id === `num-${pos.number}` ? '26' : '21'}
                  fill={isClosed ? '#333' : (pos.color === 'red' ? 'url(#ruby-grad)' : 'url(#emerald-grad)')}
                  className={hitPulse?.id === `num-${pos.number}` ? 'animate-pulse' : ''}
                  style={{ transition: 'all 0.2s ease-out' }}
                />

                {!isClosed && gameState.hitSequences[pos.number].filter((p) => p === cp).length > 0 && (
                  <circle
                    cx={x} cy={y} r="26"
                    fill="none"
                    stroke={pos.color === 'red' ? '#e63946' : '#2a9d8f'}
                    strokeWidth="4"
                    strokeDasharray={`${(Math.min(gameState.hitSequences[pos.number].filter((p) => p === cp).length / pos.number, 1)) * (2 * Math.PI * 26)} ${2 * Math.PI * 26}`}
                    transform={`rotate(-90 ${x} ${y})`}
                    strokeLinecap="round"
                  />
                )}

                <text
                  x={x}
                  y={y + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={isClosed ? '#888' : '#FFFFFF'}
                  fontSize="22"
                  fontWeight="800"
                  fontFamily="'Orbitron', sans-serif"
                  style={{ textShadow: isClosed ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.4)' }}
                >
                  {pos.number}
                </text>
              </g>
            );
          })}


          {/* Stuck Darts */}
          {stuckDarts && (
            <g pointerEvents="none">
              <image
                href={stuckDarts.playerIdx === 0 ? '/green_dart.png' : '/red_dart.png'}
                x={stuckDarts.x - 29}
                y={stuckDarts.y - 135 + 15}
                width="58"
                height="135"
                transform={`rotate(${stuckDarts.angle + stuckDarts.tilt} ${stuckDarts.x} ${stuckDarts.y})`}
                style={{ filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.6))' }}
              />
            </g>
          )}

          {/* Flying dart: animates from press point to landing */}
          {dartFlying && flightDest && (
            <g
              pointerEvents="none"
              style={{
                transition: 'transform 0.56s cubic-bezier(0.2, 0.7, 0.4, 1)',
                transform: isLaunched
                  ? `translate(${flightDest.lx - flightOriginRef.current.x}px, ${flightDest.ly - flightOriginRef.current.y}px)`
                  : 'translate(0px, 0px)',
              }}
            >
              <image
                href={cp === 0 ? '/green_dart.png' : '/red_dart.png'}
                x={flightOriginRef.current.x - 29}
                y={flightOriginRef.current.y - 135 + 15}
                width="58"
                height="135"
                transform={`rotate(${flightDest.angle + flightDest.tilt} ${flightOriginRef.current.x} ${flightOriginRef.current.y})`}
                style={{
                  filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.4))',
                }}
              />
            </g>
          )}

          {/* Idle / aim dart "handle" */}
          {!dartFlying && !gameState.gameOver && (canAim || aim) && (
            <g
              pointerEvents={canAim ? "all" : "none"}
              style={{ transition: 'opacity 0.2s', cursor: canAim ? 'grab' : 'default' }}
              onPointerDown={onPointerDown}
            >

              <rect
                x={(aim ? aim.curX : handleX) - 40}
                y={(aim ? aim.curY : handleY) - 150}
                width="80"
                height="170"
                fill="transparent"
              />

              <image
                href={cp === 0 ? '/green_dart.png' : '/red_dart.png'}
                x={(aim ? aim.curX : handleX) - 29}
                y={(aim ? aim.curY - 120 : handleY) - 135 + 15}
                width="58"
                height="135"
                transform={`rotate(${aimAngle} ${aim ? aim.curX : handleX} ${aim ? aim.curY - 120 : handleY})`}
                style={{
                  filter: `drop-shadow(0 6px 10px ${colors.accent}80)`,
                  opacity: aim ? 1 : 0.9,
                }}
              />
            </g>
          )}
          {/* Hint text below dart */}
          {!dartFlying && (
            <text
              x={handleX}
              y={handleY + 145}
              textAnchor="middle"
              fill={colors.accent}
              fontSize="18"
              fontWeight="800"
              fontFamily="'Orbitron', sans-serif"
              letterSpacing="4"
              style={{ filter: `drop-shadow(0 0 10px ${colors.accent}40)` }}
            >
              {getHint().toUpperCase()}
            </text>
          )}
          {/* Turn countdown timer below hint */}
          {!dartFlying && turnSeconds !== null && turnSeconds !== undefined && (
            <text
              x={handleX}
              y={handleY + 100}
              textAnchor="middle"
              fill={turnSeconds <= 3 ? '#ff4d6d' : colors.accent}
              fontSize="22"
              fontWeight="900"
              fontFamily="'Orbitron', sans-serif"
              letterSpacing="3"
              style={{ filter: `drop-shadow(0 0 6px ${turnSeconds <= 3 ? '#ff4d6d' : colors.accent})` }}
            >
              ⏱ {turnSeconds}s
            </text>
          )}
        </svg>
      </div>

    </div>
  );
};

// Legacy export kept for backwards compatibility; no longer used in the main game UI.
export const DartArrow: React.FC<{
  boardPhase: string;
  isFlying: boolean;
  isVisible: boolean;
  disabled: boolean;
  onClick: () => void;
  playerIdx: number;
}> = ({ isFlying, isVisible, disabled, onClick, playerIdx }) => {
  const canClick = !disabled;
  return (
    <div
      onClick={canClick ? onClick : undefined}
      style={{ cursor: canClick ? 'pointer' : 'default' }}
      className={`transition-all duration-300 select-none ${!isVisible ? 'opacity-0' : 'opacity-100'} ${isFlying ? 'opacity-0' : ''}`}
    >
      <img
        src={playerIdx === 0 ? '/green_dart.png' : '/red_dart.png'}
        alt="Dart"
        className="w-[80px] md:w-[100px] rotate-[180deg] drop-shadow-lg"
      />
    </div>
  );
};

export default Dartboard;
