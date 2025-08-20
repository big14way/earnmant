// frontend1/src/hooks/useInvestmentOpportunities.ts
import { useState, useEffect, useCallback } from 'react';
// @ts-ignore
import { useAccount } from 'wagmi';
import { useEarnX } from './useEarnX';

export interface InvestmentOpportunity {
  id: string;
  invoiceId: string;
  supplier: string;
  buyer: string;
  amount: string; // In USDC (formatted)
  commodity: string;
  supplierCountry: string;
  buyerCountry: string;
  exporterName: string;
  buyerName: string;
  dueDate: number;
  riskScore: number;
  creditRating: string;
  aprBasisPoints: number; // APR in basis points (e.g., 1200 = 12%)
  targetFunding: string; // Amount needed for investment
  currentFunding: string; // Amount already funded
  fundingPercentage: number; // Percentage funded
  isBlockchainBacked: boolean; // Whether this is on blockchain or API-only
  txHash?: string; // Blockchain transaction hash if available
  blockNumber?: string; // Block number if available
  createdAt: number; // Timestamp
  status: 'available' | 'funding' | 'funded' | 'completed';
}

export interface InvestmentPortfolio {
  totalInvested: string;
  totalReturns: string;
  activeInvestments: number;
  completedInvestments: number;
  investments: Array<{
    id: string;
    invoiceId: string;
    amountInvested: string;
    expectedReturn: string;
    actualReturn?: string;
    status: 'active' | 'completed' | 'defaulted';
    investmentDate: number;
    maturityDate: number;
  }>;
}

