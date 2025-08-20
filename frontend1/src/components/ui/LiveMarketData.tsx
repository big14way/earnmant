import React from 'react';
import { Zap, Activity, AlertCircle, CheckCircle } from 'lucide-react';
import { MarketData } from '../../types';

interface LiveMarketDataProps {
  marketData: (MarketData & {
    isLoadingPrices?: boolean;
    priceSourceType?: string;
    chainlinkError?: string | null;
  }) | null;
  loading?: boolean;
  error?: string | null;
}

// Helper function to format currency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export function LiveMarketData({ marketData, loading, error }: LiveMarketDataProps) {
  const isChainlink = marketData?.priceSourceType === 'chainlink';
  const isLoading = loading || marketData?.isLoadingPrices;
  const hasError = error || marketData?.chainlinkError;

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center">
          <Zap className="mr-2 text-emerald-500" size={20} />
          Live Oracle Data
        </h3>
        <div className="flex items-center gap-3">
          {/* Data source indicator */}
          <div className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-medium ${
            isChainlink 
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
              : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
          }`}>
            {isChainlink ? (
              <>
                <CheckCircle className="w-3 h-3 mr-1" />
                Chainlink
              </>
            ) : (
              <>
                <Activity className="w-3 h-3 mr-1" />
                External API
              </>
            )}
          </div>
          
          {/* Status indicator */}
          <div className={`flex items-center text-sm font-medium ${
            hasError 
              ? 'text-red-600 dark:text-red-400' 
              : isLoading 
                ? 'text-orange-600 dark:text-orange-400'
                : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              hasError 
                ? 'bg-red-500' 
                : isLoading 
                  ? 'bg-orange-500 animate-pulse'
                  : 'bg-emerald-500 animate-pulse'
            }`}></div>
            {hasError ? 'Error' : isLoading ? 'Loading...' : 'Live'}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* ETH Price */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">ETH Price</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {marketData ? formatCurrency(marketData.ethPrice) : '$2,516.23'}
          </div>
          <div className={`text-xs mt-1 ${
            isChainlink ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'
          }`}>
            {marketData?.initialPricesFetched ? (isChainlink ? 'Live Chainlink' : 'External API') : 'Loading...'}
          </div>
        </div>

        {/* BTC Price */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">BTC Price</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {marketData ? formatCurrency(marketData.btcPrice) : '$45,000'}
          </div>
          <div className={`text-xs mt-1 ${
            isChainlink ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'
          }`}>
            {marketData?.initialPricesFetched ? (isChainlink ? 'Live Chainlink' : 'External API') : 'Loading...'}
          </div>
        </div>

        {/* USDC Price */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">USDC Price</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {marketData ? `$${marketData.usdcPrice.toFixed(4)}` : '$0.9998'}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">Stablecoin</div>
        </div>

        {/* MNT Price */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">MNT Price</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {marketData ? `$${marketData.mntPrice.toFixed(4)}` : '$0.52'}
          </div>
          <div className={`text-xs mt-1 ${
            isChainlink ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'
          }`}>
            {marketData?.initialPricesFetched ? (isChainlink ? 'Live Chainlink' : 'External API') : 'Loading...'}
          </div>
        </div>

        {/* Market Volatility */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Volatility</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {marketData ? `${(marketData.marketVolatility! * 100).toFixed(1)}%` : '15.0%'}
          </div>
          <div className={`text-xs mt-1 ${
            isChainlink ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'
          }`}>
            Real-time Calc
          </div>
        </div>
      </div>
      
      {/* Error display */}
      {hasError && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <div className="flex items-center mb-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mr-2" />
            <span className="text-sm font-medium text-red-700 dark:text-red-300">Oracle Connection Issue</span>
          </div>
          <p className="text-red-600 dark:text-red-400 text-sm">
            {error || marketData?.chainlinkError || 'Unable to fetch live price data. Using fallback data.'}
          </p>
        </div>
      )}

      {/* Additional info */}
      {marketData && (
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div>
            Last updated: {new Date(marketData.lastUpdate * 1000).toLocaleTimeString()}
          </div>
          <div className="flex items-center gap-2">
            <span>Data source:</span>
            <span className={`font-medium ${
              isChainlink ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'
            }`}>
              {isChainlink ? 'Chainlink Oracle Network' : 'CoinGecko API (Fallback)'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}