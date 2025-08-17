// components/InvestmentReadiness.tsx - Investment readiness display
import React from 'react';
import { 
  TrendingUp, Shield, Clock, DollarSign, Award, 
  AlertTriangle, CheckCircle, Info, Star 
} from 'lucide-react';
import { 
  calculateInvestmentTerms, 
  isInvestmentReady, 
  getInvestmentStatusMessage,
  calculateReturns,
  formatCurrency,
  InvoiceVerification 
} from '../utils/investmentReadiness';

interface InvestmentReadinessProps {
  verification: InvoiceVerification;
  invoiceAmount: number;
  commodity: string;
  onInvest?: (amount: number) => void;
}

export function InvestmentReadiness({ 
  verification, 
  invoiceAmount, 
  commodity,
  onInvest 
}: InvestmentReadinessProps) {
  const terms = calculateInvestmentTerms(verification, invoiceAmount);
  const status = getInvestmentStatusMessage(verification);
  const ready = isInvestmentReady(verification);
  
  // Sample investment calculation for display
  const sampleInvestment = Math.min(terms.minimumInvestment * 2, terms.maximumInvestment);
  const sampleReturns = calculateReturns(sampleInvestment, terms);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Low': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'High': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (color: string) => {
    switch (color) {
      case 'green': return 'text-green-600 bg-green-100';
      case 'yellow': return 'text-yellow-600 bg-yellow-100';
      case 'red': return 'text-red-600 bg-red-100';
      case 'blue': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">Investment Readiness</h3>
        <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status.color)}`}>
          <span className="mr-1">{status.icon}</span>
          {status.message}
        </div>
      </div>

      {/* Verification Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-sm text-gray-600">Verification Status</span>
          </div>
          <p className="text-lg font-semibold text-gray-900 mt-1">
            {verification.isVerified ? 'Verified' : 'Pending'}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center">
            <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-sm text-gray-600">Risk Score</span>
          </div>
          <p className="text-lg font-semibold text-gray-900 mt-1">
            {verification.riskScore}/100
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center">
            <Award className="h-5 w-5 text-purple-600 mr-2" />
            <span className="text-sm text-gray-600">Credit Rating</span>
          </div>
          <p className="text-lg font-semibold text-gray-900 mt-1">
            {verification.creditRating}
          </p>
        </div>
      </div>

      {/* Investment Terms (only show if ready) */}
      {ready && (
        <>
          <div className="border-t pt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Investment Terms</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Investment Limits */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Minimum Investment</span>
                  <span className="font-semibold">{formatCurrency(terms.minimumInvestment)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Maximum Investment</span>
                  <span className="font-semibold">{formatCurrency(terms.maximumInvestment)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Expected Return</span>
                  <span className="font-semibold text-green-600">{terms.expectedReturn}%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Investment Period</span>
                  <span className="font-semibold">{terms.investmentPeriod} days</span>
                </div>
              </div>

              {/* Risk & Protection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Risk Level</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(terms.riskLevel)}`}>
                    {terms.riskLevel}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Investor Protection</span>
                  <span className="font-semibold text-blue-600">{terms.investorProtection}%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Commodity</span>
                  <span className="font-semibold">{commodity}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Invoice Value</span>
                  <span className="font-semibold">{formatCurrency(invoiceAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sample Returns */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
            <h5 className="text-lg font-semibold text-gray-900 mb-4">
              Sample Investment: {formatCurrency(sampleInvestment)}
            </h5>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-sm text-gray-600">Total Return</p>
                <p className="font-semibold text-green-600">{formatCurrency(sampleReturns.totalReturn)}</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-sm text-gray-600">Net Profit</p>
                <p className="font-semibold text-blue-600">{formatCurrency(sampleReturns.netProfit)}</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Clock className="h-4 w-4 text-purple-600" />
                </div>
                <p className="text-sm text-gray-600">Daily Return</p>
                <p className="font-semibold text-purple-600">{formatCurrency(sampleReturns.dailyReturn)}</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Star className="h-4 w-4 text-yellow-600" />
                </div>
                <p className="text-sm text-gray-600">Annualized</p>
                <p className="font-semibold text-yellow-600">{sampleReturns.annualizedReturn.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          {/* Investment Button */}
          <div className="text-center">
            <button
              onClick={() => onInvest?.(sampleInvestment)}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors inline-flex items-center"
            >
              <TrendingUp className="h-5 w-5 mr-2" />
              Start Investment
            </button>
          </div>
        </>
      )}

      {/* Not Ready Message */}
      {!ready && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Investment Not Available</p>
              <p className="text-sm text-yellow-700 mt-1">
                {!verification.isVerified
                  ? "Document verification must be completed before investment is available."
                  : !verification.blockchainSubmitted
                  ? "Invoice must be submitted to blockchain before investment is available."
                  : "Risk score too high for investment recommendation."
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Verification Source */}
      <div className="text-xs text-gray-500 text-center">
        Verification powered by {verification.verificationSource === 'api-fallback' ? 'EarnX API (Fallback Mode)' : 'Blockchain Oracle'}
      </div>
    </div>
  );
}