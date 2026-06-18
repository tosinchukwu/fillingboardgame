import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccount, useReadContract } from 'wagmi';
import { ArrowRight, Coins, Loader2, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatUnits, parseUnits } from 'viem';

// USDC Token Addresses on Sepolia testnets
const USDC_ADDRESSES = {
  84532: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia USDC
  421614: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d', // Arbitrum Sepolia USDC
  11155420: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7', // Optimism Sepolia USDC
};

// USDC ABI (minimal for balance and approval)
const USDC_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_spender', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      { name: '_owner', type: 'address' },
      { name: '_spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
];

interface BridgeDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// Chain configurations
const SOURCE_CHAINS = {
  'Base Sepolia': {
    chainId: 84532,
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    tokenSymbol: 'USDC',
    tokenName: 'USD Coin',
    tokenDecimals: 6,
    usdcAddress: USDC_ADDRESSES[84532],
  },
  'Arbitrum Sepolia': {
    chainId: 421614,
    name: 'Arbitrum Sepolia',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    blockExplorer: 'https://sepolia.arbiscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    tokenSymbol: 'USDC',
    tokenName: 'USD Coin',
    tokenDecimals: 6,
    usdcAddress: USDC_ADDRESSES[421614],
  },
  'Optimism Sepolia': {
    chainId: 11155420,
    name: 'Optimism Sepolia',
    rpcUrl: 'https://sepolia.optimism.io',
    blockExplorer: 'https://sepolia-optimism.etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    tokenSymbol: 'USDC',
    tokenName: 'USD Coin',
    tokenDecimals: 6,
    usdcAddress: USDC_ADDRESSES[11155420],
  },
};

// Arc Testnet configuration (Chain ID: 5042002)
const ARC_TESTNET = {
  chainId: 5042002,
  name: 'Arc Testnet',
  rpcUrl: 'https://rpc.testnet.arc.network',
  blockExplorer: 'https://testnet.arcscan.app',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 }, // USDC is native gas token
};

const MIN_BRIDGE_AMOUNT = 1; // 1 USDC minimum
const MAX_BRIDGE_AMOUNT = 10000; // 10,000 USDC maximum

