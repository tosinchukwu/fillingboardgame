'use client';

import { useState, useEffect } from 'react';
import { useAccount, useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatEther } from 'viem';
import { isAddress } from 'viem';
import { getContractAddress, TOURNAMENT_ABI as tournamentABI } from '@/lib/contracts';
import { getExplorerTxUrl, getExplorerName } from '@/lib/utils';

interface MatchFormData {
  matchId: string;
  player1: string;
  player1Name: string;
  player2: string;
  player2Name: string;
  isCasual: boolean;
}

export function MatchRegistration() {
  const chainId = useChainId();
  const TOURNAMENT_ADDRESS = getContractAddress(chainId);
  const { address, isConnected, chain } = useAccount();

  const [formData, setFormData] = useState<MatchFormData>({
    matchId: '',
    player1: '',
    player1Name: '',
    player2: '',
    player2Name: '',
    isCasual: true,
  });

  const [isCreating, setIsCreating] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [successMatchId, setSuccessMatchId] = useState<string | null>(null);

  const { data: entryFee } = useReadContract({
    address: TOURNAMENT_ADDRESS,
    abi: tournamentABI,
    functionName: 'entryFee',
  });

  const { data: contractOwner } = useReadContract({
    address: TOURNAMENT_ADDRESS,
    abi: tournamentABI,
    functionName: 'owner',
  });

  const isOwner = address && contractOwner && address.toLowerCase() === contractOwner.toLowerCase();

  const { writeContract } = useWriteContract();

  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess,
  } = useWaitForTransactionReceipt({
    hash: txHash,
    confirmations: 1,
  });

  useEffect(() => {
    if (receipt && txHash) {
      if (receipt.status === 'success') {
        setSuccessMatchId(formData.matchId);
        
        // Reset form
        setFormData({
          matchId: '',
          player1: '',
          player1Name: '',
          player2: '',
          player2Name: '',
          isCasual: true,
        });
        setError(null);
      } else if (receipt.status === 'reverted') {
        const explorerUrl = getExplorerTxUrl(chainId, txHash);
        setError(`Transaction failed on-chain. ${explorerUrl ? `Check the explorer for details: ${explorerUrl}` : 'Check your wallet for details.'}`);
      }

      setIsCreating(false);
      setTxHash(undefined);
    }
  }, [receipt, txHash, chainId, formData.matchId]);

  useEffect(() => {
    if (isCreating && txHash) {
      const timeout = setTimeout(() => {
        setIsCreating(false);
        const explorerUrl = getExplorerTxUrl(chainId, txHash);
        setError(
          `Confirmation is taking too long (90s timeout). ${explorerUrl ? `Check here: ${explorerUrl}` : 'Check your wallet'} or try again.`
        );
        setTxHash(undefined);
      }, 90000);

      return () => clearTimeout(timeout);
    }
  }, [isCreating, txHash, chainId]);

  // Clear success message after 10 seconds
  useEffect(() => {
    if (successMatchId) {
      const timeout = setTimeout(() => {
        setSuccessMatchId(null);
      }, 10000);
      return () => clearTimeout(timeout);
    }
  }, [successMatchId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsCreating(true);

    if (!isConnected) {
      setError('Connect your wallet first');
      setIsCreating(false);
      return;
    }

    if (!formData.isCasual && !isOwner) {
      setError('Only the tournament owner can create official matches');
      setIsCreating(false);
      return;
    }

    try {
      if (!formData.matchId || !formData.player1 || !formData.player1Name || !formData.player2 || !formData.player2Name) {
        throw new Error('All fields are required');
      }

      if (!isAddress(formData.player1) || !isAddress(formData.player2)) {
        throw new Error('Invalid Ethereum address');
      }

      if (formData.player1.toLowerCase() === formData.player2.toLowerCase()) {
        throw new Error('Players must be different');
      }

      // Use numeric ID directly for contract
      const matchIdBigInt = BigInt(formData.matchId);
      if (matchIdBigInt <= 0n) throw new Error('Match ID must be a positive number');

      writeContract(
        {
          address: TOURNAMENT_ADDRESS,
          abi: tournamentABI,
          functionName: 'createMatch',
          args: [
            {
              matchId: matchIdBigInt,
              player1: formData.player1 as `0x${string}`,
              player1Name: formData.player1Name,
              player2: formData.player2 as `0x${string}`,
              player2Name: formData.player2Name,
              isCasual: formData.isCasual,
            },
          ],
        },
        {
          onSuccess: (hash) => {
            console.log('[v0] Transaction sent:', hash);
            setTxHash(hash);
          },
          onError: (err: any) => {
            console.error('[v0] writeContract error:', err);
            setError(err.shortMessage || err.message || 'Transaction failed');
            setIsCreating(false);
          },
        }
      );
    } catch (err: any) {
      setError(err.message || 'Invalid input');
      setIsCreating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-6 md:p-8 rounded-2xl border border-white/5"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">Register Match</h2>
        <p className="text-gray-400 text-sm">Create a new 1v1 match – casual or official</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-gray-300 font-medium block mb-2">Match ID (Numeric)</label>
          <input
            type="text"
            name="matchId"
            value={formData.matchId}
            onChange={handleChange}
            placeholder="Enter numeric match ID"
            className="w-full px-4 py-3.5 rounded-xl bg-slate-900/60 border border-slate-700/50 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
            disabled={isCreating || isConfirming || !!successMatchId}
          />
        </div>

        <div className="space-y-2">
          <label className="text-gray-300 font-medium block">Match Type</label>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="matchType"
                checked={formData.isCasual}
                onChange={() => setFormData((prev) => ({ ...prev, isCasual: true }))}
                className="accent-emerald-500 w-4 h-4"
                disabled={isCreating || isConfirming}
              />
              <span className="text-emerald-400">Casual (No Rewards)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="matchType"
                checked={!formData.isCasual}
                onChange={() => setFormData((prev) => ({ ...prev, isCasual: false }))}
                className={`accent-amber-500 w-4 h-4 ${!isOwner ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isCreating || isConfirming || !isOwner}
              />
              <span className={`text-amber-400 ${!isOwner ? 'opacity-50' : ''}`}>
                Official (With Rewards)
              </span>
            </label>
          </div>
          {!isOwner && !formData.isCasual && (
            <p className="text-amber-300 text-xs mt-1">Official matches are admin-only</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="player1"
            value={formData.player1}
            onChange={handleChange}
            placeholder="Player 1 wallet address"
            className="w-full px-4 py-3.5 rounded-xl bg-slate-900/60 border border-slate-700/50 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
            disabled={isCreating || isConfirming}
          />
          <input
            type="text"
            name="player1Name"
            value={formData.player1Name}
            onChange={handleChange}
            placeholder="Player 1 display name"
            className="w-full px-4 py-3.5 rounded-xl bg-slate-900/60 border border-slate-700/50 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
            disabled={isCreating || isConfirming}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="player2"
            value={formData.player2}
            onChange={handleChange}
            placeholder="Player 2 wallet address"
            className="w-full px-4 py-3.5 rounded-xl bg-slate-900/60 border border-slate-700/50 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
            disabled={isCreating || isConfirming}
          />
          <input
            type="text"
            name="player2Name"
            value={formData.player2Name}
            onChange={handleChange}
            placeholder="Player 2 display name"
            className="w-full px-4 py-3.5 rounded-xl bg-slate-900/60 border border-slate-700/50 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
            disabled={isCreating || isConfirming}
          />
        </div>

        <div className="flex justify-between items-center px-1 py-2 text-sm">
          <span className="text-gray-400">Entry Fee (if applicable):</span>
          <span className="font-semibold text-emerald-400">
            {entryFee ? formatEther(entryFee) : '0'} {chain?.nativeCurrency?.symbol || 'Tokens'} {formData.isCasual ? '(waived for casual)' : ''}
          </span>
        </div>

        {txHash && (
          <div className="text-xs text-gray-400 mt-2 break-all">
            Transaction pending on {getExplorerName(chainId) || 'blockchain'}:{' '}
            {getExplorerTxUrl(chainId, txHash) ? (
              <a
                href={getExplorerTxUrl(chainId, txHash)!}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline hover:text-blue-300"
              >
                {txHash.slice(0, 10)}...{txHash.slice(-8)}
              </a>
            ) : (
              <span className="font-mono">{txHash.slice(0, 10)}...{txHash.slice(-8)}</span>
            )}
          </div>
        )}

        {receipt && receipt.status === 'success' && (
          <div className="text-green-400 text-sm mt-2">
            Confirmed in block {receipt.blockNumber.toString()}
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-500/40 text-red-200 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {successMatchId && (
          <div className="bg-green-900/30 border border-green-500/40 text-green-200 px-4 py-3 rounded-xl text-sm space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <div>
                <div className="font-medium">Match created successfully!</div>
                <div className="text-xs text-green-100/70 mt-1">
                  Match ID: <strong className="font-mono">{successMatchId}</strong>
                </div>
                <div className="text-xs text-green-100/70">
                  {formData.isCasual ? '(Casual – no prizes)' : '(Official – with prizes)'}
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isCreating || isConfirming || !isConnected}
          className={`
            w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-3
            ${isCreating || isConfirming
              ? 'bg-slate-700 cursor-wait opacity-70'
              : formData.isCasual
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 shadow-lg shadow-emerald-500/20'
                : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 shadow-lg shadow-amber-500/20'
            }
            text-white disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {isCreating || isConfirming ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Match'
          )}
        </button>
      </form>
    </motion.div>
  );
}
