import { useState, useEffect } from 'react';
import { MarketData } from '@/types';

export function useMarketData() {
  const [marketData, setMarketData] = useState<MarketData>({
    ethPrice: 2516.23,
    usdcPrice: 0.9998,
    btcPrice: 45000, // Add BTC price
    mntPrice: 0.52, // Add MNT price for Mantle network
    timestamp: Date.now() / 1000,
    lastUpdate: Date.now() / 1000,
    marketRisk: 0,
    initialPricesFetched: false,
  });

  // Simulate live price updates for demo (including MNT)
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData(prev => ({
        ...prev,
        ethPrice: prev.ethPrice + (Math.random() - 0.5) * 10,
        mntPrice: Math.max(0.1, prev.mntPrice + (Math.random() - 0.5) * 0.05), // Keep MNT above $0.10
        timestamp: Date.now() / 1000,
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return marketData;
}
