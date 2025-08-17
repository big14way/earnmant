// src/components/NFTInvoiceGallery.tsx - Simplified NFT Gallery
import React, { useState } from 'react';
import {
  FileText, Shield, TrendingUp, ExternalLink, Hash, Clock, DollarSign,
  Award, Users, MapPin, Calendar, Target, Zap, Eye, ShoppingCart,
  Download, Upload, CheckCircle, AlertCircle, XCircle, Loader2, X,
  Calculator, ArrowRight, Wallet
} from 'lucide-react';
import { useInvestmentOpportunities } from '../hooks/useInvestmentOpportunities';

export function NFTInvoiceGallery() {
  const {
    opportunities,
    portfolio,
    isLoading,
    error
  } = useInvestmentOpportunities();

  const [activeTab, setActiveTab] = useState<'all' | 'owned' | 'marketplace'>('all');
  const [selectedOpportunity, setSelectedOpportunity] = useState<string | null>(null);

  // Filter opportunities based on active tab
  const filteredOpportunities = opportunities.filter(opp => {
    switch (activeTab) {
      case 'owned':
        return portfolio?.investments.some(inv => inv.invoiceId === opp.invoiceId);
      case 'marketplace':
        return opp.status === 'available';
      default:
        return true;
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <Clock className="w-5 h-5 text-orange-500" />;
      case 'funding': return <Shield className="w-5 h-5 text-blue-500" />;
      case 'funded': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'completed': return <Award className="w-5 h-5 text-purple-500" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Available for Investment';
      case 'funding': return 'Currently Funding';
      case 'funded': return 'Fully Funded';
      case 'completed': return 'Completed';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'funding': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'funded': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading NFT Gallery...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoice NFT Gallery</h1>
        <p className="text-gray-600">
          Explore tokenized trade finance invoices as NFTs. Each NFT represents a real African export invoice.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total NFTs</p>
              <p className="text-2xl font-bold text-gray-900">{opportunities.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Available</p>
              <p className="text-2xl font-bold text-gray-900">
                {opportunities.filter(opp => opp.status === 'available').length}
              </p>
            </div>
            <ShoppingCart className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">My NFTs</p>
              <p className="text-2xl font-bold text-gray-900">{portfolio?.investments.length || 0}</p>
            </div>
            <Wallet className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">
                ${opportunities.reduce((sum, opp) => sum + parseFloat(opp.amount), 0).toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg">
        {[
          { key: 'all', label: 'All NFTs', icon: FileText },
          { key: 'marketplace', label: 'Marketplace', icon: ShoppingCart },
          { key: 'owned', label: 'My Collection', icon: Wallet }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-all ${
              activeTab === key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="font-medium">{label}</span>
          </button>
        ))}
      </div>

      {/* NFT Grid */}
      {filteredOpportunities.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No NFTs Found</h3>
          <p className="text-gray-600">
            {activeTab === 'owned'
              ? "You don't own any invoice NFTs yet. Start investing to build your collection!"
              : "No invoice NFTs available in this category."
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOpportunities.map((opportunity) => (
            <div
              key={opportunity.id}
              className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              {/* NFT Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-600">Invoice NFT</span>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(opportunity.status)}`}>
                    {getStatusIcon(opportunity.status)}
                    <span className="ml-1">{getStatusText(opportunity.status)}</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {opportunity.commodity} Export
                </h3>
                <p className="text-sm text-gray-600">
                  {opportunity.exporterName} → {opportunity.buyerName}
                </p>
              </div>

              {/* NFT Details */}
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Invoice Value</p>
                    <p className="text-lg font-bold text-gray-900">${parseFloat(opportunity.amount).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">APR</p>
                    <p className="text-lg font-bold text-green-600">{(opportunity.aprBasisPoints / 100).toFixed(1)}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Trade Route</p>
                    <p className="text-sm font-medium text-gray-900">
                      {opportunity.supplierCountry} → {opportunity.buyerCountry}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Risk Score</p>
                    <p className="text-sm font-medium text-gray-900">{opportunity.riskScore}/100</p>
                  </div>
                </div>

                {/* Funding Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Funding Progress</span>
                    <span>{opportunity.fundingPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(opportunity.fundingPercentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>${parseFloat(opportunity.currentFunding).toLocaleString()} raised</span>
                    <span>${parseFloat(opportunity.targetFunding).toLocaleString()} target</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedOpportunity(opportunity.id)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Eye className="w-4 h-4 inline mr-1" />
                    View Details
                  </button>
                  {opportunity.status === 'available' && (
                    <button className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      <TrendingUp className="w-4 h-4 inline mr-1" />
                      Invest
                    </button>
                  )}
                </div>

                {/* Blockchain Verification */}
                {opportunity.isBlockchainBacked && (
                  <div className="mt-3 flex items-center justify-center space-x-1 text-xs text-green-600">
                    <Shield className="w-3 h-3" />
                    <span>Blockchain Verified</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
