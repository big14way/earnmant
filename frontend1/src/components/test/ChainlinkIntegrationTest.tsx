// components/test/ChainlinkIntegrationTest.tsx - Test Component for Chainlink Integration
import React, { useState, useEffect } from 'react';
import { Play, CheckCircle, XCircle, RefreshCw, Activity } from 'lucide-react';
import { useChainlinkPriceFeeds } from '../../hooks/useChainlinkPriceFeeds';
import { runChainlinkIntegrationTests } from '../../utils/testChainlinkFeeds';

interface TestResult {
  chainlink: {
    success: boolean;
    price?: number;
    error?: string;
  };
  externalAPI: {
    success: boolean;
    data?: any;
    error?: string;
  };
  overallSuccess: boolean;
}

export const ChainlinkIntegrationTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Use the actual Chainlink hooks
  const {
    marketData,
    isLoading,
    refreshPrices,
    isFeedWorking,
    isInitialized,
    error,
  } = useChainlinkPriceFeeds();

  // Auto-run tests on component mount
  useEffect(() => {
    runTests();
  }, []);

  const runTests = async () => {
    setIsRunningTests(true);
    try {
      console.log('🧪 Running Chainlink integration tests...');
      const results = await runChainlinkIntegrationTests();
      setTestResults(results);
    } catch (error) {
      console.error('Test runner failed:', error);
      setTestResults({
        chainlink: { success: false, error: 'Test runner failed' },
        externalAPI: { success: false, error: 'Test runner failed' },
        overallSuccess: false,
      });
    } finally {
      setIsRunningTests(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            Chainlink Integration Test
          </h2>
        </div>
        <button
          onClick={runTests}
          disabled={isRunningTests}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isRunningTests ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {isRunningTests ? 'Running Tests...' : 'Run Tests'}
        </button>
      </div>

      {/* Live Hook Status */}
      <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">
          Live Hook Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            {isInitialized ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <span className="text-sm">
              Initialized: {isInitialized ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isLoading ? (
              <RefreshCw className="w-5 h-5 text-orange-500 animate-spin" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
            <span className="text-sm">
              Loading: {isLoading ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {error ? (
              <XCircle className="w-5 h-5 text-red-500" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
            <span className="text-sm">
              Error: {error ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
        {error && (
          <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded">
            {error}
          </div>
        )}
      </div>

      {/* Current Market Data */}
      <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">
          Current Market Data
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-sm text-slate-600 dark:text-slate-400">ETH</div>
            <div className="text-lg font-bold">${marketData.ethPrice.toFixed(2)}</div>
            <div className={`text-xs ${isFeedWorking('eth') ? 'text-green-600' : 'text-orange-600'}`}>
              {isFeedWorking('eth') ? 'Chainlink' : 'API'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-slate-600 dark:text-slate-400">BTC</div>
            <div className="text-lg font-bold">${marketData.btcPrice.toFixed(0)}</div>
            <div className={`text-xs ${isFeedWorking('btc') ? 'text-green-600' : 'text-orange-600'}`}>
              {isFeedWorking('btc') ? 'Chainlink' : 'API'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-slate-600 dark:text-slate-400">USDC</div>
            <div className="text-lg font-bold">${marketData.usdcPrice.toFixed(4)}</div>
            <div className={`text-xs ${isFeedWorking('usdc') ? 'text-green-600' : 'text-orange-600'}`}>
              {isFeedWorking('usdc') ? 'Chainlink' : 'API'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-slate-600 dark:text-slate-400">LINK</div>
            <div className="text-lg font-bold">${marketData.linkPrice.toFixed(2)}</div>
            <div className={`text-xs ${isFeedWorking('link') ? 'text-green-600' : 'text-orange-600'}`}>
              {isFeedWorking('link') ? 'Chainlink' : 'API'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-slate-600 dark:text-slate-400">MNT</div>
            <div className="text-lg font-bold">${marketData.mntPrice.toFixed(4)}</div>
            <div className={`text-xs ${isFeedWorking('mnt') ? 'text-green-600' : 'text-orange-600'}`}>
              {isFeedWorking('mnt') ? 'Chainlink' : 'API'}
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Last Update: {new Date(marketData.lastUpdate * 1000).toLocaleTimeString()}</span>
          <button
            onClick={refreshPrices}
            className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>
      </div>

      {/* Test Results */}
      {testResults && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              Test Results
            </h3>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Chainlink Test */}
            <div className="p-4 border border-slate-200 dark:border-slate-600 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {testResults.chainlink.success ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <span className="font-medium">Chainlink Feed</span>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                MNT/USD Oracle: {testResults.chainlink.success ? 'Working' : 'Failed'}
              </div>
              {testResults.chainlink.price && (
                <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  Price: ${testResults.chainlink.price.toFixed(4)}
                </div>
              )}
            </div>

            {/* External API Test */}
            <div className="p-4 border border-slate-200 dark:border-slate-600 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {testResults.externalAPI.success ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <span className="font-medium">External API</span>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                CoinGecko: {testResults.externalAPI.success ? 'Working' : 'Failed'}
              </div>
            </div>

            {/* Overall Status */}
            <div className="p-4 border border-slate-200 dark:border-slate-600 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {testResults.overallSuccess ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <span className="font-medium">Overall Status</span>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Integration: {testResults.overallSuccess ? 'Operational' : 'Failed'}
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          {showDetails && (
            <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-lg">
              <h4 className="font-medium mb-2">Detailed Test Results</h4>
              <pre className="text-xs text-slate-600 dark:text-slate-400 overflow-x-auto">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
          Integration Status
        </h4>
        <div className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
          <p>✅ Chainlink MNT/USD feed configured for Mantle network</p>
          <p>✅ External API fallback for ETH, BTC, USDC, LINK prices</p>
          <p>✅ Real-time price updates every 60 seconds</p>
          <p>✅ Error handling and graceful degradation</p>
          <p>✅ Manual refresh capability</p>
        </div>
      </div>
    </div>
  );
};

export default ChainlinkIntegrationTest;