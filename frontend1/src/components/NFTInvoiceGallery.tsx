// src/components/NFTInvoiceGallery.tsx - Simplified NFT Gallery
import React, { useState } from 'react';
import {
  FileText, Shield, TrendingUp, ExternalLink, Hash, Clock, DollarSign,
  Award, Users, MapPin, Calendar, Target, Zap, Eye, ShoppingCart,
  Download, Upload, CheckCircle, AlertCircle, XCircle, Loader2, X,
  Calculator, ArrowRight, Wallet
} from 'lucide-react';
import { useInvestmentOpportunities } from '../hooks/useInvestmentOpportunities';
import { useEarnX } from '../hooks/useEarnX';
import { getMantleExplorerUrl } from '../utils/transactionUtils';

export function NFTInvoiceGallery() {
  const {
    opportunities,
    portfolio,
    isLoading,
    error
  } = useInvestmentOpportunities();

  const {
    investInInvoice,
    usdcBalance,
    getUSDCAllowance,
    approveUSDC,
    requestUSDCFromFaucet,
    isConnected,
    contractAddresses,
    workingUSDCAddress,
    contractsInitialized,
    isLoading: earnXLoading,
    address
  } = useEarnX();

  const [activeTab, setActiveTab] = useState<'all' | 'owned' | 'marketplace'>('all');
  const [selectedOpportunity, setSelectedOpportunity] = useState<string | null>(null);
  const [investModalOpen, setInvestModalOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<any>(null);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [investing, setInvesting] = useState(false);
  const [investmentError, setInvestmentError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<React.ReactNode | null>(null);
  const [minting, setMinting] = useState(false);

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

  // Handle getting test USDC from faucet
  const handleGetUSDC = async () => {
    if (!isConnected) return;
    
    try {
      setMinting(true);
      setInvestmentError(null);
      
      const faucetResult = await requestUSDCFromFaucet();
      
      if (faucetResult.success) {
        const explorerLink = faucetResult.txHash ? getMantleExplorerUrl(faucetResult.txHash) : null;
        setSuccessMessage(
          <>
            Successfully received 10,000 test USDC from faucet! 
            {explorerLink && (
              <a 
                href={explorerLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-2 text-green-800 underline hover:text-green-900"
              >
                View on Explorer ↗
              </a>
            )}
          </>
        );
      } else {
        setInvestmentError(faucetResult.error || 'Failed to get USDC from faucet');
      }
    } catch (error: any) {
      setInvestmentError(error.message || 'Faucet failed');
    } finally {
      setMinting(false);
    }
  };

  // Handle investment button click
  const handleInvestClick = (opportunity: any) => {
    if (!isConnected) {
      setInvestmentError('Please connect your wallet to invest');
      return;
    }

    setSelectedInvestment(opportunity);
    setInvestModalOpen(true);
    setInvestmentAmount('');
    setInvestmentError(null);
    setSuccessMessage(null);
  };

  // Handle investment execution
  const handleInvest = async () => {
    if (!selectedInvestment || !investmentAmount) {
      setInvestmentError('Please enter an investment amount');
      return;
    }

    const amount = parseFloat(investmentAmount);
    if (isNaN(amount) || amount <= 0) {
      setInvestmentError('Please enter a valid investment amount');
      return;
    }

    if (amount > usdcBalance) {
      setInvestmentError(`Insufficient balance. You have ${usdcBalance?.toFixed(2)} USDC`);
      return;
    }

    try {
      setInvesting(true);
      setInvestmentError(null);

      console.log('💰 Starting investment...', {
        opportunityId: selectedInvestment.invoiceId,
        amount: investmentAmount,
        usdcBalance
      });

      // For blockchain-backed opportunities, use real blockchain investment
      if (selectedInvestment.isBlockchainBacked && selectedInvestment.invoiceId) {
        console.log('🔗 Using blockchain investment for invoice:', selectedInvestment.invoiceId);
        
        // Step 0: Check if user has USDC tokens
        if (!usdcBalance || usdcBalance < amount) {
          setInvestmentError(`Insufficient USDC balance. You have ${(usdcBalance || 0).toFixed(2)} USDC but need ${amount} USDC. Please get test USDC first.`);
          return;
        }
        
        // Step 1: Check USDC allowance for Core Contract
        const allowance = await getUSDCAllowance(contractAddresses.PROTOCOL);
        const amountWei = amount * 1e6;
        
        console.log(`💳 USDC allowance check: ${allowance / 1e6} USDC allowed, need ${amount} USDC`);
        
        if (allowance < amountWei) {
          console.log('💳 Insufficient allowance, requesting approval...');
          setInvestmentError('Step 1/2: Approving USDC spending (may require 2 transactions)...');
          
          try {
            const approvalResult = await approveUSDC(contractAddresses.PROTOCOL, investmentAmount);
            
            if (!approvalResult.success) {
              setInvestmentError(approvalResult.error || 'Failed to approve USDC. Please try again.');
              return;
            }
            
            console.log('✅ USDC approval successful');
            setInvestmentError('Step 2/2: Processing investment...');
          } catch (approvalError: any) {
            console.error('❌ Approval failed:', approvalError);
            setInvestmentError(approvalError.message || 'Approval failed. Please try again.');
            return;
          }
        }
        
        // Step 2: Proceed with investment
        const result = await investInInvoice(selectedInvestment.invoiceId, investmentAmount);
        
        if (result.success) {
          const explorerLink = result.txHash ? getMantleExplorerUrl(result.txHash) : null;
          setSuccessMessage(
            <>
              Successfully invested {investmentAmount} USDC!
              {explorerLink && (
                <a 
                  href={explorerLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-2 text-green-800 underline hover:text-green-900"
                >
                  View on Explorer ↗
                </a>
              )}
            </>
          );
          setInvestModalOpen(false);
          setInvestmentAmount('');
          // Refresh opportunities data would happen here
        } else {
          setInvestmentError(result.error || 'Investment failed');
        }
      } else {
        // For API-only opportunities, these are not available for real investment yet
        console.log('❌ API-only opportunity not available for blockchain investment:', selectedInvestment.id);
        setInvestmentError('This opportunity is not yet available for blockchain investment. Only blockchain-verified invoices can be invested in.');
      }
      
    } catch (error: any) {
      console.error('❌ Investment error:', error);
      setInvestmentError(error.message || 'Investment failed');
    } finally {
      setInvesting(false);
    }
  };

  // Close investment modal
  const closeInvestModal = () => {
    setInvestModalOpen(false);
    setSelectedInvestment(null);
    setInvestmentAmount('');
    setInvestmentError(null);
    setSuccessMessage(null);
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoice NFT Gallery</h1>
            <p className="text-gray-600">
              Explore tokenized trade finance invoices as NFTs. Each NFT represents a real African export invoice.
            </p>
          </div>
          {isConnected && (
            <div className="flex space-x-3">
              {/* Transaction History Button */}
              <button
                onClick={() => window.location.href = '/history'}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Clock className="w-4 h-4" />
                <span>Transaction History</span>
              </button>
              
              {/* Get Test USDC Button */}
              {(!usdcBalance || usdcBalance < 100) && workingUSDCAddress && (
                <button
                  onClick={handleGetUSDC}
                  disabled={minting}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                >
                  {minting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Getting USDC...</span>
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4" />
                      <span>Get Test USDC</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Global notifications */}
        {(successMessage || investmentError) && (
          <div className="mb-4">
            {successMessage && (
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  <div>{successMessage}</div>
                </div>
                <button
                  onClick={() => setSuccessMessage(null)}
                  className="text-green-600 hover:text-green-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            {investmentError && (
              <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2 text-red-800">
                  <AlertCircle className="w-5 h-5" />
                  <span>{investmentError}</span>
                </div>
                <button
                  onClick={() => setInvestmentError(null)}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
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
              <p className="text-sm font-medium text-gray-600">Your USDC Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                {isConnected ? `${usdcBalance?.toFixed(2) || '0.00'} USDC` : 'Not Connected'}
              </p>
              {isConnected && usdcBalance && usdcBalance < 10 && (
                <p className="text-xs text-orange-600 mt-1">
                  Low balance - consider getting test USDC
                </p>
              )}
              {isConnected && !contractsInitialized && (
                <p className="text-xs text-blue-600 mt-1">
                  🔄 Initializing contracts...
                </p>
              )}
              {isConnected && contractsInitialized && !workingUSDCAddress && (
                <p className="text-xs text-red-600 mt-1">
                  ❌ No USDC contract found
                </p>
              )}
              {isConnected && workingUSDCAddress && (
                <p className="text-xs text-green-600 mt-1">
                  ✅ USDC: {workingUSDCAddress.slice(0, 6)}...{workingUSDCAddress.slice(-4)}
                </p>
              )}
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
                    <button 
                      onClick={() => handleInvestClick(opportunity)}
                      disabled={!isConnected || investing}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      <TrendingUp className="w-4 h-4 inline mr-1" />
                      {!isConnected ? 'Connect Wallet' : investing ? 'Investing...' : 'Invest'}
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

      {/* Investment Modal */}
      {investModalOpen && selectedInvestment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Invest in Invoice</h3>
              <button
                onClick={closeInvestModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold text-gray-900">{selectedInvestment.commodity} Export</h4>
              <p className="text-sm text-gray-600">
                {selectedInvestment.exporterName} → {selectedInvestment.buyerName}
              </p>
              <p className="text-sm text-gray-600">
                APR: {(selectedInvestment.aprBasisPoints / 100).toFixed(1)}%
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Investment Amount (USDC)
              </label>
              <input
                type="number"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(e.target.value)}
                placeholder="Enter amount..."
                min="1"
                max={Math.min(usdcBalance || 0, parseFloat(selectedInvestment.targetFunding) - parseFloat(selectedInvestment.currentFunding))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Available: {usdcBalance?.toFixed(2)} USDC</span>
                <span>Remaining: {(parseFloat(selectedInvestment.targetFunding) - parseFloat(selectedInvestment.currentFunding)).toFixed(2)} USDC</span>
              </div>
            </div>

            {/* Blockchain verification status */}
            <div className="mb-4">
              {selectedInvestment.isBlockchainBacked ? (
                <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                  <Shield className="w-4 h-4" />
                  <span>Blockchain-verified invoice ready for investment</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-sm text-orange-600 bg-orange-50 p-2 rounded">
                  <AlertCircle className="w-4 h-4" />
                  <span>API-only opportunity (demo mode)</span>
                </div>
              )}
            </div>

            {investmentError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{investmentError}</p>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm text-green-600">{successMessage}</div>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={closeInvestModal}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleInvest}
                disabled={investing || !investmentAmount || !isConnected}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {investing ? (
                  <>
                    <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                    Investing...
                  </>
                ) : (
                  'Confirm Investment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
