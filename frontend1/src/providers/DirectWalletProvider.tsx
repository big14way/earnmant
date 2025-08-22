// Direct MetaMask provider - bypasses Para SDK issues
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  isLoading: boolean;
  error: string | null;
}

interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  switchChain: (chainId: number) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within DirectWalletProvider');
  }
  return context;
};

interface DirectWalletProviderProps {
  children: ReactNode;
}

export const DirectWalletProvider: React.FC<DirectWalletProviderProps> = ({ children }) => {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: null,
    chainId: null,
    isLoading: false,
    error: null,
  });

  // Check if MetaMask is available
  const isMetaMaskAvailable = () => {
    return typeof window !== 'undefined' && !!(window as any).ethereum;
  };

  // Connect to MetaMask
  const connect = async () => {
    if (!isMetaMaskAvailable()) {
      setState(prev => ({ ...prev, error: 'MetaMask not detected. Please install MetaMask.' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const ethereum = (window as any).ethereum;
      
      // Request account access
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      // Get current chain
      const chainId = await ethereum.request({
        method: 'eth_chainId',
      });

      const address = accounts[0];
      const numericChainId = parseInt(chainId, 16);

      console.log('✅ Direct wallet connected:', {
        address,
        chainId: numericChainId,
        accounts: accounts.length
      });

      setState(prev => ({
        ...prev,
        isConnected: true,
        address,
        chainId: numericChainId,
        isLoading: false,
        error: null,
      }));

      // Switch to Mantle Sepolia if not already on it
      if (numericChainId !== 5003) {
        await switchChain(5003);
      }

    } catch (error: any) {
      console.error('❌ Direct wallet connection failed:', error);
      setState(prev => ({
        ...prev,
        isConnected: false,
        address: null,
        chainId: null,
        isLoading: false,
        error: error.message || 'Failed to connect wallet',
      }));
    }
  };

  // Disconnect wallet
  const disconnect = () => {
    console.log('🔌 Direct wallet disconnected');
    setState({
      isConnected: false,
      address: null,
      chainId: null,
      isLoading: false,
      error: null,
    });
  };

  // Switch chain
  const switchChain = async (targetChainId: number) => {
    if (!isMetaMaskAvailable()) return;

    const ethereum = (window as any).ethereum;
    const chainIdHex = `0x${targetChainId.toString(16)}`;

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: chainIdHex,
                chainName: 'Mantle Sepolia',
                nativeCurrency: {
                  name: 'MNT',
                  symbol: 'MNT',
                  decimals: 18,
                },
                rpcUrls: ['https://rpc.sepolia.mantle.xyz'],
                blockExplorerUrls: ['https://explorer.sepolia.mantle.xyz'],
              },
            ],
          });
        } catch (addError) {
          console.error('❌ Failed to add chain:', addError);
        }
      } else {
        console.error('❌ Failed to switch chain:', switchError);
      }
    }
  };

  // Listen for account changes
  useEffect(() => {
    if (!isMetaMaskAvailable()) return;

    const ethereum = (window as any).ethereum;

    const handleAccountsChanged = (accounts: string[]) => {
      console.log('👤 Accounts changed:', accounts);
      if (accounts.length === 0) {
        disconnect();
      } else if (accounts[0] !== state.address) {
        setState(prev => ({
          ...prev,
          address: accounts[0],
          isConnected: accounts.length > 0,
        }));
      }
    };

    const handleChainChanged = (chainId: string) => {
      const numericChainId = parseInt(chainId, 16);
      console.log('⛓️ Chain changed to:', numericChainId);
      setState(prev => ({
        ...prev,
        chainId: numericChainId,
      }));
    };

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    // Check if already connected on mount
    const checkConnection = async () => {
      try {
        const accounts = await ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          const chainId = await ethereum.request({ method: 'eth_chainId' });
          const numericChainId = parseInt(chainId, 16);
          
          console.log('🔄 Restored connection:', {
            address: accounts[0],
            chainId: numericChainId
          });

          setState(prev => ({
            ...prev,
            isConnected: true,
            address: accounts[0],
            chainId: numericChainId,
          }));
        }
      } catch (error) {
        console.error('❌ Failed to check connection:', error);
      }
    };

    checkConnection();

    return () => {
      ethereum.removeListener('accountsChanged', handleAccountsChanged);
      ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [state.address]);

  const contextValue: WalletContextType = {
    ...state,
    connect,
    disconnect,
    switchChain,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};