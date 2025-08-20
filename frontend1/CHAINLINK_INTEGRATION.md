# EarnX Protocol - Chainlink Integration Documentation

## 🚀 Overview

The EarnX Protocol now features a comprehensive **Chainlink Oracle integration** that provides real-time price feeds for cryptocurrency assets. This integration ensures accurate, decentralized price data for our trade finance DeFi platform.

## 🔗 Supported Price Feeds

### ✅ Chainlink Oracles (Mantle Network)
- **MNT/USD**: `0xD97F20bEbeD74e8144134C4b148fE93417dd0F96` ✅ **CONFIRMED WORKING**

### 🌐 External API Fallback (CoinGecko)
When Chainlink feeds are unavailable, the system gracefully falls back to CoinGecko API:
- **ETH/USD**: Live price from CoinGecko
- **BTC/USD**: Live price from CoinGecko  
- **USDC/USD**: Live price from CoinGecko
- **LINK/USD**: Live price from CoinGecko
- **MNT/USD**: Fallback to CoinGecko if Chainlink unavailable

## 🏗️ Architecture

### Core Components

#### 1. `useChainlinkPriceFeeds` Hook
**Location**: `src/hooks/useChainlinkPriceFeeds.ts`

**Features**:
- Direct Chainlink oracle integration using wagmi/viem
- Automatic fallback to external APIs
- Real-time price updates (30-second intervals for Chainlink, 60-second for fallback)
- Error handling and stale data detection
- Feed status tracking per asset

**Key Functions**:
```typescript
const {
  marketData,      // Current price data
  isLoading,       // Loading state
  refreshPrices,   // Manual refresh function
  getPrice,        // Get specific asset price
  isFeedWorking,   // Check if specific feed is operational
  feedAddresses,   // Oracle contract addresses
} = useChainlinkPriceFeeds();
```

#### 2. Enhanced `useMarketData` Hook
**Location**: `src/hooks/useMarketData.ts`

**Features**:
- Integrates Chainlink data with enhanced market metrics
- Calculates market volatility and risk scores
- Maintains backwards compatibility
- Provides price source attribution

#### 3. `LiveMarketData` Component
**Location**: `src/components/ui/LiveMarketData.tsx`

**Features**:
- Premium UI with data source indicators
- Real-time price display for all supported assets
- Dark mode support
- Error state handling
- Source attribution (Chainlink vs External API)

#### 4. Integration Test Suite
**Location**: `src/components/test/ChainlinkIntegrationTest.tsx`

**Features**:
- Live testing of Chainlink feeds
- External API fallback validation
- Real-time status monitoring
- Detailed error reporting

## 🛠️ Implementation Details

### Chainlink Integration Flow

1. **Primary Source**: Attempts to fetch from Chainlink MNT/USD oracle
2. **Data Validation**: Checks for stale data (>1 hour old)
3. **Fallback Trigger**: Switches to external API if Chainlink fails
4. **Error Handling**: Graceful degradation with user notification
5. **Auto-Refresh**: Periodic updates maintain fresh data

### Price Feed Configuration

```typescript
// Confirmed Chainlink addresses on Mantle
const MANTLE_CHAINLINK_FEEDS = {
  MNT_USD: "0xD97F20bEbeD74e8144134C4b148fE93417dd0F96", // ✅ WORKING
  // Other feeds await deployment on Mantle network
};
```

### Network Configuration

```typescript
// Mantle Sepolia Testnet
Chain ID: 5003
RPC: https://rpc.sepolia.mantle.xyz
Explorer: https://explorer.sepolia.mantle.xyz
```

## 📊 Data Schema

### MarketData Interface
```typescript
interface ChainlinkMarketData {
  ethPrice: number;          // ETH/USD price
  btcPrice: number;          // BTC/USD price  
  usdcPrice: number;         // USDC/USD price
  linkPrice: number;         // LINK/USD price
  mntPrice: number;          // MNT/USD price
  lastUpdate: number;        // Unix timestamp
  initialPricesFetched: boolean;
  feedsWorking: {            // Per-asset feed status
    eth: boolean;
    btc: boolean;
    usdc: boolean;
    link: boolean;
    mnt: boolean;
  };
  error: string | null;
}
```

## 🎯 Usage Examples

### Basic Price Display
```tsx
import { useChainlinkPriceFeeds } from './hooks/useChainlinkPriceFeeds';

const MyComponent = () => {
  const { marketData, isLoading, error } = useChainlinkPriceFeeds();
  
  return (
    <div>
      <h3>ETH Price: ${marketData.ethPrice.toFixed(2)}</h3>
      <p>Source: {marketData.feedsWorking.eth ? 'Chainlink' : 'CoinGecko'}</p>
    </div>
  );
};
```

