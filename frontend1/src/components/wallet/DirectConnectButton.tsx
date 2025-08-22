// Direct MetaMask connect button - reliable alternative to Para SDK
import React, { useState } from 'react';
import { useWallet } from '../../providers/DirectWalletProvider';
import { Wallet, ChevronDown, ExternalLink, LogOut, Copy, Check, Network } from 'lucide-react';

interface DirectConnectButtonProps {
  className?: string;
  variant?: 'default' | 'compact';
}

export const DirectConnectButton: React.FC<DirectConnectButtonProps> = ({ 
  className = '', 
  variant = 'default' 
}) => {
  const { isConnected, address, chainId, isLoading, error, connect, disconnect } = useWallet();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const getNetworkName = (chainId: number | null) => {
    switch (chainId) {
      case 5003: return 'Mantle Sepolia';
      case 5000: return 'Mantle';
      case 1: return 'Ethereum';
      case 137: return 'Polygon';
      default: return chainId ? `Chain ${chainId}` : 'Unknown';
    }
  };

  const getNetworkColor = (chainId: number | null) => {
    switch (chainId) {
      case 5003: 
      case 5000: return 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/20';
      case 1: return 'text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20';
      case 137: return 'text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/20';
      default: return 'text-gray-700 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const formatAddress = (addr: string | null) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyAddress = async () => {
    if (!address) return;
    
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  const openExplorer = () => {
    if (!address) return;
    
    let explorerUrl = '';
    switch (chainId) {
      case 5003:
        explorerUrl = `https://explorer.sepolia.mantle.xyz/address/${address}`;
        break;
      case 5000:
        explorerUrl = `https://explorer.mantle.xyz/address/${address}`;
        break;
      case 1:
        explorerUrl = `https://etherscan.io/address/${address}`;
        break;
      case 137:
        explorerUrl = `https://polygonscan.com/address/${address}`;
        break;
      default:
        explorerUrl = `https://explorer.sepolia.mantle.xyz/address/${address}`;
    }
    
    window.open(explorerUrl, '_blank');
  };

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <button
        disabled
        className={`
          relative group bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 text-white 
          ${variant === 'compact' ? 'px-4 py-2 text-sm' : 'px-6 py-3 text-base'} 
          rounded-2xl font-bold opacity-50 cursor-not-allowed
          ${className}
        `}
      >
        <div className="relative flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span className={variant === 'compact' ? 'hidden sm:inline' : ''}>
            Connecting...
          </span>
        </div>
      </button>
    );
  }

  // Show error state
  if (error) {
    return (
      <button
        onClick={handleConnect}
        className={`
          relative group bg-gradient-to-r from-red-600 to-red-700 text-white 
          ${variant === 'compact' ? 'px-4 py-2 text-sm' : 'px-6 py-3 text-base'} 
          rounded-2xl font-bold hover:shadow-xl hover:shadow-red-500/25 
          transition-all duration-300 transform hover:scale-105
          ${className}
        `}
      >
        <div className="relative flex items-center gap-2">
          <Wallet className="w-4 h-4" />
          <span className={variant === 'compact' ? 'hidden sm:inline' : ''}>
            Retry Connection
          </span>
        </div>
      </button>
    );
  }

  // Not connected state
  if (!isConnected) {
    return (
      <button
        onClick={handleConnect}
        className={`
          relative group bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 text-white 
          ${variant === 'compact' ? 'px-4 py-2 text-sm' : 'px-6 py-3 text-base'} 
          rounded-2xl font-bold hover:shadow-xl hover:shadow-blue-500/25 
          transition-all duration-300 transform hover:scale-105
          ${className}
        `}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-purple-700 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
        <div className="relative flex items-center gap-2">
          <Wallet className="w-4 h-4" />
          <span className={variant === 'compact' ? 'hidden sm:inline' : ''}>
            Connect Wallet
          </span>
        </div>
      </button>
    );
  }

  // Connected state
  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsDropdownOpen(!isDropdownOpen);
        }}
        className={`
          relative group bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white 
          ${variant === 'compact' ? 'px-4 py-2 text-sm' : 'px-4 py-3 text-base'} 
          rounded-2xl font-semibold hover:shadow-xl hover:shadow-green-500/25 
          transition-all duration-300 transform hover:scale-105
          ${className}
        `}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-green-700 via-emerald-700 to-teal-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
        <div className="relative flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          <span className="font-semibold">
            {formatAddress(address)}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
            isDropdownOpen ? 'rotate-180' : ''
          }`} />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
          {/* Account Info */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Connected Account</span>
              <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-xs font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                MetaMask
              </div>
            </div>
            
            {/* Network Info */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Network</span>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${getNetworkColor(chainId)}`}>
                <Network className="w-3 h-3" />
                {getNetworkName(chainId)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <code className="text-sm font-mono text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-lg">
                {formatAddress(address)}
              </code>
              <button
                onClick={copyAddress}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                title="Copy address"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-500" />
                )}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="p-2">
            <button
              onClick={openExplorer}
              className="w-full flex items-center gap-3 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              View on Explorer
            </button>
            <button
              onClick={() => {
                disconnect();
                setIsDropdownOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              Disconnect
            </button>
          </div>
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default DirectConnectButton;