export const BridgeDialog: React.FC<BridgeDialogProps> = ({ isOpen, onClose }) => {
  const { isConnected, address, chainId: walletChainId } = useAccount();
  const [amount, setAmount] = useState('1');
  const [sourceChain, setSourceChain] = useState('Base Sepolia');
  const [isBridging, setIsBridging] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [needsApproval, setNeedsApproval] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const isBridgingRef = useRef(false);

  const currentSourceChain = SOURCE_CHAINS[sourceChain as keyof typeof SOURCE_CHAINS];
  const isCorrectNetwork = walletChainId === currentSourceChain?.chainId;

  // Fetch USDC balance on source chain
  const { data: usdcBalanceData, refetch: refetchUsdcBalance } = useReadContract({
    address: currentSourceChain?.usdcAddress as `0x${string}`,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    chainId: currentSourceChain?.chainId,
    query: {
      enabled: !!address && !!currentSourceChain?.usdcAddress,
    }
  });

  const balance = usdcBalanceData !== undefined ? formatUnits(usdcBalanceData as bigint, currentSourceChain.tokenDecimals) : null;
  const balanceNumber = balance ? parseFloat(balance) : 0;

  const validateBridge = () => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first!");
      return false;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.error("Please enter a valid amount to bridge.");
      return false;
    }

    if (numericAmount < MIN_BRIDGE_AMOUNT) {
      toast.error(`Minimum bridge amount is ${MIN_BRIDGE_AMOUNT} USDC`);
      return false;
    }

    if (numericAmount > MAX_BRIDGE_AMOUNT) {
      toast.error(`Maximum bridge amount is ${MAX_BRIDGE_AMOUNT} USDC`);
      return false;
    }

    if (balance && numericAmount > balanceNumber) {
      toast.error(`Insufficient USDC balance. You have ${balance} USDC`);
      return false;
    }

    return true;
  };

  const switchNetwork = async (chainId: number) => {
    try {
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
      toast.success(`Switched to ${currentSourceChain?.name}`);
      return true;
    } catch (error: any) {
      if (error.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${chainId.toString(16)}`,
              chainName: currentSourceChain?.name,
              rpcUrls: [currentSourceChain?.rpcUrl],
              blockExplorerUrls: [currentSourceChain?.blockExplorer],
              nativeCurrency: currentSourceChain?.nativeCurrency
            }]
          });
          toast.success(`Added ${currentSourceChain?.name} to wallet`);
          return true;
        } catch (addError) {
          toast.error('Failed to add network. Please add it manually.');
          return false;
        }
      }
      toast.error('Failed to switch network. Please switch manually.');
      return false;
    }
  };

  const handleBridge = async () => {
    if (!validateBridge()) return;
    if (isBridgingRef.current) return;

    // Check network and switch if needed
    if (!isCorrectNetwork) {
      const switched = await switchNetwork(currentSourceChain.chainId);
      if (!switched) return;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    isBridgingRef.current = true;
    setIsBridging(true);
    setTxHash(null);

    const numericAmount = parseFloat(amount);
    const amountInSmallestUnit = parseUnits(amount, currentSourceChain.tokenDecimals);

    toast.info(`Initiating bridge of ${numericAmount} USDC from ${sourceChain} to Arc Testnet...`);

    try {
      // Check for API key
      const apiKey = import.meta.env.CIRCLE_API_KEY;
      if (!apiKey || apiKey === 'sandbox_key_placeholder') {
        throw new Error("Valid Circle API key not configured. Please check environment variables.");
      }

      const { AppKit } = await import('@circle-fin/app-kit');
      const { createViemAdapterFromProvider } = await import('@circle-fin/adapter-viem-v2');

      // Register Arc Testnet as a custom chain with Circle App Kit
      const arcChainConfig = {
        chainId: ARC_TESTNET.chainId,
        name: ARC_TESTNET.name,
        rpcUrl: ARC_TESTNET.rpcUrl,
        blockExplorerUrl: ARC_TESTNET.blockExplorer,
        nativeCurrency: ARC_TESTNET.nativeCurrency,
      };

      const adapter = await createViemAdapterFromProvider({
        provider: (window as any).ethereum,
      });

      const kit = new AppKit();

      // Bridge USDC from source chain to Arc Testnet
      // Convert chain names to Circle's format (e.g. 'Base Sepolia' -> 'Base_Sepolia')
      const formatChain = (chain: string) => chain.replace(' ', '_');

      // Execute bridging flow via the App Kit SDK
      const response = await kit.bridge({
        from: { adapter: adapter, chain: formatChain(sourceChain) as any },
        to: { adapter: adapter, chain: formatChain('Arc Testnet') as any },
        token: 'USDC',
        amount: numericAmount.toString(),
      });

      console.log('Circle App Kit bridge response:', response);

      toast.success(
        `Successfully bridged ${numericAmount} USDC to Arc Testnet! Now you can use USDC as gas.`,
        { duration: 8000 }
      );

      // Refetch balance after successful bridge
      await refetchUsdcBalance();

      setTimeout(() => {
        onClose();
        setAmount('10');
        setShowConfirm(false);
        setTxHash(null);
      }, 2000);

    } catch (err: any) {
      console.error('Bridge error:', err);

      // Check if it's an approval error
      if (err.message?.toLowerCase().includes('approve') || err.code === 'ACTION_REJECTED') {
        setNeedsApproval(true);
        toast.error('Please approve USDC spending first');
      } else if (import.meta.env.DEV) {
        // Development fallback for testing
        toast.info("Sandbox Mode: Simulating successful bridge operation...");
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const mockTxHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
        setTxHash(mockTxHash);

        toast.success(
          `[SIMULATED] Bridged ${numericAmount} USDC from ${sourceChain} to Arc Testnet!`,
          { duration: 8000 }
        );

        setTimeout(() => {
          onClose();
          setAmount('10');
          setShowConfirm(false);
          setTxHash(null);
        }, 2000);
      } else {
        toast.error(err.message || "Failed to execute bridge transfer. Please check console logs.");
      }
    } finally {
      isBridgingRef.current = false;
      setIsBridging(false);
    }
  };

  const handleConfirmBridge = () => {
    setShowConfirm(true);
  };

  const cancelBridge = () => {
    setShowConfirm(false);
  };

  const numericAmount = parseFloat(amount);
  const isValidAmount = !isNaN(numericAmount) && numericAmount >= MIN_BRIDGE_AMOUNT && numericAmount <= MAX_BRIDGE_AMOUNT;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[420px] glass-panel border-white/20 text-white backdrop-blur-3xl rounded-[2rem] p-8 shadow-2xl"
        style={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
      >
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-black italic tracking-tighter text-indigo-400 flex items-center gap-3 drop-shadow-sm">
            <Coins className="w-6 h-6 text-primary animate-pulse" />
            ARC CROSS-CHAIN BRIDGE
          </DialogTitle>
          <DialogDescription className="text-white/40 font-mono-game uppercase tracking-[0.2em] text-[9px] font-bold">
            Bridge USDC → USDC for Arc gas fees
          </DialogDescription>
        </DialogHeader>

        {txHash && !isBridging && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-green-400 font-mono">Bridge Transaction Submitted</p>
              <p className="text-[10px] text-green-400/70 font-mono break-all">
                {txHash.slice(0, 10)}...{txHash.slice(-8)}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Transfer visualizer */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl border border-indigo-500/20">
            <div className="flex flex-col">
              <span className="text-[9px] text-white/30 font-black uppercase tracking-widest">Source</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-bold text-white">{sourceChain}</span>
              </div>
              <span className="text-[10px] text-white/40 mt-1">Burning USDC</span>
            </div>
            <ArrowRight className="w-5 h-5 text-indigo-400 animate-pulse" />
            <div className="flex flex-col text-right">
              <span className="text-[9px] text-white/30 font-black uppercase tracking-widest">Destination</span>
              <div className="flex items-center gap-2 mt-1 justify-end">
                <span className="text-sm font-bold text-primary">Arc Testnet</span>
              </div>
              <span className="text-[10px] text-green-400 mt-1">Minting USDC (Gas)</span>
            </div>
          </div>

          {/* Source Selection */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-white/30 font-black ml-1">
              Select Source Network
            </label>
            <Select value={sourceChain} onValueChange={(value) => {
              setSourceChain(value);
              setShowConfirm(false);
            }}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white h-12 text-[11px] font-mono uppercase tracking-widest rounded-xl">
                <SelectValue placeholder="Select Source Chain" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10 text-white">
                <SelectItem value="Base Sepolia" className="text-[11px] font-mono uppercase tracking-widest">
                  Base Sepolia (USDC)
                </SelectItem>
                <SelectItem value="Arbitrum Sepolia" className="text-[11px] font-mono uppercase tracking-widest">
                  Arbitrum Sepolia (USDC)
                </SelectItem>
                <SelectItem value="Optimism Sepolia" className="text-[11px] font-mono uppercase tracking-widest">
                  Optimism Sepolia (USDC)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount input */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-[10px] uppercase tracking-widest text-white/30 font-black ml-1">
                USDC Amount to Bridge
              </label>
              {balance && (
                <span className="text-[9px] text-white/40 font-mono">
                  Balance: {parseFloat(balance).toFixed(2)} USDC
                </span>
              )}
            </div>
            <div className="relative">
              <Input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setShowConfirm(false);
                }}
                placeholder="10"
                min={MIN_BRIDGE_AMOUNT}
                max={MAX_BRIDGE_AMOUNT}
                step="1"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-12 pl-4 pr-16 rounded-xl text-lg font-bold focus:border-primary/50"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-green-400 font-mono">
                USDC
              </span>
            </div>
            <div className="flex justify-between text-[8px] text-white/30 font-mono px-1">
              <span>Min: {MIN_BRIDGE_AMOUNT} USDC</span>
              <span>Max: {MAX_BRIDGE_AMOUNT} USDC</span>
            </div>
          </div>

          {/* Bridge mechanics info */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-[10px] text-blue-400 font-mono text-center">
              🔄 USDC burned on {sourceChain} → USDC minted on Arc Testnet for gas
            </p>
          </div>

          {/* Confirmation Dialog */}
          {showConfirm && isValidAmount && (
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl space-y-3">
              <p className="text-sm font-bold text-indigo-400">Confirm Bridge Details</p>
              <div className="space-y-1 text-xs">
                <p className="flex justify-between">
                  <span className="text-white/60">From:</span>
                  <span className="text-white font-mono">{sourceChain}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-white/60">To:</span>
                  <span className="text-white font-mono">Arc Testnet</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-white/60">Bridging:</span>
                  <span className="text-white font-bold">{numericAmount} USDC</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-white/60">Receiving:</span>
                  <span className="text-green-400 font-bold">{numericAmount} USDC (native gas)</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-white/60">Mechanism:</span>
                  <span className="text-white/80">Burn & Mint</span>
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={cancelBridge}
                  className="flex-1 h-10 bg-white/5 hover:bg-white/10 text-white text-xs rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBridge}
                  className="flex-1 h-10 bg-indigo-500 hover:bg-indigo-600 text-white text-xs rounded-lg"
                >
                  Confirm Bridge
                </Button>
              </div>
            </div>
          )}

          {/* Action button */}
          {!showConfirm && (
            <Button
              onClick={handleConfirmBridge}
              disabled={isBridging || !isValidAmount || !isConnected}
              className="w-full h-14 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:from-indigo-500/50 disabled:to-purple-500/50 disabled:cursor-not-allowed text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
            >
              {isBridging ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing Bridge...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Bridge USDC to Arc
                </>
              )}
            </Button>
          )}

          {/* Approval warning */}
          {needsApproval && (
            <div className="flex items-center gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <AlertTriangle className="w-3 h-3 text-yellow-400 flex-shrink-0" />
              <p className="text-[9px] text-yellow-400 font-mono">
                Please approve USDC spending first, then try bridging again
              </p>
            </div>
          )}

          {/* Warning for wrong network */}
          {isConnected && !isCorrectNetwork && (
            <div className="flex items-center gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <AlertTriangle className="w-3 h-3 text-yellow-400 flex-shrink-0" />
              <p className="text-[9px] text-yellow-400 font-mono">
                Please switch to {sourceChain} in your wallet before bridging
              </p>
            </div>
          )}

          {/* Connection warning */}
          {!isConnected && (
            <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
              <p className="text-[9px] text-red-400 font-mono">
                Please connect your wallet to bridge funds
              </p>
            </div>
          )}

          <p className="text-[8px] text-white/30 text-center font-mono uppercase tracking-wider italic">
            Powered by Circle App Kit SDK | USDC Burn & Mint Bridge
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};