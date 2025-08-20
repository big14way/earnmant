// utils/testChainlinkFeeds.ts - Test Chainlink Price Feed Integration
import { createPublicClient, http, formatUnits } from 'viem';

// Mantle Sepolia configuration
const mantleSepoliaClient = createPublicClient({
  chain: {
    id: 5003,
    name: 'Mantle Sepolia',
    network: 'mantle-sepolia',
    nativeCurrency: {
      decimals: 18,
      name: 'MNT',
      symbol: 'MNT',
    },
    rpcUrls: {
      default: { http: ['https://rpc.sepolia.mantle.xyz'] },
      public: { http: ['https://rpc.sepolia.mantle.xyz'] },
    },
    blockExplorers: {
      default: { name: 'Mantle Explorer', url: 'https://explorer.sepolia.mantle.xyz' },
    },
  },
  transport: http(),
});

// Chainlink AggregatorV3Interface ABI (minimal)
const aggregatorV3InterfaceABI = [
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
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  }
] as const;

// Test MNT/USD feed on Mantle network
export const testMNTUSDFeed = async () => {
  const MNT_USD_FEED = "0xD97F20bEbeD74e8144134C4b148fE93417dd0F96";
  
  try {
    console.log('🧪 Testing MNT/USD Chainlink feed...');
    console.log('📍 Feed Address:', MNT_USD_FEED);
    console.log('🌐 Network: Mantle Sepolia');
    
    // Test 1: Get latest round data
    const latestRoundData = await mantleSepoliaClient.readContract({
      address: MNT_USD_FEED as `0x${string}`,
      abi: aggregatorV3InterfaceABI,
      functionName: 'latestRoundData',
    });
    
    console.log('📊 Latest Round Data:', latestRoundData);
    
    // Test 2: Get decimals
    const decimals = await mantleSepoliaClient.readContract({
      address: MNT_USD_FEED as `0x${string}`,
      abi: aggregatorV3InterfaceABI,
      functionName: 'decimals',
    });
    
    console.log('🔢 Decimals:', decimals);
    
    // Parse the data
    if (latestRoundData && Array.isArray(latestRoundData) && latestRoundData.length >= 5) {
      const [roundId, answer, startedAt, updatedAt, answeredInRound] = latestRoundData;
      
      const price = Number(formatUnits(answer, Number(decimals)));
      const updateTime = new Date(Number(updatedAt) * 1000);
      
      console.log('✅ MNT/USD Price Feed Test Results:');
      console.log('   💰 Current Price:', `$${price.toFixed(4)}`);
      console.log('   🕐 Last Updated:', updateTime.toLocaleString());
      console.log('   🔄 Round ID:', roundId.toString());
      console.log('   ⏱️  Data Age:', `${Math.floor((Date.now() - updateTime.getTime()) / 1000)} seconds`);
      
      return {
        success: true,
        price,
        updatedAt: updateTime,
        roundId: roundId.toString(),
        isStale: Date.now() - updateTime.getTime() > 3600000, // 1 hour
      };
    }
    
    throw new Error('Invalid response format');
    
  } catch (error) {
    console.error('❌ MNT/USD Feed Test Failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Test external API fallback
export const testExternalAPIFallback = async () => {
  try {
    console.log('🌐 Testing external API fallback...');
    
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin,usd-coin,chainlink,mantle&vs_currencies=usd&include_last_updated_at=true'
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('✅ External API Test Results:');
    console.log('   💰 ETH Price:', `$${data.ethereum?.usd || 'N/A'}`);
    console.log('   💰 BTC Price:', `$${data.bitcoin?.usd || 'N/A'}`);
    console.log('   💰 USDC Price:', `$${data['usd-coin']?.usd || 'N/A'}`);
    console.log('   💰 LINK Price:', `$${data.chainlink?.usd || 'N/A'}`);
    console.log('   💰 MNT Price:', `$${data.mantle?.usd || 'N/A'}`);
    
    return {
      success: true,
      data: {
        ethPrice: data.ethereum?.usd || 0,
        btcPrice: data.bitcoin?.usd || 0,
        usdcPrice: data['usd-coin']?.usd || 1.0,
        linkPrice: data.chainlink?.usd || 0,
        mntPrice: data.mantle?.usd || 0,
      },
    };
    
  } catch (error) {
    console.error('❌ External API Test Failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Comprehensive test function
export const runChainlinkIntegrationTests = async () => {
  console.log('🚀 Starting Chainlink Integration Tests...\n');
  
  // Test 1: MNT/USD Chainlink feed
  const chainlinkTest = await testMNTUSDFeed();
  
  // Test 2: External API fallback
  const apiTest = await testExternalAPIFallback();
  
  // Summary
  console.log('\n📋 Test Summary:');
  console.log('   🔗 Chainlink MNT/USD Feed:', chainlinkTest.success ? '✅ PASS' : '❌ FAIL');
  console.log('   🌐 External API Fallback:', apiTest.success ? '✅ PASS' : '❌ FAIL');
  
  const overallSuccess = chainlinkTest.success || apiTest.success;
  console.log('   🎯 Overall Integration:', overallSuccess ? '✅ WORKING' : '❌ FAILED');
  
  if (chainlinkTest.success && apiTest.success) {
    console.log('\n✅ All systems operational! Your Chainlink integration is ready for production.');
  } else if (overallSuccess) {
    console.log('\n⚠️ Partial success - fallback systems are working.');
  } else {
    console.log('\n❌ Integration tests failed. Please check network connectivity and contract addresses.');
  }
  
  return {
    chainlink: chainlinkTest,
    externalAPI: apiTest,
    overallSuccess,
  };
};

export default runChainlinkIntegrationTests;