// src/App.tsx - Complete EarnX App with Para Integration
import React, { useState, useEffect } from 'react';
// @ts-ignore - wagmi v2 type definitions issue
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './wagmi';
import { ParaWalletInfo } from './components/wallet/ParaWalletInfo';
import { ParaWalletConnectKitProvider } from './components/wallet/ParaWalletConnectKit';
import './styles/premium-animations.css';
import { TabId } from './types/index';
import { Navigation } from './components/layout/Navigation';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './components/pages/LandingPage';
import { Dashboard } from './components/pages/Dashboard';
import  InvestPage  from './components/pages/InvestPage';
import { SubmitInvoice } from './components/pages/SubmitInvoice';
import { ParaIntegrationTest } from './components/test/ParaIntegrationTest';
import { NFTInvoiceGallery } from './components/NFTInvoiceGallery';
import TransactionHistory from './components/pages/TransactionHistory';

import { VideoModal } from './components/ui/VideoModal';
import { TransactionNotificationManager } from './components/ui/TransactionNotification';
import { ThemeProvider } from './context/ThemeContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Disable retries to reduce console noise in development
    },
  },
});

// Suppress development-only console errors
if (process.env.NODE_ENV === 'development') {
  const originalError = console.error;
  console.error = (...args) => {
    // Suppress known development-only errors
    const message = args[0]?.toString() || '';
    if (
      message.includes('cca-lite.coinbase.com') ||
      message.includes('Analytics SDK') ||
      message.includes('pulse.walletconnect.org') ||
      message.includes('api.web3modal.org') ||
      message.includes('Allowlist') ||
      message.includes('ERR_NAME_NOT_RESOLVED') ||
      message.includes('ERR_BLOCKED_BY_CLIENT')
    ) {
      return; // Suppress these errors
    }
    originalError.apply(console, args);
  };
}

// Map URL paths to tab IDs
const PATH_TO_TAB: Record<string, TabId> = {
  '/': 'home',
  '/dashboard': 'dashboard',
  '/invest': 'invest',
  '/submit': 'submit',
  '/nft-marketplace': 'nft-marketplace',
  '/committee': 'committee',
  '/para-test': 'para-test',
  '/history': 'history',
};

// Map tab IDs to URL paths
const TAB_TO_PATH: Record<TabId, string> = {
  'home': '/',
  'dashboard': '/dashboard',
  'invest': '/invest',
  'submit': '/submit',
  'nft-marketplace': '/nft-marketplace',
  'committee': '/committee',
  'para-test': '/para-test',
  'history': '/history',
};

function AppContent() {
  // Get initial tab from URL
  const getInitialTab = (): TabId => {
    const currentPath = window.location.pathname;
    return PATH_TO_TAB[currentPath] || 'home';
  };

  const [activeTab, setActiveTab] = useState<TabId>(getInitialTab);

  const [showVideo, setShowVideo] = useState<boolean>(false);

  // Hooks for blockchain integration available if needed
  // const { isConnected } = useEarnX();

  // Sync tab changes with URL
  const handleTabChange = (newTab: TabId) => {
    setActiveTab(newTab);
    const newPath = TAB_TO_PATH[newTab];
    window.history.pushState({}, '', newPath);
  };

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const currentPath = window.location.pathname;
      const newTab = PATH_TO_TAB[currentPath] || 'home';
      setActiveTab(newTab);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update URL on initial load if needed
  useEffect(() => {
    const currentPath = window.location.pathname;
    const expectedPath = TAB_TO_PATH[activeTab];
    
    if (currentPath !== expectedPath) {
      window.history.replaceState({}, '', expectedPath);
    }
  }, []); // Only run on mount

  // Get real data from hooks
  // const nftStats = getNFTStats();
  // const totalVolume = nftStats.totalValue || 2450000;
  // const currentAPR = nftStats.averageAPR || 10.0;
  // const activeInvoices = nftStats.totalNFTs || 12;

  const handleVideoClose = () => setShowVideo(false);
  const handleTryDemo = () => handleTabChange('dashboard');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-blue-50/60 to-emerald-50/80 dark:from-slate-900/80 dark:via-blue-900/60 dark:to-emerald-900/80 relative overflow-hidden page-transition">
      {/* Premium Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.1),transparent)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.1),transparent)]"></div>
      
      <Navigation 
        activeTab={activeTab} 
        setActiveTab={handleTabChange}
      />

      <main className="relative max-w-7xl mx-auto px-6 pt-16">
        {/* Para Wallet Info - Show when Para mode is enabled */}
        {process.env.REACT_APP_USE_PARA_WALLET === 'true' && (
          <div className="mb-8">
            <ParaWalletInfo />
          </div>
        )}

        {activeTab === 'home' && (
          <LandingPage
            setActiveTab={handleTabChange} // Use the new handler
            setShowVideo={setShowVideo}
            totalVolume={0}
            currentAPR={0}
          />
        )}
        
        {activeTab === 'dashboard' && (
          <Dashboard 
          setActiveTab={handleTabChange}
        />
        )}
        
        {activeTab === 'invest' && (
          <InvestPage 
           
          />
        )}
        
        {activeTab === 'submit' && (
          <SubmitInvoice />
        )}

        {activeTab === 'para-test' && (
          <ParaIntegrationTest />
        )}


        {activeTab === 'nft-marketplace' && (
          <NFTInvoiceGallery />
        )}

        {activeTab === 'history' && (
          <TransactionHistory />
        )}

        
      </main>

      <VideoModal 
        isOpen={showVideo}
        onClose={handleVideoClose}
        onTryDemo={handleTryDemo}
      />

      <Footer />
    </div>
  );
}

function App() {
  // Feature flag for Para integration (can be controlled via env var)
  const useParaWallet = process.env.REACT_APP_USE_PARA_WALLET === 'true';

  console.log('🚀 EarnX App Starting...');
  console.log('🔧 Para Wallet Enabled:', useParaWallet);
  console.log('🔑 Para API Key:', process.env.REACT_APP_PARA_API_KEY?.substring(0, 10) + '...');

  if (useParaWallet) {
    console.log('✅ Using Para WalletConnect Kit');
    // Para WalletConnect Kit integration - Official Para integration
    return (
      <ParaWalletConnectKitProvider>
        <ThemeProvider>
          <TransactionNotificationManager>
            <AppContent />
          </TransactionNotificationManager>
        </ThemeProvider>
      </ParaWalletConnectKitProvider>
    );
  }

  console.log('🌈 Using RainbowKit Integration (Fallback)');
  // Existing RainbowKit integration (fallback)
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <RainbowKitProvider>
          <ThemeProvider>
            <TransactionNotificationManager>
              <AppContent />
            </TransactionNotificationManager>
          </ThemeProvider>
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}

export default App;