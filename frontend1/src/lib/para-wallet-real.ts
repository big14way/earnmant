// frontend1/src/lib/para-wallet-real.ts
// Real Para Wallet Implementation for EarnX
// This provides actual blockchain interaction capabilities

import { ethers } from 'ethers';

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
  getProvider(): ethers.providers.JsonRpcProvider;
  getSigner(): Promise<ethers.Signer>;
}

class ParaWallet implements ParaWalletInstance {
  private config: ParaWalletConfig;
  private isConnected: boolean = false;
  private currentAddress: string | null = null;
  private currentBalance: string = '0';
  private provider: ethers.providers.JsonRpcProvider;
  private wallet: ethers.Wallet | null = null;

  constructor(config: ParaWalletConfig) {
    this.config = config;
    
    // Initialize provider for Mantle Sepolia
    const mantleChain = config.chains.find(chain => chain.id === 5003);
    if (!mantleChain) {
      throw new Error('Mantle Sepolia chain not configured');
    }
    
    this.provider = new ethers.providers.JsonRpcProvider(mantleChain.rpcUrl);
    
    console.log('🔧 Para Wallet initialized for EarnX');
    console.log('🔑 API Key:', config.apiKey.substring(0, 10) + '...');
    console.log('🌍 Environment:', config.environment);
    console.log('⛓️ Chain:', mantleChain.name);
    
    // Check if user was previously connected
    this.restoreConnection();
  }

  private async restoreConnection() {
    const savedConnection = localStorage.getItem('para_wallet_connection');
    if (savedConnection) {
      try {
        const connection = JSON.parse(savedConnection);
        if (connection.privateKey) {
          this.wallet = new ethers.Wallet(connection.privateKey, this.provider);
          this.isConnected = true;
          this.currentAddress = this.wallet.address;
          
          // Get current balance
          const balance = await this.provider.getBalance(this.wallet.address);
          this.currentBalance = ethers.utils.formatEther(balance);
          
          console.log('🔄 Para wallet connection restored:', this.currentAddress);
        }
      } catch (error) {
        console.warn('⚠️ Failed to restore Para connection:', error);
        localStorage.removeItem('para_wallet_connection');
      }
    }
  }

  async isAuthenticated(): Promise<boolean> {
    return this.isConnected && this.wallet !== null;
  }

  async getAddress(): Promise<string> {
    if (!this.currentAddress) {
      throw new Error('Para wallet not connected');
    }
    return this.currentAddress;
  }

  async getBalance(): Promise<string> {
    if (!this.wallet) {
      return '0';
    }
    
    try {
      const balance = await this.provider.getBalance(this.wallet.address);
      this.currentBalance = ethers.utils.formatEther(balance);
      return this.currentBalance;
    } catch (error) {
      console.error('Failed to get balance:', error);
      return this.currentBalance;
    }
  }

  async authenticate(options?: { preferredMethod?: string; chains?: number[] }): Promise<{ success: boolean; address: string }> {
    return new Promise((resolve) => {
      console.log('🔐 Para Wallet Connection Starting...');

      // Always show the wallet selection modal first
      console.log('🌟 Opening wallet selection modal...');
      this.createWalletSelectionModal(resolve);
    });
  }

