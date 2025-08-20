// hooks/useChainlinkPriceFeeds.ts - Live Chainlink Price Feed Integration
import { useState, useEffect, useCallback } from 'react';
// @ts-ignore - wagmi v2 type definitions issue
import { usePublicClient, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';

// Chainlink AggregatorV3Interface ABI
const AGGREGATOR_V3_INTERFACE_ABI = [
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "description",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint80", name: "_roundId", type: "uint80" }],
    name: "getRoundData",
    outputs: [
      { internalType: "uint80", name: "roundId", type: "uint80" },
      { internalType: "int256", name: "answer", type: "int256" },
      { internalType: "uint256", name: "startedAt", type: "uint256" },
      { internalType: "uint256", name: "updatedAt", type: "uint256" },
      { internalType: "uint80", name: "answeredInRound", type: "uint80" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "latestRoundData",
    outputs: [
      { internalType: "uint80", name: "roundId", type: "uint80" },
      { internalType: "int256", name: "answer", type: "int256" },
      { internalType: "uint256", name: "startedAt", type: "uint256" },
      { internalType: "uint256", name: "updatedAt", type: "uint256" },
      { internalType: "uint80", name: "answeredInRound", type: "uint80" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "version",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// ===== MANTLE NETWORK CHAINLINK PRICE FEED ADDRESSES =====
// These are the confirmed Chainlink price feed addresses for Mantle Network
const MANTLE_CHAINLINK_FEEDS = {
  // Confirmed MNT/USD feed on Mantle Mainnet
  MNT_USD: "0xD97F20bEbeD74e8144134C4b148fE93417dd0F96" as const,
  
  // For testnet, we'll use placeholder addresses that may be deployed
  // These will gracefully fail and fall back to simulated data if not available
  ETH_USD: "0x0000000000000000000000000000000000000000" as const, // Placeholder - needs real address
  BTC_USD: "0x0000000000000000000000000000000000000000" as const, // Placeholder - needs real address  
  USDC_USD: "0x0000000000000000000000000000000000000000" as const, // Placeholder - needs real address
  LINK_USD: "0x0000000000000000000000000000000000000000" as const, // Placeholder - needs real address
} as const;

// ===== ETHEREUM MAINNET ADDRESSES FOR REFERENCE =====
// These work on Ethereum but not on Mantle - included for educational purposes
const ETHEREUM_CHAINLINK_FEEDS = {
  ETH_USD: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419" as const,
  BTC_USD: "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c" as const,
  USDC_USD: "0x8fFfFf4826438FF456967eBaD4f5bC3B5E18f6" as const,
  LINK_USD: "0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c" as const,
} as const;

export interface PriceFeedData {
  price: number;
  decimals: number;
  description: string;
  roundId: string;
  updatedAt: number;
  isStale: boolean;
  isValid: boolean;
}

export interface ChainlinkMarketData {
  ethPrice: number;
  btcPrice: number;
  usdcPrice: number;
  linkPrice: number;
  mntPrice: number;
  lastUpdate: number;
  initialPricesFetched: boolean;
  feedsWorking: {
    eth: boolean;
    btc: boolean;
    usdc: boolean;
    link: boolean;
    mnt: boolean;
  };
  error: string | null;
}

export const useChainlinkPriceFeeds = () => {
  const publicClient = usePublicClient();
  const [marketData, setMarketData] = useState<ChainlinkMarketData>({
    ethPrice: 0,
    btcPrice: 0,
    usdcPrice: 1.0,
    linkPrice: 0,
    mntPrice: 0,
    lastUpdate: 0,
    initialPricesFetched: false,
    feedsWorking: {
      eth: false,
      btc: false,
      usdc: false,
      link: false,
      mnt: false,
    },
    error: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Read MNT/USD price feed (this is the confirmed working feed)
  const { 
    data: mntPriceData, 
    error: mntError,
    refetch: refetchMnt 
  } = useReadContract({
    address: MANTLE_CHAINLINK_FEEDS.MNT_USD,
    abi: AGGREGATOR_V3_INTERFACE_ABI,
    functionName: 'latestRoundData',
    query: { 
      enabled: !!publicClient,
      refetchInterval: 30000, // Refresh every 30 seconds
    },
  });

  // Helper function to parse Chainlink price data
  const parsePriceFeedData = useCallback((
    data: any, 
    expectedDecimals: number = 8
  ): PriceFeedData | null => {
    if (!data || !Array.isArray(data) || data.length < 5) {
      return null;
    }

    const [roundId, answer, startedAt, updatedAt, answeredInRound] = data;
    
    // Check if data is valid
    if (!answer || answer <= 0) {
      return null;
    }

    // Check if data is stale (older than 1 hour)
    const now = Math.floor(Date.now() / 1000);
    const isStale = now - Number(updatedAt) > 3600;

    const price = Number(formatUnits(answer, expectedDecimals));

    return {
      price,
      decimals: expectedDecimals,
      description: 'Chainlink Price Feed',
      roundId: roundId.toString(),
      updatedAt: Number(updatedAt),
      isStale,
      isValid: !isStale && price > 0,
    };
  }, []);

  // Fetch external API prices as fallback for feeds not available on Mantle
  const fetchExternalPrices = useCallback(async () => {
    try {
      console.log('🌐 Fetching external price data as fallback...');
      
      // Using a free API for crypto prices
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin,usd-coin,chainlink,mantle&vs_currencies=usd&include_last_updated_at=true'
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        ethPrice: data.ethereum?.usd || 0,
        btcPrice: data.bitcoin?.usd || 0,
        usdcPrice: data['usd-coin']?.usd || 1.0,
        linkPrice: data.chainlink?.usd || 0,
        mntPrice: data.mantle?.usd || 0,
        lastUpdate: Math.floor(Date.now() / 1000),
      };
    } catch (error) {
      console.error('❌ Failed to fetch external prices:', error);
      return null;
    }
  }, []);

  // Main function to update market data
  const updateMarketData = useCallback(async () => {
    setIsLoading(true);
    
    try {
      console.log('📊 Updating Chainlink market data...');
      
      // Parse MNT price from Chainlink (this should work)
      let mntPrice = 0;
      let mntWorking = false;
      
      if (mntPriceData && !mntError) {
        const mntParsed = parsePriceFeedData(mntPriceData, 8);
        if (mntParsed && mntParsed.isValid) {
          mntPrice = mntParsed.price;
          mntWorking = true;
          console.log('✅ MNT/USD Chainlink feed working:', mntPrice);
        }
      }

      // For other prices, use external API as fallback
      const externalPrices = await fetchExternalPrices();
      
      if (externalPrices) {
        setMarketData(prev => ({
          ...prev,
          ethPrice: externalPrices.ethPrice,
          btcPrice: externalPrices.btcPrice,
          usdcPrice: externalPrices.usdcPrice,
          linkPrice: externalPrices.linkPrice,
          mntPrice: mntWorking ? mntPrice : externalPrices.mntPrice,
          lastUpdate: externalPrices.lastUpdate,
          initialPricesFetched: true,
          feedsWorking: {
            eth: false, // Using external API
            btc: false, // Using external API
            usdc: false, // Using external API
            link: false, // Using external API
            mnt: mntWorking, // True if Chainlink MNT feed works
          },
          error: null,
        }));
        
        console.log('✅ Market data updated successfully', {
          chainlinkMNT: mntWorking,
          externalAPI: true,
        });
      } else {
        throw new Error('Failed to fetch any price data');
      }
      
    } catch (error) {
      console.error('❌ Failed to update market data:', error);
      setMarketData(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    } finally {
      setIsLoading(false);
    }
  }, [mntPriceData, mntError, parsePriceFeedData, fetchExternalPrices]);

  // Initialize and set up auto-refresh
  useEffect(() => {
    if (publicClient) {
      console.log('🚀 Initializing Chainlink price feeds...');
      updateMarketData();
      
      // Set up auto-refresh every 60 seconds
      const interval = setInterval(() => {
        console.log('🔄 Auto-refreshing price feeds...');
        updateMarketData();
      }, 60000);
      
      setRefreshInterval(interval);
      
      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    }
  }, [publicClient, updateMarketData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);

  // Manual refresh function
  const refreshPrices = useCallback(async () => {
    console.log('🔄 Manual refresh triggered');
    await refetchMnt(); // Refresh Chainlink data
    await updateMarketData(); // Update all data
  }, [refetchMnt, updateMarketData]);

  // Get specific price with validation
  const getPrice = useCallback((asset: keyof ChainlinkMarketData['feedsWorking']): number => {
    const priceMap = {
      eth: marketData.ethPrice,
      btc: marketData.btcPrice,
      usdc: marketData.usdcPrice,
      link: marketData.linkPrice,
      mnt: marketData.mntPrice,
    };
    
    return priceMap[asset] || 0;
  }, [marketData]);

  // Check if a specific feed is working
  const isFeedWorking = useCallback((asset: keyof ChainlinkMarketData['feedsWorking']): boolean => {
    return marketData.feedsWorking[asset];
  }, [marketData.feedsWorking]);

  return {
    // Market data
    marketData,
    
    // Loading states
    isLoading,
    
    // Actions
    refreshPrices,
    
    // Utilities
    getPrice,
    isFeedWorking,
    
    // Feed addresses for reference
    feedAddresses: MANTLE_CHAINLINK_FEEDS,
    
    // Status info
    isInitialized: marketData.initialPricesFetched,
    lastUpdate: marketData.lastUpdate,
    error: marketData.error,
  };
};

export default useChainlinkPriceFeeds;