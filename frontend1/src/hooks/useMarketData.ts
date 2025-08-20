// hooks/useMarketData.ts - Enhanced with Chainlink Live Price Feeds
import { useState, useEffect } from 'react';
import { MarketData } from '../types';
import { useChainlinkPriceFeeds } from './useChainlinkPriceFeeds';

export function useMarketData() {
  const {
    marketData: chainlinkData,
    isLoading: chainlinkLoading,
    isInitialized: chainlinkInitialized,
    error: chainlinkError
  } = useChainlinkPriceFeeds();

  const [marketData, setMarketData] = useState<MarketData>({
    ethPrice: 2516.23,
    usdcPrice: 0.9998,
    btcPrice: 45000,
    linkPrice: 14.25,
    mntPrice: 0.52,
    timestamp: Date.now() / 1000,
    lastUpdate: Date.now() / 1000,
    marketRisk: 25, // Risk in basis points
    marketVolatility: 0.15, // 15% volatility
    initialPricesFetched: false,
  });

  // Update market data when Chainlink data is available
  useEffect(() => {
    if (chainlinkInitialized && chainlinkData) {
      console.log('📊 Updating market data with Chainlink prices:', chainlinkData);
      
      setMarketData(prev => ({
        ...prev,
        ethPrice: chainlinkData.ethPrice || prev.ethPrice,
        btcPrice: chainlinkData.btcPrice || prev.btcPrice,
        usdcPrice: chainlinkData.usdcPrice || prev.usdcPrice,
        linkPrice: chainlinkData.linkPrice || prev.linkPrice,
        mntPrice: chainlinkData.mntPrice || prev.mntPrice,
        lastUpdate: chainlinkData.lastUpdate || prev.lastUpdate,
        timestamp: Date.now() / 1000,
        initialPricesFetched: true,
        // Calculate market volatility based on price changes
        marketVolatility: Math.abs(
          (chainlinkData.ethPrice - prev.ethPrice) / prev.ethPrice
        ) * 2 || prev.marketVolatility,
        // Risk calculation based on volatility
        marketRisk: Math.min(100, Math.max(10, 
          (Math.abs((chainlinkData.ethPrice - prev.ethPrice) / prev.ethPrice) * 10000) || 25
        )),
      }));
    }
  }, [chainlinkData, chainlinkInitialized]);

  // Fallback simulation for demo purposes when Chainlink data isn't available
  useEffect(() => {
    if (!chainlinkInitialized || chainlinkError) {
      console.log('📈 Using simulated price updates (Chainlink not available)');
      
      const interval = setInterval(() => {
        setMarketData(prev => ({
          ...prev,
          ethPrice: Math.max(1000, prev.ethPrice + (Math.random() - 0.5) * 20),
          btcPrice: Math.max(20000, prev.btcPrice + (Math.random() - 0.5) * 500),
          mntPrice: Math.max(0.1, prev.mntPrice + (Math.random() - 0.5) * 0.05),
          linkPrice: Math.max(5, prev.linkPrice! + (Math.random() - 0.5) * 0.5),
          timestamp: Date.now() / 1000,
          marketVolatility: 0.10 + Math.random() * 0.10, // 10-20% volatility
          marketRisk: 15 + Math.random() * 20, // 15-35 bps risk
        }));
      }, 5000); // Update every 5 seconds for demo

      return () => clearInterval(interval);
    }
  }, [chainlinkInitialized, chainlinkError]);

  return {
    ...marketData,
    // Additional metadata
    isLoadingPrices: chainlinkLoading,
    priceSourceType: chainlinkInitialized ? 'chainlink' : 'simulated',
    chainlinkError,
  };
}
