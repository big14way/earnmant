// frontend1/src/components/ui/InvestmentModal.tsx
import React, { useState } from 'react';
import { X, DollarSign, AlertCircle, TrendingUp, Calendar, MapPin } from 'lucide-react';

interface InvestmentOpportunity {
  id: number;
  commodity: string;
  supplier: string;
  buyer: string;
  supplierCountry: string;
  buyerCountry: string;
  exporterName: string;
  buyerName: string;
  totalAmount: number;
  targetFunding: number;
  currentFunding: number;
  remainingFunding: number;
  apr: number;
  creditRating: string;
  riskScore: number;
  daysToMaturity: number;
  minInvestment: number;
  maxInvestment: number;
  fundingProgress: number;
  formatted: {
    totalAmount: string;
    targetFunding: string;
    currentFunding: string;
    remainingFunding: string;
    apr: string;
    fundingProgress: string;
    tradeRoute: string;
    dueDate: string;
  };
}

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: InvestmentOpportunity | null;
  onInvest: (amount: string) => Promise<void>;
  isProcessing: boolean;
  userBalance?: number;
}

export function InvestmentModal({ 
  isOpen, 
  onClose, 
  opportunity, 
  onInvest, 
  isProcessing,
  userBalance = 0 
}: InvestmentModalProps) {
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !opportunity) return null;

  const handleAmountChange = (value: string) => {
    setInvestmentAmount(value);
    setError('');

    const amount = parseFloat(value);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amount < opportunity.minInvestment) {
      setError(`Minimum investment is $${opportunity.minInvestment.toLocaleString()}`);
      return;
    }

    if (amount > opportunity.maxInvestment) {
      setError(`Maximum investment is $${opportunity.maxInvestment.toLocaleString()}`);
      return;
    }

    if (amount > userBalance) {
      setError(`Insufficient balance. You have $${userBalance.toLocaleString()}`);
      return;
    }

    if (amount > opportunity.remainingFunding) {
      setError(`Only $${opportunity.remainingFunding.toLocaleString()} needed to fully fund this opportunity`);
      return;
    }
  };

  const handleInvest = async () => {
    if (error || !investmentAmount) return;
    
    try {
      await onInvest(investmentAmount);
      setInvestmentAmount('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Investment failed');
    }
  };

  const expectedReturn = parseFloat(investmentAmount || '0') * (1 + opportunity.apr / 100);
  const potentialProfit = expectedReturn - parseFloat(investmentAmount || '0');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Investment Opportunity</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Opportunity Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{opportunity.commodity} Trade</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                opportunity.riskScore < 30 ? 'bg-green-100 text-green-800' :
                opportunity.riskScore < 60 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {opportunity.creditRating} Rating
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span>{opportunity.formatted.tradeRoute}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>{opportunity.daysToMaturity} days</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-gray-500" />
                <span>{opportunity.formatted.apr} APR</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <span>{opportunity.formatted.remainingFunding} needed</span>
              </div>
            </div>

            {/* Funding Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Funding Progress</span>
                <span>{opportunity.formatted.fundingProgress}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(opportunity.fundingProgress, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{opportunity.formatted.currentFunding} funded</span>
                <span>{opportunity.formatted.targetFunding} target</span>
              </div>
            </div>
          </div>

          {/* Investment Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Investment Amount (USDC)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={investmentAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min={opportunity.minInvestment}
                  max={Math.min(opportunity.maxInvestment, userBalance, opportunity.remainingFunding)}
                />
              </div>
              
              {error && (
                <div className="flex items-center space-x-2 mt-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Min: ${opportunity.minInvestment.toLocaleString()}</span>
                <span>Max: ${Math.min(opportunity.maxInvestment, userBalance, opportunity.remainingFunding).toLocaleString()}</span>
              </div>
            </div>

            {/* Investment Summary */}
            {investmentAmount && !error && (
              <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-blue-900">Investment Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Investment:</span>
                    <span className="font-medium ml-2">${parseFloat(investmentAmount).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Expected Return:</span>
                    <span className="font-medium ml-2">${expectedReturn.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Potential Profit:</span>
                    <span className="font-medium ml-2 text-green-600">+${potentialProfit.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Maturity Date:</span>
                    <span className="font-medium ml-2">{opportunity.formatted.dueDate}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleInvest}
              disabled={!!error || !investmentAmount || isProcessing}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              <DollarSign className="w-5 h-5" />
              <span>{isProcessing ? 'Processing...' : 'Invest Now'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
