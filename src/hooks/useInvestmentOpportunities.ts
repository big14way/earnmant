// frontend1/src/hooks/useInvestmentOpportunities.ts
import { useState, useEffect, useCallback } from 'react';
// @ts-ignore
import { useAccount } from 'wagmi';

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
        // Only include verified invoices that are investment ready
        if (invoice.verification?.isValid && invoice.verification?.investmentReady) {
          const amount = parseFloat(invoice.amount || '0');
          const targetFunding = calculateTargetFunding(amount.toString());
          const aprBasisPoints = calculateAPR(invoice.verification.riskScore || 35);

          apiOpportunities.push({
            id: `api-${invoice.invoiceId}`,
            invoiceId: invoice.invoiceId,
            supplier: invoice.supplier || address || 'Unknown',
            buyer: invoice.buyer || 'Unknown Buyer',
            amount: amount.toFixed(2),
            commodity: invoice.commodity || 'Unknown',
            supplierCountry: invoice.supplierCountry || 'Unknown',
            buyerCountry: invoice.buyerCountry || 'Unknown',
            exporterName: invoice.exporterName || 'Unknown Exporter',
            buyerName: invoice.buyerName || 'Unknown Buyer',
            dueDate: invoice.dueDate || Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
            riskScore: invoice.verification.riskScore || 35,
            creditRating: invoice.verification.creditRating || 'B',
            aprBasisPoints,
            targetFunding,
            currentFunding: '0.00',
            fundingPercentage: 0,
            isBlockchainBacked: invoice.verification?.blockchainSubmitted || false,
            txHash: invoice.txHash,
            blockNumber: invoice.blockNumber,
            createdAt: invoice.createdAt || Date.now(),
            status: 'available'
          });
        }
      });

      return apiOpportunities;
    } catch (error) {
      console.error('Error loading API opportunities:', error);
      return [];
    }
  }, [address]);

  // Load investment opportunities
  const loadOpportunities = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load API-based opportunities (from localStorage)
      const apiOpportunities = loadAPIOpportunities();

      // TODO: Load blockchain opportunities when network is stable
      // const blockchainOpportunities = await loadBlockchainOpportunities();

      // Combine all opportunities
      const allOpportunities = [
        ...apiOpportunities,
        // ...blockchainOpportunities
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
  }, [loadAPIOpportunities]);

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
