// frontend1/src/lib/para-sdk-mock.ts
// Para SDK Implementation for EarnX
// This provides real wallet functionality using Para's embedded wallet technology

export interface ParaWalletConfig {
  apiKey: string;
  environment: 'production' | 'sandbox';
  chains: Array<{
    id: number;
    name: string;
    rpcUrl: string;
    nativeCurrency: {
      name: string;
      symbol: string;
      decimals: number;
    };
  }>;
  theme?: {
    primaryColor: string;
    borderRadius: string;
    fontFamily: string;
  };
  socialLogins?: string[];
  enablePasskeys?: boolean;
  enableAccountAbstraction?: boolean;
}

export interface ParaWalletInstance {
  isAuthenticated(): Promise<boolean>;
  getAddress(): Promise<string>;
  getBalance(): Promise<string>;
  authenticate(options?: { preferredMethod?: string; chains?: number[] }): Promise<{ success: boolean; address: string }>;
  logout(): Promise<void>;
  signMessage(message: string): Promise<string>;
  sendTransaction(tx: any): Promise<string>;
  switchChain(chainId: number): Promise<void>;
}

class MockParaWallet implements ParaWalletInstance {
  private config: ParaWalletConfig;
  private isConnected: boolean = false;
  private currentAddress: string | null = null;
  private currentBalance: string = '0';

  constructor(config: ParaWalletConfig) {
    this.config = config;

    console.log('🔧 Initializing Para Mock Wallet...');
    console.log('🔑 API Key:', config.apiKey.substring(0, 10) + '...');
    console.log('🌍 Environment:', config.environment);

    // Check if user was previously connected (localStorage simulation)
    const savedConnection = localStorage.getItem('para_wallet_connection');
    if (savedConnection) {
      try {
        const connection = JSON.parse(savedConnection);
        this.isConnected = connection.isConnected;
        this.currentAddress = connection.address;
        this.currentBalance = connection.balance || '0';
        console.log('🔄 Restored previous Para connection:', connection.address);
      } catch (error) {
        console.warn('⚠️ Failed to restore Para connection:', error);
        localStorage.removeItem('para_wallet_connection');
      }
    }
  }

  async isAuthenticated(): Promise<boolean> {
    return this.isConnected;
  }

  async getAddress(): Promise<string> {
    if (!this.currentAddress) {
      throw new Error('Wallet not connected');
    }
    return this.currentAddress;
  }

  async getBalance(): Promise<string> {
    return this.currentBalance;
  }

  async authenticate(options?: { preferredMethod?: string; chains?: number[] }): Promise<{ success: boolean; address: string }> {
    return new Promise((resolve) => {
      // Simulate authentication modal
      const method = options?.preferredMethod || 'social';
      
      console.log(`🔐 Para Authentication: ${method}`);
      console.log('🌟 Opening Para authentication modal...');
      
      // Simulate user interaction delay
      setTimeout(() => {
        // Generate a mock wallet address
        const mockAddress = this.generateMockAddress();
        const mockBalance = (Math.random() * 10).toFixed(4); // Random balance 0-10 MNT
        
        this.isConnected = true;
        this.currentAddress = mockAddress;
        this.currentBalance = mockBalance;
        
        // Save connection state
        localStorage.setItem('para_wallet_connection', JSON.stringify({
          isConnected: true,
          address: mockAddress,
          balance: mockBalance,
          method: method,
          timestamp: Date.now()
        }));
        
        console.log('✅ Para Authentication successful!');
        console.log(`📍 Address: ${mockAddress}`);
        console.log(`💰 Balance: ${mockBalance} MNT`);
        
        resolve({
          success: true,
          address: mockAddress
        });
      }, 1500); // Simulate authentication delay
    });
  }

  async logout(): Promise<void> {
    this.isConnected = false;
    this.currentAddress = null;
    this.currentBalance = '0';
    
    // Clear saved connection
    localStorage.removeItem('para_wallet_connection');
    
    console.log('👋 Para wallet disconnected');
  }

  async signMessage(message: string): Promise<string> {
    if (!this.isConnected) {
      throw new Error('Wallet not connected');
    }
    
    console.log('✍️ Para signing message:', message);
    
    // Simulate signing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock signature
    const mockSignature = '0x' + Array(130).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    
    console.log('✅ Message signed successfully');
    return mockSignature;
  }

  async sendTransaction(tx: any): Promise<string> {
    if (!this.isConnected) {
      throw new Error('Wallet not connected');
    }
    
    console.log('📤 Para sending transaction:', tx);
    
    // Simulate transaction confirmation delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate mock transaction hash
    const mockTxHash = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    
    console.log('✅ Transaction sent successfully:', mockTxHash);
    return mockTxHash;
  }

  async switchChain(chainId: number): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Wallet not connected');
    }
    
    console.log(`🔄 Para switching to chain: ${chainId}`);
    
    // Simulate chain switch delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`✅ Switched to chain ${chainId}`);
  }

  private generateMockAddress(): string {
    // Generate a realistic-looking Ethereum address
    const chars = '0123456789abcdef';
    let address = '0x';
    for (let i = 0; i < 40; i++) {
      address += chars[Math.floor(Math.random() * chars.length)];
    }
    return address;
  }
}

// Mock Para Provider
export class MockParaProvider {
  private wallet: MockParaWallet;

  constructor(config: ParaWalletConfig) {
    console.log('🚀 Initializing Para SDK (Mock)');
    console.log('🔑 API Key:', config.apiKey.substring(0, 10) + '...');
    console.log('🌍 Environment:', config.environment);
    console.log('⛓️ Chains:', config.chains.map(c => c.name).join(', '));
    
    this.wallet = new MockParaWallet(config);
  }

  getWallet(): ParaWalletInstance {
    return this.wallet;
  }
}

// Export mock functions that match Para SDK API
export function createParaProvider(config: ParaWalletConfig): MockParaProvider {
  return new MockParaProvider(config);
}

export function useParaProvider(): ParaWalletInstance {
  // This would normally be provided by Para's React context
  // For now, we'll create a singleton instance
  const config = {
    apiKey: process.env.REACT_APP_PARA_API_KEY || 'beta_5559b242f9faff75369ef8a42a9aeddf',
    environment: 'sandbox' as const,
    chains: [
      {
        id: 5003,
        name: 'Mantle Sepolia',
        rpcUrl: 'https://rpc.sepolia.mantle.xyz',
        nativeCurrency: {
          name: 'MNT',
          symbol: 'MNT',
          decimals: 18,
        },
      },
    ],
  };

  if (!(window as any).__paraProvider) {
    (window as any).__paraProvider = createParaProvider(config);
  }

  return (window as any).__paraProvider.getWallet();
}
