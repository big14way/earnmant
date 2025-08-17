// src/wagmi.ts - Wagmi v2.9+ Config with Para WalletConnect Support
import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

// Define Mantle Sepolia testnet chain
export const mantleSepolia = {
  id: 5003,
  name: 'Mantle Sepolia',
  network: 'mantle-sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'MNT',
    symbol: 'MNT',
  },
  rpcUrls: {
    public: { http: ['https://rpc.sepolia.mantle.xyz'] },
    default: { http: ['https://rpc.sepolia.mantle.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Mantle Explorer', url: 'https://explorer.sepolia.mantle.xyz' },
  },
  testnet: true,
} as const;

// Standard Wagmi config with WalletConnect support (Para wallet can connect via WalletConnect)
export const config = getDefaultConfig({
  appName: 'EarnX Protocol',
  projectId: process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || '2f05a7cde2bb14fabf75a97db2e9023f',
  chains: [mantleSepolia],
  ssr: false,
  // Suppress WalletConnect errors in development
  metadata: {
    name: 'EarnX Protocol',
    description: 'African Trade Finance DeFi Protocol',
    url: process.env.NODE_ENV === 'production' ? 'https://earnx.app' : 'http://localhost:3000',
    icons: ['https://earnx.app/icon.png']
  }
});