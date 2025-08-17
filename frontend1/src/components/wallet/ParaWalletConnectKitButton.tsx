// frontend1/src/components/wallet/ParaWalletConnectKitButton.tsx
// Para WalletConnect Kit Connect Button

import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Wallet, Zap } from 'lucide-react';
import { useParaWalletConnectKit } from './ParaWalletConnectKit';

interface ParaWalletConnectKitButtonProps {
  className?: string;
}

export const ParaWalletConnectKitButton: React.FC<ParaWalletConnectKitButtonProps> = ({
  className = ''
}) => {
  const { isParaMode } = useParaWalletConnectKit();

  return (
    <div className={`para-wallet-connect-kit ${className}`}>
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          authenticationStatus,
          mounted,
        }) => {
          // Note: If your app doesn't use authentication, you
          // can remove all 'authenticationStatus' checks
          const ready = mounted && authenticationStatus !== 'loading';
          const connected =
            ready &&
            account &&
            chain &&
            (!authenticationStatus ||
              authenticationStatus === 'authenticated');

          return (
            <div
              {...(!ready && {
                'aria-hidden': true,
                'style': {
                  opacity: 0,
                  pointerEvents: 'none',
                  userSelect: 'none',
                },
              })}
            >
              {(() => {
                if (!connected) {
                  return (
                    <button
                      onClick={openConnectModal}
                      type="button"
                      className="
                        flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600
                        text-white rounded-lg hover:from-blue-600 hover:to-purple-700
                        transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105
                        font-medium text-sm
                      "
                    >
                      <div className="relative">
                        <Wallet className="w-5 h-5" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full flex items-center justify-center">
                          <Zap className="w-2 h-2 text-yellow-800" />
                        </div>
                      </div>
                      <span>
                        {isParaMode ? 'Connect Para Wallet' : 'Connect Wallet'}
                      </span>
                    </button>
                  );
                }

                if (chain.unsupported) {
                  return (
                    <button
                      onClick={openChainModal}
                      type="button"
                      className="
                        flex items-center gap-2 px-6 py-3 bg-red-500
                        text-white rounded-lg hover:bg-red-600
                        transition-all duration-200 shadow-lg
                        font-medium text-sm
                      "
                    >
                      Wrong network
                    </button>
                  );
                }

                return (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={openChainModal}
                      className="
                        flex items-center gap-2 px-3 py-2 bg-white border border-gray-200
                        rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm
                        font-medium text-sm text-gray-700
                      "
                      type="button"
                    >
                      {chain.hasIcon && (
                        <div
                          style={{
                            background: chain.iconBackground,
                            width: 20,
                            height: 20,
                            borderRadius: 999,
                            overflow: 'hidden',
                            marginRight: 4,
                          }}
                        >
                          {chain.iconUrl && (
                            <img
                              alt={chain.name ?? 'Chain icon'}
                              src={chain.iconUrl}
                              style={{ width: 20, height: 20 }}
                            />
                          )}
                        </div>
                      )}
                      {chain.name}
                    </button>

                    <button
                      onClick={openAccountModal}
                      type="button"
                      className="
                        flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500
                        text-white rounded-lg hover:from-green-600 hover:to-blue-600
                        transition-all duration-200 shadow-lg hover:shadow-xl
                        font-medium text-sm
                      "
                    >
                      <div className="relative">
                        <Wallet className="w-5 h-5" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full" />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="font-medium text-white text-sm">
                          {account.displayName}
                          {account.displayBalance
                            ? ` (${account.displayBalance})`
                            : ''}
                        </span>
                        <span className="text-xs text-green-100">
                          {isParaMode ? 'Para Wallet' : 'Connected'}
                        </span>
                      </div>
                    </button>
                  </div>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>
    </div>
  );
};

export default ParaWalletConnectKitButton;
