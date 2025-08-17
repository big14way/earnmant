// frontend1/src/components/wallet/ParaWalletProvider.tsx
// Para Wallet Integration for EarnX - Working alongside Wagmi
import React, { createContext, useContext, useEffect, useState } from 'react';
import { PARA_CONFIG } from '../../config/para';
import { useParaProvider, createParaProvider } from '../../lib/para-wallet-real';

interface EarnXWalletContextType {
  address: string | null;
  isConnected: boolean;
  isLoading: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  sendTransaction: (tx: any) => Promise<string>;
  switchChain: (chainId: number) => Promise<void>;
  balance: string;
  ensName?: string;
}

const EarnXWalletContext = createContext<EarnXWalletContextType | null>(null);

export function ParaWalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <EarnXWalletWrapper>
      {children}
    </EarnXWalletWrapper>
  );
}

function EarnXWalletWrapper({ children }: { children: React.ReactNode }) {
  const para = useParaProvider();

  // Para-specific state
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [balance, setBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(false);

  // Determine which wallet system to use
  const useParaWallet = process.env.REACT_APP_USE_PARA_WALLET === 'true';

  // Initialize Para wallet connection only when Para is enabled
  useEffect(() => {
    if (!useParaWallet) return;

    const initializePara = async () => {
      try {
        setIsLoading(true);
        console.log('🚀 Initializing Para wallet provider...');

        // Check if user is already authenticated
        const isAuthenticated = await para.isAuthenticated();
        console.log('🔍 Para authentication status:', isAuthenticated);

        if (isAuthenticated) {
          const walletAddress = await para.getAddress();
          setAddress(walletAddress);
          setIsConnected(true);

          // Get balance
          const walletBalance = await para.getBalance();
          setBalance(walletBalance);

          console.log('✅ Para wallet restored:', {
            address: walletAddress,
            balance: walletBalance
          });
        } else {
          console.log('📱 Para wallet not connected, ready for authentication');
        }
      } catch (error) {
        console.error('❌ Para initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (para && useParaWallet) {
      initializePara();
    }
  }, [para, useParaWallet]);

  const connect = async () => {
    if (useParaWallet) {
      try {
        setIsLoading(true);

        // Open Para authentication modal
        const result = await para.authenticate({
          preferredMethod: 'social', // Start with social login
          chains: [5003], // Mantle Sepolia
        });

        if (result.success) {
          setAddress(result.address);
          setIsConnected(true);

          // Get balance after connection
          const walletBalance = await para.getBalance();
          setBalance(walletBalance);
        }
      } catch (error) {
        console.error('Para connection error:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    } else {
      // For Wagmi, connection is handled by RainbowKit
      console.log('Using Wagmi/RainbowKit for connection');
    }
  };

  const disconnect = async () => {
    if (useParaWallet) {
      try {
        await para.logout();
        setAddress(null);
        setIsConnected(false);
        setBalance('0');
      } catch (error) {
        console.error('Para disconnect error:', error);
      }
    } else {
      // For non-Para mode, this would be handled by RainbowKit
      console.log('Disconnect handled by RainbowKit');
    }
  };

  const signMessage = async (message: string): Promise<string> => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    if (useParaWallet) {
      return await para.signMessage(message);
    } else {
      // For Wagmi, this would need to be implemented with useSignMessage hook
      throw new Error('Message signing not implemented for Wagmi in this context');
    }
  };

  const sendTransaction = async (tx: any): Promise<string> => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    if (useParaWallet) {
      return await para.sendTransaction(tx);
    } else {
      // For Wagmi, this would need to be implemented with useSendTransaction hook
      throw new Error('Transaction sending not implemented for Wagmi in this context');
    }
  };

  const switchChain = async (chainId: number) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    if (useParaWallet) {
      await para.switchChain(chainId);
    } else {
      // For Wagmi, this would need to be implemented with useSwitchChain hook
      console.log('Chain switching for Wagmi not implemented in this context');
    }
  };

  const contextValue: EarnXWalletContextType = {
    address,
    isConnected,
    isLoading,
    connect,
    disconnect,
    signMessage,
    sendTransaction,
    switchChain,
    balance,
  };

  return (
    <EarnXWalletContext.Provider value={contextValue}>
      {children}
    </EarnXWalletContext.Provider>
  );
}

// Custom hook to use EarnX wallet context
export function useEarnXWallet() {
  const context = useContext(EarnXWalletContext);
  if (!context) {
    throw new Error('useEarnXWallet must be used within ParaWalletProvider');
  }
  return context;
}

// Note: We don't need to export useAccount since we're using wagmi's useAccount
// The ParaWalletProvider works alongside wagmi, not replacing it

// Compatibility hook for wallet client
export function useWalletClient() {
  const wallet = useEarnXWallet();
  
  return {
    data: wallet.isConnected ? {
      writeContract: async (params: any) => {
        return await wallet.sendTransaction(params);
      },
      signMessage: async (params: { message: string }) => {
        return await wallet.signMessage(params.message);
      },
      switchChain: async (params: { id: number }) => {
        return await wallet.switchChain(params.id);
      },
    } : null,
  };
}
