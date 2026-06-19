import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useAccount, useDisconnect, useBalance, useReadContract } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { Coins, LogOut, Wallet, ChevronDown, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { formatUnits } from 'viem';

// Network token symbols
const NETWORK_TOKENS: Record<number, { symbol: string; name: string; decimals: number }> = {
    1: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
    8453: { symbol: 'ETH', name: 'Base', decimals: 18 },
    42161: { symbol: 'ETH', name: 'Arbitrum', decimals: 18 },
    10: { symbol: 'ETH', name: 'Optimism', decimals: 18 },
    43114: { symbol: 'AVAX', name: 'Avalanche', decimals: 18 },
    137: { symbol: 'POL', name: 'Polygon', decimals: 18 },
    56: { symbol: 'BNB', name: 'BNB Chain', decimals: 18 },
    250: { symbol: 'FTM', name: 'Fantom', decimals: 18 },
    5042002: { symbol: 'USDC', name: 'Arc Testnet', decimals: 6 },
    // Testnets
    11155111: { symbol: 'ETH', name: 'Sepolia', decimals: 18 },
    84532: { symbol: 'ETH', name: 'Base Sepolia', decimals: 18 },
    421614: { symbol: 'ETH', name: 'Arbitrum Sepolia', decimals: 18 },
    11155420: { symbol: 'ETH', name: 'Optimism Sepolia', decimals: 18 },
    43113: { symbol: 'AVAX', name: 'Avalanche Fuji', decimals: 18 },
};

// USDC Token Addresses on supported networks
const USDC_ADDRESSES: Record<number, string> = {
    // Mainnets
    1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Ethereum
    8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base
    42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // Arbitrum
    10: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', // Optimism
    43114: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // Avalanche
    137: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // Polygon
    56: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // BNB Chain
    // Testnets
    11155111: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Sepolia
    84532: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia
    421614: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d', // Arbitrum Sepolia
    11155420: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7', // Optimism Sepolia
    43113: '0x5425890298aed601595a70AB815c96711a31Bc65', // Avalanche Fuji
    5042002: '0x0000000000000000000000000000000000000000', // Arc Testnet (USDC is native)
};

// USDC ABI (minimal for balance)
const USDC_ABI = [
    {
        constant: true,
        inputs: [{ name: '_owner', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: 'balance', type: 'uint256' }],
        type: 'function',
    },
] as const;

export const CircleWalletButton = () => {
    const { open } = useWeb3Modal();
    const { address, isConnected, chainId } = useAccount();
    const { disconnect } = useDisconnect();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [nativeBalance, setNativeBalance] = useState<string>('0.00');
    const [usdcBalance, setUsdcBalance] = useState<string>('0.00');

    // ✅ Add ref for dropdown container
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Get native balance
    const { data: balanceData, refetch: refetchBalance } = useBalance({
        address: address,
        chainId: chainId,
        query: {
            enabled: !!address && !!chainId,
            refetchInterval: 10000,
        }
    });

    // Get USDC balance
    const usdcAddress = chainId ? USDC_ADDRESSES[chainId] : undefined;
    const { data: usdcBalanceData, refetch: refetchUsdcBalance } = useReadContract({
        address: usdcAddress as `0x${string}`,
        abi: USDC_ABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
        chainId: chainId,
        query: {
            enabled: !!address && !!chainId && !!usdcAddress && usdcAddress !== '0x0000000000000000000000000000000000000000',
            refetchInterval: 10000,
        }
    });

    // Update native balance
    useEffect(() => {
        if (balanceData) {
            const formatted = formatUnits(balanceData.value, balanceData.decimals);
            const num = parseFloat(formatted);
            if (num < 0.01) {
                setNativeBalance('< 0.01');
            } else if (num < 1) {
                setNativeBalance(num.toFixed(4));
            } else if (num < 100) {
                setNativeBalance(num.toFixed(2));
            } else {
                setNativeBalance(num.toFixed(0));
            }
        }
    }, [balanceData]);

    // Update USDC balance
    useEffect(() => {
        if (usdcBalanceData !== undefined && usdcBalanceData !== null) {
            const formatted = formatUnits(usdcBalanceData as bigint, 6);
            const num = parseFloat(formatted);
            if (num < 0.01) {
                setUsdcBalance('< 0.01');
            } else if (num < 1) {
                setUsdcBalance(num.toFixed(4));
            } else if (num < 100) {
                setUsdcBalance(num.toFixed(2));
            } else {
                setUsdcBalance(num.toFixed(0));
            }
        } else {
            setUsdcBalance('0.00');
        }
    }, [usdcBalanceData]);

    const formatAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const getTokenInfo = () => {
        if (!chainId) return { symbol: 'ETH', name: 'Unknown' };
        return NETWORK_TOKENS[chainId] || { symbol: 'ETH', name: 'Unknown' };
    };

    const tokenInfo = getTokenInfo();
    const hasUSDC = chainId && usdcAddress && usdcAddress !== '0x0000000000000000000000000000000000000000';

    // Refetch balances on network change
    useEffect(() => {
        if (address && chainId) {
            refetchBalance();
            refetchUsdcBalance();
        }
    }, [chainId, address, refetchBalance, refetchUsdcBalance]);

    // ✅ Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        // Add event listener when dropdown is open
        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        // Cleanup
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

    // ✅ Handle Escape key to close dropdown
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isDropdownOpen) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isDropdownOpen]);

    // ✅ Toggle dropdown
    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    // ✅ Close dropdown
    const closeDropdown = () => {
        setIsDropdownOpen(false);
    };

    if (!isConnected) {
        return (
            <Button
                onClick={() => open()}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 
           text-white font-medium px-3 sm:px-4 py-2.5 rounded-xl transition-all duration-200 
           flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-purple-500/20 h-9 sm:h-10 text-[10px] sm:text-xs touch-target"
            >
                <Wallet className="w-4 h-4" />
                Connect Wallet
            </Button>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                onClick={toggleDropdown}
                className="bg-[#1a1a2e] border border-gray-700 hover:border-gray-500 
                 text-white font-medium rounded-xl transition-all 
                 flex items-center gap-3 h-10 text-xs px-3"
            >
                {/* Network Indicator */}
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[9px] text-white/50 font-mono uppercase">
                        {tokenInfo.symbol}
                    </span>
                </div>

                {/* Native Balance */}
                <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg">
                    <Coins className="w-3 h-3 text-blue-400" />
                    <span className="font-mono text-white/90">
                        {nativeBalance}
                    </span>
                </div>

                {/* USDC Balance (if available) */}
                {hasUSDC && (
                    <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg">
                        <DollarSign className="w-3 h-3 text-green-400" />
                        <span className="font-mono text-white/90">
                            {usdcBalance}
                        </span>
                    </div>
                )}

                {/* Address */}
                <span className="font-mono text-white/80 border-l border-gray-700 pl-2">
                    {formatAddress(address)}
                </span>

                <ChevronDown className={`w-3 h-3 text-white/50 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </Button>

            {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-[#1a1a2e] border border-gray-700 rounded-xl shadow-xl py-1 z-50">
                    {/* Wallet Info */}
                    <div className="px-4 py-3 border-b border-gray-700 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">Network</span>
                            <span className="text-xs text-white font-medium flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                                {tokenInfo.name} ({tokenInfo.symbol})
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">Native Balance</span>
                            <span className="text-sm text-white font-bold flex items-center gap-1.5">
                                <Coins className="w-3.5 h-3.5 text-blue-400" />
                                {nativeBalance} {tokenInfo.symbol}
                            </span>
                        </div>

                        {hasUSDC && (
                            <div className="flex items-center justify-between border-t border-gray-700/50 pt-2">
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <DollarSign className="w-3 h-3 text-green-400" />
                                    USDC Balance
                                </span>
                                <span className="text-sm text-white font-bold flex items-center gap-1.5">
                                    <span className="text-green-400">●</span>
                                    {usdcBalance} USDC
                                </span>
                            </div>
                        )}

                        <div className="flex items-center justify-between border-t border-gray-700/50 pt-2">
                            <span className="text-xs text-gray-400">Address</span>
                            <span className="text-[10px] text-white/70 font-mono">{formatAddress(address)}</span>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="px-2 py-1 border-b border-gray-700">
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(address || '');
                                toast.success('Address copied to clipboard!');
                                closeDropdown();
                            }}
                            className="w-full text-left px-3 py-2 text-xs text-white/70 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                            Copy Address
                        </button>
                        <button
                            onClick={() => {
                                const explorerUrl = `https://etherscan.io/address/${address}`;
                                window.open(explorerUrl, '_blank');
                                closeDropdown();
                            }}
                            className="w-full text-left px-3 py-2 text-xs text-white/70 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            View on Explorer
                        </button>
                    </div>

                    {/* Circle App Kit Badge */}
                    <div className="px-4 py-2 border-b border-gray-700">
                        <div className="flex items-center gap-2 text-[8px] text-white/20 font-mono uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            Powered by Circle App Kit
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        </div>
                    </div>

                    {/* Disconnect */}
                    <button
                        onClick={() => {
                            disconnect();
                            closeDropdown();
                            toast.success("Wallet disconnected");
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 
                     transition-colors flex items-center gap-2 rounded-b-xl"
                    >
                        <LogOut className="w-4 h-4" />
                        Disconnect
                    </button>
                </div>
            )}
        </div>
    );
};

export default CircleWalletButton;