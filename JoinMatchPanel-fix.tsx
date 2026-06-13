'use client';

import { useState, useEffect } from 'react';
import { useAccount, useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther } from 'viem';
import { Loader2, CheckCircle2, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatAddress } from '@/lib/utils';
import { getContractAddress, TOURNAMENT_ABI as tournamentABI } from '@/lib/contracts';

type Match = {
  id: bigint;
  player1: `0x${string}`;
  player1Name: string;
  player2: `0x${string}`;
  player2Name: string;
  player1Paid: boolean;
  player2Paid: boolean;
  lockedEntryFee: bigint;
  lockedPaymentToken: `0x${string}`;
  winner: `0x${string}`;
  scoreline: string;
  isCompleted: boolean;
  isCancelled: boolean;
  prizePool: bigint;
  createdAt: bigint;
  isCasual: boolean;
};

export function JoinMatchPanel() {
  const chainId = useChainId();
  const TOURNAMENT_ADDRESS = getContractAddress(chainId);
  const { address, isConnected, chain } = useAccount();

  const [matchIdInput, setMatchIdInput] = useState('');
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [localError, setLocalError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Global entry fee
  const { data: entryFee } = useReadContract({
    address: TOURNAMENT_ADDRESS,
    abi: tournamentABI,
    functionName: 'entryFee',
  });

  // Load match data using numeric ID directly - convert hex to bigint
  const { data: rawMatch, isLoading: isLoadingMatch } = useReadContract({
    address: TOURNAMENT_ADDRESS,
    abi: tournamentABI,
    functionName: 'getMatch',
    args: matchIdInput && /^[a-f0-9]{8}$/i.test(matchIdInput.trim())
      ? [BigInt('0x' + matchIdInput.trim())]
      : undefined,
    query: {
      enabled: !!matchIdInput && /^[a-f0-9]{8}$/i.test(matchIdInput.trim()),
    },
  });

  // Safe parsing of rawMatch
  const match: Match | null = rawMatch
    ? (rawMatch as Match)
    : null;

  // Contract write & tx wait
  const { writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: txError } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const handleJoin = () => {
    setLocalError(null);
    if (!match || !matchIdInput) {
      setLocalError('Invalid match ID');
      return;
    }

    const joinFee = match.lockedEntryFee || entryFee;
    if (!joinFee) {
      setLocalError('Entry fee not set');
      return;
    }

    writeContract(
      {
        address: TOURNAMENT_ADDRESS,
        abi: tournamentABI,
        functionName: 'joinMatch',
        args: [BigInt('0x' + matchIdInput.trim())],
        value: joinFee,
      },
      {
        onSuccess: (hash) => {
          setTxHash(hash);
        },
        onError: (err: any) => {
          setLocalError(err.message || 'Join failed');
        },
      }
    );
  };

  // User status logic
  const isPlayer1 = address && match && address.toLowerCase() === match.player1.toLowerCase();
  const isPlayer2 = address && match && address.toLowerCase() === match.player2.toLowerCase();
  const isParticipant = isPlayer1 || isPlayer2;
  const alreadyJoined = isPlayer1 ? match?.player1Paid : isPlayer2 ? match?.player2Paid : false;
  const canJoin = isConnected && isParticipant && !alreadyJoined && !match?.isCompleted && !match?.isCancelled && !match?.isCasual;

  if (!isMounted) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-6 md:p-8 rounded-2xl border border-white/5"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">Join Match</h2>
        <p className="text-gray-400 text-sm">Pay entry fee to join an official match as a player</p>
      </div>

      <input
        type="text"
        value={matchIdInput}
        onChange={(e) => setMatchIdInput(e.target.value)}
        placeholder="Enter Match ID (numeric)"
        className="w-full px-4 py-3.5 rounded-xl bg-slate-900/60 border border-slate-700/50 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 mb-5"
        disabled={isConfirming}
      />

      {isLoadingMatch && (
        <p className="text-gray-400 flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading match...
        </p>
      )}

      {matchIdInput && !isLoadingMatch && !match && (
        <div className="mt-4 p-4 rounded-xl bg-amber-900/30 border border-amber-600/50 text-amber-200">
          <p className="text-sm font-medium mb-2">Match Not Found</p>
          <p className="text-xs text-amber-100/80">Make sure you entered the correct Match ID, it exists on the blockchain, and you&apos;re on the correct network.</p>
        </div>
      )}

      {match && (
        <div className="mt-4 p-5 rounded-xl bg-slate-800/40 border border-slate-600/50 space-y-4">
          <h3 className="text-lg font-semibold text-white">Match Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs uppercase text-gray-400">Player 1</p>
              <p className="font-medium">{match.player1Name}</p>
              <p className="text-xs font-mono text-gray-500 truncate">{formatAddress(match.player1)}</p>
              {match.player1Paid && <span className="text-emerald-400 text-xs ml-2">✓ Paid</span>}
            </div>
            <div>
              <p className="text-xs uppercase text-gray-400">Player 2</p>
              <p className="font-medium">{match.player2Name}</p>
              <p className="text-xs font-mono text-gray-500 truncate">{formatAddress(match.player2)}</p>
              {match.player2Paid && <span className="text-emerald-400 text-xs ml-2">✓ Paid</span>}
            </div>
          </div>
          <div className="text-sm text-gray-300">
            Prize Pool: {formatEther(match.prizePool)} {chain?.nativeCurrency?.symbol || 'Tokens'}
          </div>
          {match.isCompleted && (
            <p className="text-amber-400 text-sm font-medium">Match already completed</p>
          )}
          {match.isCancelled && (
            <p className="text-red-400 text-sm font-medium">Match cancelled</p>
          )}
          {match.isCasual && (
            <p className="text-gray-400 text-sm">Casual match (no entry fee)</p>
          )}
        </div>
      )}

      {match && isConnected && (
        <div className="mt-6 space-y-4">
          {canJoin ? (
            <button
              onClick={handleJoin}
              disabled={isConfirming || !entryFee}
              className={`
                w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all
                ${isConfirming
                  ? 'bg-slate-700 cursor-wait opacity-70'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 shadow-lg shadow-emerald-500/20'
                }
                text-white disabled:opacity-60
              `}
            >
              {isConfirming ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <DollarSign className="w-5 h-5" />
                  Join & Pay {entryFee ? formatEther(entryFee) : '?'} {chain?.nativeCurrency?.symbol || 'Tokens'}
                </>
              )}
            </button>
          ) : alreadyJoined ? (
            <div className="bg-emerald-900/30 border border-emerald-500/40 text-emerald-200 px-5 py-4 rounded-xl flex items-center justify-center gap-3">
              <CheckCircle2 className="w-5 h-5" />
              You already joined this match
            </div>
          ) : isParticipant ? (
            <div className="bg-amber-900/30 border border-amber-500/40 text-amber-200 px-5 py-4 rounded-xl text-center">
              Cannot join: match is {match.isCompleted ? 'finished' : match.isCancelled ? 'cancelled' : 'not available'}
            </div>
          ) : (
            <div className="bg-slate-800/50 border border-slate-700 px-5 py-4 rounded-xl text-center text-gray-400">
              You are not a participant in this match
            </div>
          )}

          {txHash && isConfirming && (
            <div className="bg-blue-900/30 border border-blue-500/40 text-blue-200 px-5 py-4 rounded-xl flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin" />
              Waiting for confirmation...
            </div>
          )}

          {isSuccess && (
            <div className="bg-green-900/30 border border-green-500/40 text-green-200 px-5 py-4 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5" />
              Joined successfully!
            </div>
          )}

          {localError && (
            <div className="bg-red-900/30 border border-red-500/40 text-red-200 px-5 py-4 rounded-xl">
              {localError}
            </div>
          )}

          {txError && (
            <div className="bg-red-900/30 border border-red-500/40 text-red-200 px-5 py-4 rounded-xl">
              Transaction failed: {txError.message || 'Unknown error'}
            </div>
          )}
        </div>
      )}

      {!isConnected && matchIdInput && (
        <div className="text-center py-6 text-gray-400">
          Connect your wallet to join a match
        </div>
      )}
    </motion.div>
  );
}
