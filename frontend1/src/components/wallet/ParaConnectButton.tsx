// frontend1/src/components/wallet/ParaConnectButton.tsx
// Para Connect Button - Replacing RainbowKit ConnectButton
import React, { useState } from 'react';
import { useEarnXWallet } from './ParaWalletProvider';
import { 
  Wallet, 
  LogOut, 
  Copy, 
  ExternalLink, 
  User, 
  Mail, 
  Smartphone,
  Shield,
  Zap
} from 'lucide-react';

interface ParaConnectButtonProps {
  label?: string;
  showBalance?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
}

export function ParaConnectButton({ 
  label = "Connect Wallet",
  showBalance = true,
  size = 'md',
  variant = 'primary'
}: ParaConnectButtonProps) {
  const { 
    address, 
    isConnected, 
    isLoading, 
    connect, 
    disconnect, 
    balance 
  } = useEarnXWallet();
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setShowDropdown(false);
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatBalance = (bal: string) => {
    const num = parseFloat(bal);
    if (num === 0) return '0';
    if (num < 0.001) return '<0.001';
    return num.toFixed(3);
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  // Variant classes
  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 text-white hover:shadow-xl hover:shadow-blue-500/25',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
  };

  if (isLoading) {
    return (
      <button 
        disabled
        className={`${sizeClasses[size]} ${variantClasses[variant]} rounded-2xl font-bold transition-all duration-300 opacity-50 cursor-not-allowed flex items-center gap-2`}
      >
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
        <span>Connecting...</span>
      </button>
    );
  }

  if (!isConnected) {
    return (
      <button
        onClick={handleConnect}
        className={`${sizeClasses[size]} ${variantClasses[variant]} rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 flex items-center gap-2 relative overflow-hidden group`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-purple-700 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative flex items-center gap-2">
          <Wallet className="w-4 h-4" />
          <span>{label}</span>
        </div>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`${sizeClasses[size]} bg-white/90 backdrop-blur-md text-gray-900 rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg border border-gray-200/50 flex items-center gap-3 min-w-0`}
      >
        {/* Wallet Icon */}
        <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-semibold">
          <Wallet className="w-3 h-3" />
          <span>Connected</span>
        </div>
        
        {/* Address */}
        <div className="flex flex-col items-start min-w-0">
          <span className="font-mono text-sm truncate">
            {formatAddress(address!)}
          </span>
          {showBalance && (
            <span className="text-xs text-gray-500">
              {formatBalance(balance)} MNT
            </span>
          )}
        </div>
        
        {/* Status Indicator */}
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 z-50 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900">Para Wallet</div>
                <div className="text-sm text-gray-500 font-mono truncate">
                  {address}
                </div>
              </div>
            </div>
          </div>

          {/* Balance */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Balance</span>
              <span className="font-semibold text-gray-900">
                {formatBalance(balance)} MNT
              </span>
            </div>
          </div>

          {/* Features */}
          <div className="p-4 border-b border-gray-100">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Para Features
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="w-4 h-4 text-green-500" />
                <span>MPC Secure</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Zap className="w-4 h-4 text-blue-500" />
                <span>Gasless Ready</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4 text-purple-500" />
                <span>Social Login</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Smartphone className="w-4 h-4 text-emerald-500" />
                <span>Mobile First</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 space-y-2">
            <button
              onClick={copyAddress}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Copy className="w-4 h-4" />
              <span>{copied ? 'Copied!' : 'Copy Address'}</span>
            </button>
            
            <button
              onClick={() => window.open(`https://explorer.sepolia.mantle.xyz/address/${address}`, '_blank')}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View on Explorer</span>
            </button>
            
            <button
              onClick={handleDisconnect}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}