export function useInvestmentOpportunities() {
  const { address } = useAccount();
  const { getInvestmentOpportunities: getBlockchainOpportunities, getInvoiceDetails } = useEarnX();
  const [opportunities, setOpportunities] = useState<InvestmentOpportunity[]>([]);
  const [portfolio, setPortfolio] = useState<InvestmentPortfolio | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate APR from risk score
  const calculateAPR = (riskScore: number): number => {
    const baseAPR = 800; // 8% in basis points
    const riskPremium = (riskScore * 1200) / 100; // Up to 12% additional based on risk
    const totalAPR = baseAPR + riskPremium;
    return Math.min(totalAPR, 2000); // Cap at 20%
  };

  // Calculate target funding (80% of invoice amount)
  const calculateTargetFunding = (amount: string): string => {
    const amountNum = parseFloat(amount);
    return (amountNum * 0.8).toFixed(2);
  };

  // Load opportunities from localStorage (API-only invoices)
  const loadAPIOpportunities = useCallback((): InvestmentOpportunity[] => {
    try {
      const storedInvoices = localStorage.getItem('demo_invoices');
      if (!storedInvoices) {
        return [];
      }

      const invoices = JSON.parse(storedInvoices);
      const apiOpportunities: InvestmentOpportunity[] = [];

      Object.values(invoices).forEach((invoice: any) => {
        console.log('🔍 Checking invoice for investment readiness:', {
          invoiceId: invoice.invoiceId || invoice.id,
          hasVerification: !!invoice.verification,
          verification: invoice.verification,
          isVerified: invoice.isVerified,
          investmentReady: invoice.investmentReady,
          riskScore: invoice.riskScore
        });

        // Check multiple possible structures for investment readiness
        let isInvestmentReady = false;
        let isValid = false;
        let riskScore = 50;
        let creditRating = 'B';

        // New structure with verification object
        if (invoice.verification) {
          isValid = invoice.verification.isValid;
          isInvestmentReady = invoice.verification.investmentReady;
          riskScore = invoice.verification.riskScore || 35;
          creditRating = invoice.verification.creditRating || 'B';
        }
        // Legacy structure with direct properties
        else if (invoice.isVerified !== undefined) {
          isValid = invoice.isVerified;
          isInvestmentReady = invoice.investmentReady || (invoice.isVerified && (invoice.riskScore || 35) < 50);
          riskScore = invoice.riskScore || 35;
          creditRating = invoice.creditRating || 'B';
        }

        console.log('📊 Processed verification:', { isValid, isInvestmentReady, riskScore, creditRating });

        // Include verified invoices that are investment ready
        if (isValid && isInvestmentReady) {
          const amount = parseFloat(invoice.amount || '0');
          const targetFunding = calculateTargetFunding(amount.toString());
          const aprBasisPoints = calculateAPR(riskScore);

          const opportunity = {
            id: `api-${invoice.invoiceId || invoice.id}`,
            invoiceId: invoice.invoiceId || invoice.id,
            supplier: invoice.supplier || address || 'Unknown',
            buyer: invoice.buyer || 'Unknown Buyer',
            amount: amount.toFixed(2),
            commodity: invoice.commodity || 'Trade Finance',
            supplierCountry: invoice.supplierCountry || 'Unknown',
            buyerCountry: invoice.buyerCountry || 'Unknown',
            exporterName: invoice.exporterName || 'Unknown Exporter',
            buyerName: invoice.buyerName || 'Unknown Buyer',
            dueDate: invoice.dueDate || Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
            riskScore: riskScore,
            creditRating: creditRating,
            aprBasisPoints,
            targetFunding,
            currentFunding: '0.00',
            fundingPercentage: 0,
            isBlockchainBacked: invoice.verification?.blockchainSubmitted || invoice.blockchainSubmitted || false,
            txHash: invoice.txHash,
            blockNumber: invoice.blockNumber,
            createdAt: invoice.createdAt || invoice.timestamp || Date.now(),
            status: 'available' as const
          };

          console.log('✅ Added investment opportunity:', opportunity);
          apiOpportunities.push(opportunity);
        } else {
          console.log('❌ Invoice not ready for investment:', {
            invoiceId: invoice.invoiceId || invoice.id,
            isValid,
            isInvestmentReady,
            reason: !isValid ? 'Not verified' : 'Not marked as investment ready'
          });
        }
      });

      return apiOpportunities;
    } catch (error) {
      console.error('Error loading API opportunities:', error);
      return [];
    }
  }, [address]);

  // Load blockchain opportunities
  const loadBlockchainOpportunities = useCallback(async (): Promise<InvestmentOpportunity[]> => {
    try {
      console.log('🔗 Loading blockchain investment opportunities...');

      // Get opportunity IDs from blockchain
      const opportunityIds = await getBlockchainOpportunities();
      console.log('📋 Found opportunity IDs:', opportunityIds);

      if (!opportunityIds || opportunityIds.length === 0) {
        console.log('📋 No blockchain opportunities found');
        return [];
      }

      const blockchainOpportunities: InvestmentOpportunity[] = [];

      // Fetch details for each opportunity
      for (const id of opportunityIds) {
        try {
          const details = await getInvoiceDetails(id.toString());
          console.log(`📋 Invoice ${id} details:`, details);

          if (details) {
            // Handle amount as either string or number  
            const detailsAmount = (details as any).amount;
            const amountValue = typeof detailsAmount === 'string' ? detailsAmount : String(detailsAmount || '0');
            const amount = parseFloat(amountValue);
            const targetFunding = calculateTargetFunding(amount.toString());
            const aprBasisPoints = calculateAPR(35); // Default risk score for blockchain invoices

            blockchainOpportunities.push({
              id: `blockchain-${id}`,
              invoiceId: id.toString(),
              supplier: (details as any).supplier || 'Unknown',
              buyer: (details as any).buyer || 'Unknown Buyer',
              amount: amount.toFixed(2),
              commodity: (details as any).commodity || 'Trade Finance',
              supplierCountry: (details as any).supplierCountry || 'Unknown',
              buyerCountry: (details as any).buyerCountry || 'Unknown',
              exporterName: (details as any).exporterName || 'Unknown Exporter',
              buyerName: (details as any).buyerName || 'Unknown Buyer',
              dueDate: (details as any).dueDate || Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
              riskScore: 35, // Default risk score
              creditRating: 'B+', // Default credit rating for blockchain invoices
              aprBasisPoints,
              targetFunding,
              currentFunding: '0.00',
              fundingPercentage: 0,
              isBlockchainBacked: true,
              txHash: undefined, // Will be populated when available
              blockNumber: undefined, // Will be populated when available
              createdAt: Date.now(), // Use current timestamp for blockchain invoices
              status: 'available' as const
            });
          }
        } catch (error) {
          console.error(`❌ Error loading details for opportunity ${id}:`, error);
        }
      }

      console.log('✅ Loaded blockchain opportunities:', blockchainOpportunities);
      return blockchainOpportunities;
    } catch (error) {
      console.error('❌ Error loading blockchain opportunities:', error);
      return [];
    }
  }, [getBlockchainOpportunities, getInvoiceDetails]);

  // Load investment opportunities
  const loadOpportunities = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load API-based opportunities (from localStorage)
      const apiOpportunities = loadAPIOpportunities();

      // Load blockchain opportunities
      const blockchainOpportunities = await loadBlockchainOpportunities();

      // Combine all opportunities
      const allOpportunities = [
        ...apiOpportunities,
        ...blockchainOpportunities
      ];

      // Sort by creation date (newest first)
      allOpportunities.sort((a, b) => b.createdAt - a.createdAt);

      setOpportunities(allOpportunities);

    } catch (error) {
      console.error('❌ Error loading opportunities:', error);
      setError(error instanceof Error ? error.message : 'Failed to load opportunities');
    } finally {
      setIsLoading(false);
    }
  }, [loadAPIOpportunities, loadBlockchainOpportunities]);

  // Load user's investment portfolio
  const loadPortfolio = useCallback(async () => {
    if (!address) return;

    try {
      console.log('📊 Loading investment portfolio...');

      // Load from localStorage for now
      const storedPortfolio = localStorage.getItem(`portfolio_${address}`);
      if (storedPortfolio) {
        const portfolio = JSON.parse(storedPortfolio);
        setPortfolio(portfolio);
        console.log('✅ Portfolio loaded:', portfolio);
      } else {
        // Initialize empty portfolio
        const emptyPortfolio: InvestmentPortfolio = {
          totalInvested: '0.00',
          totalReturns: '0.00',
          activeInvestments: 0,
          completedInvestments: 0,
          investments: []
        };
        setPortfolio(emptyPortfolio);
      }

    } catch (error) {
      console.error('❌ Error loading portfolio:', error);
    }
  }, [address]);

  // Invest in an opportunity
  const investInOpportunity = useCallback(async (
    opportunityId: string, 
    investmentAmount: string
  ): Promise<{ success: boolean; error?: string; txHash?: string }> => {
    if (!address) {
      return { success: false, error: 'Please connect your wallet' };
    }

    try {
      console.log(`💰 Investing ${investmentAmount} USDC in opportunity ${opportunityId}`);

      const opportunity = opportunities.find(op => op.id === opportunityId);
      if (!opportunity) {
        return { success: false, error: 'Opportunity not found' };
      }

      // For now, simulate investment (since blockchain is having issues)
      const investment = {
        id: `inv-${Date.now()}`,
        invoiceId: opportunity.invoiceId,
        amountInvested: investmentAmount,
        expectedReturn: (parseFloat(investmentAmount) * (1 + opportunity.aprBasisPoints / 10000)).toFixed(2),
        status: 'active' as const,
        investmentDate: Date.now(),
        maturityDate: opportunity.dueDate * 1000
      };

      // Update portfolio
      const currentPortfolio = portfolio || {
        totalInvested: '0.00',
        totalReturns: '0.00',
        activeInvestments: 0,
        completedInvestments: 0,
        investments: []
      };

      const updatedPortfolio: InvestmentPortfolio = {
        ...currentPortfolio,
        totalInvested: (parseFloat(currentPortfolio.totalInvested) + parseFloat(investmentAmount)).toFixed(2),
        activeInvestments: currentPortfolio.activeInvestments + 1,
        investments: [...currentPortfolio.investments, investment]
      };

      // Save to localStorage
      localStorage.setItem(`portfolio_${address}`, JSON.stringify(updatedPortfolio));
      setPortfolio(updatedPortfolio);

      // Update opportunity funding
      const updatedOpportunities = opportunities.map(op => {
        if (op.id === opportunityId) {
          const newCurrentFunding = (parseFloat(op.currentFunding) + parseFloat(investmentAmount)).toFixed(2);
          const newFundingPercentage = (parseFloat(newCurrentFunding) / parseFloat(op.targetFunding)) * 100;
          
          return {
            ...op,
            currentFunding: newCurrentFunding,
            fundingPercentage: Math.min(newFundingPercentage, 100),
            status: newFundingPercentage >= 100 ? 'funded' as const : 'funding' as const
          };
        }
        return op;
      });

      setOpportunities(updatedOpportunities);

      console.log('✅ Investment successful!');
      return { 
        success: true, 
        txHash: `0x${Math.random().toString(16).substr(2, 64)}` // Demo tx hash
      };

    } catch (error) {
      console.error('❌ Investment failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Investment failed' 
      };
    }
  }, [address, opportunities, portfolio]);

  // Load data on mount and when address changes
  useEffect(() => {
    loadOpportunities();
    loadPortfolio();
  }, [loadOpportunities, loadPortfolio]);

  return {
    opportunities,
    portfolio,
    isLoading,
    error,
    loadOpportunities,
    loadPortfolio,
    investInOpportunity
  };
}