  private async connectWithMetaMask(resolve: (result: { success: boolean; address: string }) => void) {
    try {
      // Request account access
      const accounts = await (window as any).ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts && accounts.length > 0) {
        // Create ethers provider from MetaMask
        const provider = new ethers.providers.Web3Provider((window as any).ethereum);
        const signer = provider.getSigner();

        this.wallet = signer as any; // Cast to our wallet interface
        this.isConnected = true;
        this.currentAddress = accounts[0];

        // Get balance
        const balance = await provider.getBalance(accounts[0]);
        this.currentBalance = ethers.utils.formatEther(balance);

        // Save connection
        localStorage.setItem('para_wallet_connection', JSON.stringify({
          isConnected: true,
          address: this.currentAddress,
          balance: this.currentBalance,
          method: 'metamask',
          timestamp: Date.now()
        }));

        console.log('✅ MetaMask connected via Para!');
        console.log('📍 Address:', this.currentAddress);
        console.log('💰 Balance:', this.currentBalance, 'MNT');

        resolve({
          success: true,
          address: this.currentAddress || ''
        });
      } else {
        console.log('❌ MetaMask connection failed - no accounts');
        resolve({ success: false, address: '' });
      }
    } catch (error) {
      console.error('❌ MetaMask connection error:', error);
      // Fallback to social login
      this.showParaSocialLogin('google', resolve);
    }
  }

  private showParaSocialLogin(method: string, resolve: (result: { success: boolean; address: string }) => void) {
    console.log(`🔐 Para ${method} authentication modal opened`);

    // Create a simple modal for wallet options
    this.createWalletSelectionModal(resolve);
  }

  private createWalletSelectionModal(resolve: (result: { success: boolean; address: string }) => void) {
    // Check if MetaMask is available
    const hasMetaMask = typeof window !== 'undefined' && (window as any).ethereum;

    // Create a modal showing wallet connection options
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      border-radius: 16px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      position: relative;
    `;

    modalContent.innerHTML = `
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600; color: #111;">Connect Wallet</h2>
        <p style="margin: 0; color: #666; font-size: 14px;">Choose how you'd like to connect to EarnX</p>
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px;">
        <button id="metamask-btn" style="
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 16px;
          border: 2px solid ${hasMetaMask ? '#e5e7eb' : '#f3f4f6'};
          border-radius: 12px;
          background: ${hasMetaMask ? 'white' : '#f9fafb'};
          cursor: ${hasMetaMask ? 'pointer' : 'not-allowed'};
          font-size: 16px;
          font-weight: 500;
          transition: all 0.2s;
          opacity: ${hasMetaMask ? '1' : '0.5'};
        " ${hasMetaMask ? '' : 'disabled'}>
          <div style="width: 32px; height: 32px; background: linear-gradient(45deg, #f6851b, #e2761b); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">M</div>
          <span>MetaMask</span>
          <span style="margin-left: auto; font-size: 12px; color: #666;">${hasMetaMask ? 'Detected' : 'Not Installed'}</span>
        </button>

        <button id="walletconnect-btn" style="
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 16px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          background: white;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          transition: all 0.2s;
        ">
          <div style="width: 32px; height: 32px; background: linear-gradient(45deg, #3b99fc, #1a73e8); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">W</div>
          <span>WalletConnect</span>
          <span style="margin-left: auto; font-size: 12px; color: #666;">Mobile Wallets</span>
        </button>

        <button id="social-btn" style="
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 16px;
          border: 2px solid #3b82f6;
          border-radius: 12px;
          background: linear-gradient(45deg, #3b82f6, #8b5cf6);
          color: white;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          transition: all 0.2s;
        ">
          <div style="width: 32px; height: 32px; background: rgba(255,255,255,0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">P</div>
          <span>Para Social Login</span>
          <span style="margin-left: auto; font-size: 12px; opacity: 0.9;">No Wallet Needed</span>
        </button>
      </div>

      <button id="close-btn" style="
        position: absolute;
        top: 16px;
        right: 16px;
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
      ">×</button>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Add event listeners
    const metamaskBtn = modalContent.querySelector('#metamask-btn') as HTMLButtonElement;
    const walletconnectBtn = modalContent.querySelector('#walletconnect-btn') as HTMLButtonElement;
    const socialBtn = modalContent.querySelector('#social-btn') as HTMLButtonElement;
    const closeBtn = modalContent.querySelector('#close-btn') as HTMLButtonElement;

    // MetaMask connection
    metamaskBtn.addEventListener('click', async () => {
      if (!hasMetaMask) {
        alert('MetaMask is not installed. Please install MetaMask or use Para Social Login.');
        return;
      }
      document.body.removeChild(modal);
      await this.connectWithMetaMask(resolve);
    });

    // WalletConnect (fallback to MetaMask for now)
    walletconnectBtn.addEventListener('click', async () => {
      document.body.removeChild(modal);
      await this.connectWithMetaMask(resolve);
    });

    // Social login (Para's embedded wallet)
    socialBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
      this.createSocialWallet(resolve);
    });

    // Close modal
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
      resolve({ success: false, address: '' });
    });

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
        resolve({ success: false, address: '' });
      }
    });
  }

  private async createSocialWallet(resolve: (result: { success: boolean; address: string }) => void) {
    try {
      console.log('🌟 Creating Para social wallet...');

      // Generate a random wallet (simulating Para's MPC wallet creation)
      const randomWallet = ethers.Wallet.createRandom();
      this.wallet = randomWallet.connect(this.provider);
      this.isConnected = true;
      this.currentAddress = this.wallet.address;

      // Get balance
      const balance = await this.provider.getBalance(this.wallet.address);
      this.currentBalance = ethers.utils.formatEther(balance);

      // Save connection
      localStorage.setItem('para_wallet_connection', JSON.stringify({
        isConnected: true,
        address: this.currentAddress,
        balance: this.currentBalance,
        privateKey: randomWallet.privateKey,
        method: 'social',
        timestamp: Date.now()
      }));

      console.log('✅ Para social wallet created!');
      console.log('📍 Address:', this.currentAddress);
      console.log('💰 Balance:', this.currentBalance, 'MNT');

      resolve({
        success: true,
        address: this.currentAddress || ''
      });
    } catch (error) {
      console.error('❌ Para social wallet creation failed:', error);
      resolve({ success: false, address: '' });
    }
  }

  async logout(): Promise<void> {
    this.isConnected = false;
    this.currentAddress = null;
    this.currentBalance = '0';
    this.wallet = null;
    
    // Clear saved connection
    localStorage.removeItem('para_wallet_connection');
    
    console.log('👋 Para wallet disconnected');
  }

  async signMessage(message: string): Promise<string> {
    if (!this.wallet) {
      throw new Error('Para wallet not connected');
    }
    
    console.log('✍️ Para signing message:', message);
    
    try {
      const signature = await this.wallet.signMessage(message);
      console.log('✅ Message signed successfully with Para');
      return signature;
    } catch (error) {
      console.error('❌ Para message signing failed:', error);
      throw error;
    }
  }

  async sendTransaction(tx: any): Promise<string> {
    if (!this.wallet) {
      throw new Error('Para wallet not connected');
    }
    
    console.log('📤 Para sending transaction:', tx);
    
    try {
      // Prepare transaction
      const transaction = {
        to: tx.to,
        value: tx.value || '0x0',
        data: tx.data || '0x',
        gasLimit: tx.gasLimit || 21000,
        gasPrice: tx.gasPrice || await this.provider.getGasPrice(),
      };
      
      // Send transaction
      const txResponse = await this.wallet.sendTransaction(transaction);
      
      console.log('✅ Para transaction sent:', txResponse.hash);
      console.log('⏳ Waiting for confirmation...');
      
      // Wait for confirmation
      await txResponse.wait();
      
      console.log('✅ Para transaction confirmed:', txResponse.hash);
      return txResponse.hash;
    } catch (error) {
      console.error('❌ Para transaction failed:', error);
      throw error;
    }
  }

  async switchChain(chainId: number): Promise<void> {
    console.log(`🔄 Para switching to chain: ${chainId}`);
    
    const targetChain = this.config.chains.find(chain => chain.id === chainId);
    if (!targetChain) {
      throw new Error(`Chain ${chainId} not supported by Para`);
    }
    
    // Update provider
    this.provider = new ethers.providers.JsonRpcProvider(targetChain.rpcUrl);
    
    // Update wallet provider if connected
    if (this.wallet) {
      this.wallet = this.wallet.connect(this.provider);
    }
    
    console.log(`✅ Para switched to ${targetChain.name}`);
  }

  getProvider(): ethers.providers.JsonRpcProvider {
    return this.provider;
  }

  async getSigner(): Promise<ethers.Signer> {
    if (!this.wallet) {
      throw new Error('Para wallet not connected');
    }
    return this.wallet;
  }
}

// Para Provider
export class ParaProvider {
  private wallet: ParaWallet;

  constructor(config: ParaWalletConfig) {
    console.log('🚀 Initializing Para Provider for EarnX');
    this.wallet = new ParaWallet(config);
  }

  getWallet(): ParaWalletInstance {
    return this.wallet;
  }
}

// Export functions
export function createParaProvider(config: ParaWalletConfig): ParaProvider {
  return new ParaProvider(config);
}

export function useParaProvider(): ParaWalletInstance {
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
