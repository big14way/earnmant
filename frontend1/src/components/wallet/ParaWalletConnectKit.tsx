// frontend1/src/components/wallet/ParaWalletConnectKit.tsx
// Para WalletConnect Kit Integration Component

import React, { createContext, useContext, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
// @ts-ignore
import { WagmiProvider } from 'wagmi';
import { config } from '../../wagmi';

// Para WalletConnect Kit Context
interface ParaWalletConnectKitContextType {
  isParaMode: boolean;
  projectId: string;
}

const ParaWalletConnectKitContext = createContext<ParaWalletConnectKitContextType | undefined>(undefined);

export const useParaWalletConnectKit = () => {
  const context = useContext(ParaWalletConnectKitContext);
  if (!context) {
    throw new Error('useParaWalletConnectKit must be used within ParaWalletConnectKitProvider');
  }
  return context;
};

interface ParaWalletConnectKitProviderProps {
  children: ReactNode;
  projectId?: string;
}

export const ParaWalletConnectKitProvider: React.FC<ParaWalletConnectKitProviderProps> = ({
  children,
  projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || '2f05a7cde2bb14fabf75a97db2e9023f',
}) => {
  const isParaMode = process.env.REACT_APP_USE_PARA_WALLET === 'true';
  const queryClient = new QueryClient();

  const contextValue: ParaWalletConnectKitContextType = {
    isParaMode,
    projectId,
  };

  return (
    <ParaWalletConnectKitContext.Provider value={contextValue}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          <RainbowKitProvider>
            {children}
          </RainbowKitProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </ParaWalletConnectKitContext.Provider>
  );
};

export default ParaWalletConnectKitProvider;