### Enhanced Market Data
```tsx
import { useMarketData } from './hooks/useMarketData';

const Dashboard = () => {
  const marketData = useMarketData();
  
  return (
    <div>
      <p>Volatility: {(marketData.marketVolatility * 100).toFixed(1)}%</p>
      <p>Source: {marketData.priceSourceType}</p>
    </div>
  );
};
```

### Complete Integration
```tsx
import { LiveMarketData } from './components/ui/LiveMarketData';
import { useMarketData } from './hooks/useMarketData';

const App = () => {
  const marketData = useMarketData();
  
  return (
    <LiveMarketData 
      marketData={marketData}
      loading={marketData.isLoadingPrices}
      error={marketData.chainlinkError}
    />
  );
};
```

## 🧪 Testing

### Run Integration Tests
The integration includes comprehensive testing utilities:

```typescript
import { runChainlinkIntegrationTests } from './utils/testChainlinkFeeds';

// Test all components
const results = await runChainlinkIntegrationTests();
console.log('Integration Status:', results.overallSuccess);
```

### Test Component
Use the `ChainlinkIntegrationTest` component for live testing:
- Real-time feed validation
- API fallback testing  
- Status monitoring
- Error reporting

## 🔧 Configuration

### Environment Variables
```bash
# Optional: Customize refresh intervals
REACT_APP_CHAINLINK_REFRESH_INTERVAL=30000  # 30 seconds
REACT_APP_API_REFRESH_INTERVAL=60000        # 60 seconds
```

### Network Switching
The integration automatically detects the Mantle network and configures appropriate feeds.

## 🚦 Status Indicators

### Feed Status Types
- ✅ **Live Chainlink**: Direct oracle feed working
- 🟡 **External API**: Fallback to CoinGecko working  
- ❌ **Error**: Both sources failed

### Error Handling
- **Stale Data**: Automatic detection of outdated prices
- **Network Issues**: Graceful fallback to alternative sources
- **Invalid Data**: Validation and error reporting
- **Rate Limits**: Intelligent retry mechanisms

## 🔮 Future Enhancements

### Planned Chainlink Expansions
1. **Additional Feeds**: ETH/USD, BTC/USD, USDC/USD on Mantle (pending deployment)
2. **Advanced Features**: 
   - Chainlink VRF for random number generation
   - Chainlink Keepers for automated tasks
   - Cross-chain price feeds via CCIP
3. **Enhanced Metrics**:
   - Historical price tracking
   - Volatility calculations  
   - Risk scoring algorithms

### Performance Optimizations
- WebSocket connections for real-time updates
- Local caching for improved response times
- Batch price feed requests

## 📈 Integration Benefits

### For Users
- **Accurate Pricing**: Decentralized, tamper-proof price data
- **Real-time Updates**: Fresh market data every 30-60 seconds
- **Reliable Service**: Automatic fallback ensures continuous operation
- **Transparency**: Clear indication of data sources

### For Developers  
- **Easy Integration**: Drop-in hooks and components
- **Robust Error Handling**: Graceful degradation patterns
- **Comprehensive Testing**: Built-in validation tools
- **Extensible Architecture**: Easy to add new price feeds

## 🔒 Security Considerations

- **Oracle Security**: Chainlink's decentralized network prevents single points of failure
- **Data Validation**: Multiple validation layers ensure price accuracy
- **Fallback Security**: External API validation prevents manipulation
- **Network Security**: HTTPS-only connections for all external calls

## 📞 Support

For issues related to Chainlink integration:

1. **Check Status**: Use the integration test component
2. **Review Logs**: Browser console shows detailed feed status
3. **Network Issues**: Verify Mantle network connectivity
4. **Feed Problems**: Check individual feed status in the dashboard

---

## 🎉 Conclusion

The EarnX Protocol now features a production-ready Chainlink integration that provides:

✅ **Live MNT/USD prices from Chainlink oracles**  
✅ **Comprehensive fallback system**  
✅ **Real-time updates and monitoring**  
✅ **Premium UI with source attribution**  
✅ **Robust error handling**  
✅ **Comprehensive testing suite**

This integration enhances the reliability and accuracy of our trade finance platform by providing decentralized, high-quality price data essential for DeFi operations.

---

*Last Updated: August 20, 2025*  
*Integration Version: 1.0.0*  
*Chainlink Network: Mantle Sepolia*