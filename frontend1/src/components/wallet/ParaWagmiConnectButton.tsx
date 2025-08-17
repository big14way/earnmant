// frontend1/src/components/wallet/ParaWagmiConnectButton.tsx
// Para-Wagmi Connect Button - Compatible with Wagmi

import React from 'react';
import { Wallet, ChevronDown, LogOut, Zap, Shield, Layers } from 'lucide-react';
// @ts-ignore - Para integration temporarily disabled for main app functionality
// import { useAccount, useConnect, useDisconnect } from 'wagmi';

interface ParaWagmiConnectButtonProps {
  className?: string;
}

export function ParaWagmiConnectButton({ className = '' }: ParaWagmiConnectButtonProps) {
  // @ts-ignore - Para integration temporarily disabled for main app functionality
  // const { address, isConnected } = useAccount();
  // const { connect, connectors, isPending } = useConnect();
  // const { disconnect } = useDisconnect();

  // Mock values for development
  const address = null;
  const isConnected = false;
  const connect = () => console.log('Connect clicked (mocked)');
  const connectors = [];
  const isPending = false;
  const disconnect = () => console.log('Disconnect clicked (mocked)');
  const isLoading = false;
  const openWalletModal = () => console.log('Open wallet modal (mocked)');
  const ensName = null;
  const balance = '0.0';
  const openConnectModal = () => console.log('Open connect modal (mocked)');

  // Format address for display
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Format balance for display
  const formatBalance = (bal: string) => {
    const num = parseFloat(bal);
    if (num === 0) return '0.00';
    if (num < 0.001) return '< 0.001';
    return num.toFixed(3);
  };

  // Loading state
  if (isLoading) {
    return (
      <button
        disabled
        className={`
          flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-purple-600 
          text-white rounded-lg opacity-50 cursor-not-allowed transition-all duration-200
          ${className}
        `}
      >
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        <span>Connecting...</span>
      </button>
    );
  }

  // Connected state
  if (isConnected && address) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Account Info Button */}
        <button
          onClick={openWalletModal}
          className="
            flex items-center gap-3 px-4 py-2 bg-white border border-gray-200 
            rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm
            min-w-0 flex-1 group
          "
        >
          {/* Para + Wagmi Avatar */}
          <div className="relative w-8 h-8 bg-gradient-to-br from-orange-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <Wallet className="w-4 h-4 text-white" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
              <Layers className="w-2 h-2 text-white" />
            </div>
          </div>

          {/* Account Details */}
          <div className="flex flex-col items-start min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 text-sm">
                {ensName || formatAddress(address)}
              </span>
              <span className="text-xs bg-gradient-to-r from-orange-100 to-blue-100 text-orange-800 px-2 py-0.5 rounded-full font-medium border border-orange-200">
                Para + Wagmi
              </span>
              <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
            <span className="text-xs text-gray-500">
              {balance} MNT
            </span>
          </div>
        </button>

        {/* Disconnect Button */}
        <button
          onClick={disconnect}
          className="
            flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 
            rounded-lg transition-all duration-200 text-gray-600 hover:text-gray-800
          "
          title="Disconnect Para Wallet"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Disconnected state - Connect button
  return (
    <button
      onClick={openConnectModal}
      className={`
        flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-orange-500 to-purple-600 
        text-white rounded-lg hover:from-orange-600 hover:to-purple-700 
        transition-all duration-200 shadow-sm hover:shadow-md
        font-medium text-sm relative overflow-hidden group
        ${className}
      `}
    >
      {/* Background animation */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      
      {/* Content */}
      <div className="relative flex items-center gap-2">
        <div className="relative">
          <Wallet className="w-4 h-4" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full flex items-center justify-center">
            <Layers className="w-1 h-1 text-blue-800" />
          </div>
        </div>
        <span>Connect Para</span>
        <div className="flex items-center gap-1 text-xs opacity-75">
          <Shield className="w-3 h-3" />
          <span>EVM</span>
        </div>
      </div>
    </button>
  );
}

// Export for compatibility
export { ParaWagmiConnectButton as ParaConnectButton };
