// utils/investmentReadiness.ts - Investment readiness logic
export interface InvoiceVerification {
  isVerified: boolean;
  riskScore: number;
  creditRating: string;
  investmentReady: boolean;
  verificationSource: string;
  blockchainSubmitted?: boolean;
  txHash?: string;
  blockNumber?: string;
}

export interface InvestmentTerms {
  minimumInvestment: number;
  maximumInvestment: number;
  expectedReturn: number;
  investmentPeriod: number; // days
  riskLevel: 'Low' | 'Medium' | 'High';
  investorProtection: number; // percentage
}

/**
 * Calculate investment terms based on verification data
 */
export function calculateInvestmentTerms(verification: InvoiceVerification, invoiceAmount: number): InvestmentTerms {
  const { riskScore, creditRating } = verification;
  
  let expectedReturn = 8; // Base return 8%
  let riskLevel: 'Low' | 'Medium' | 'High' = 'Medium';
  let investorProtection = 80; // Base 80% protection
  
  // Adjust based on credit rating
  switch (creditRating) {
    case 'A':
      expectedReturn = 6;
      riskLevel = 'Low';
      investorProtection = 95;
      break;
    case 'B':
      expectedReturn = 8;
      riskLevel = 'Medium';
      investorProtection = 85;
      break;
    case 'C':
      expectedReturn = 12;
      riskLevel = 'High';
      investorProtection = 70;
      break;
    default:
      expectedReturn = 10;
      riskLevel = 'Medium';
      investorProtection = 75;
  }
  
  // Adjust based on risk score
  if (riskScore < 30) {
    expectedReturn -= 1;
    investorProtection += 5;
  } else if (riskScore > 60) {
    expectedReturn += 2;
    investorProtection -= 10;
  }
  
  // Calculate investment limits (10-80% of invoice amount)
  const minimumInvestment = Math.max(100, invoiceAmount * 0.1);
  const maximumInvestment = invoiceAmount * 0.8;
  
  // Standard investment period for trade finance (30-90 days)
  const investmentPeriod = riskScore < 40 ? 30 : riskScore < 60 ? 60 : 90;
  
  return {
    minimumInvestment: Math.round(minimumInvestment),
    maximumInvestment: Math.round(maximumInvestment),
    expectedReturn: Math.round(expectedReturn * 100) / 100,
    investmentPeriod,
    riskLevel,
    investorProtection: Math.max(50, Math.min(95, investorProtection))
  };
}

/**
 * Check if invoice is ready for investment
 */
export function isInvestmentReady(verification: InvoiceVerification): boolean {
  return verification.isVerified &&
         verification.riskScore < 75 &&
         ['A', 'B', 'C'].includes(verification.creditRating) &&
         verification.blockchainSubmitted === true; // Must be on blockchain for investment
}

/**
 * Get investment readiness status message
 */
export function getInvestmentStatusMessage(verification: InvoiceVerification): {
  message: string;
  color: string;
  icon: string;
} {
  if (!verification.isVerified) {
    return {
      message: 'Document verification in progress',
      color: 'yellow',
      icon: '🔄'
    };
  }

  if (!verification.blockchainSubmitted) {
    return {
      message: 'Not submitted to blockchain - Investment unavailable',
      color: 'orange',
      icon: '🔗'
    };
  }

  if (verification.riskScore >= 75) {
    return {
      message: 'High risk - Investment not recommended',
      color: 'red',
      icon: '⚠️'
    };
  }

  if (isInvestmentReady(verification)) {
    return {
      message: `Ready for investment (${verification.creditRating} rating)`,
      color: 'green',
      icon: '✅'
    };
  }

  return {
    message: 'Under review',
    color: 'blue',
    icon: '🔍'
  };
}

/**
 * Format currency values
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Calculate potential returns for investor
 */
export function calculateReturns(
  investmentAmount: number, 
  terms: InvestmentTerms
): {
  totalReturn: number;
  netProfit: number;
  dailyReturn: number;
  annualizedReturn: number;
} {
  const totalReturn = investmentAmount * (1 + terms.expectedReturn / 100);
  const netProfit = totalReturn - investmentAmount;
  const dailyReturn = netProfit / terms.investmentPeriod;
  const annualizedReturn = (terms.expectedReturn / terms.investmentPeriod) * 365;
  
  return {
    totalReturn: Math.round(totalReturn * 100) / 100,
    netProfit: Math.round(netProfit * 100) / 100,
    dailyReturn: Math.round(dailyReturn * 100) / 100,
    annualizedReturn: Math.round(annualizedReturn * 100) / 100
  };
}