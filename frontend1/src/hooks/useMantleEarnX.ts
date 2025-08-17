// hooks/useMantleEarnX.ts - Mantle Network EarnX Protocol Integration
import { useState, useCallback } from 'react';
// @ts-ignore
import { useAccount, useWriteContract, useReadContract, usePublicClient, useWalletClient } from 'wagmi';
import { parseUnits, formatUnits, Address } from 'viem';

// Import ABIs from generated files
import MantleEarnXProtocol from '../abis/MantleEarnXProtocol.json';
import MantleEarnXVerificationModule from '../abis/MantleEarnXVerificationModule.json';
import MantleUSDC from '../abis/MantleUSDC.json';
import MantlePriceManager from '../abis/MantlePriceManager.json';
import EarnXInvestmentModule from '../abis/EarnXInvestmentModule.json';
import EarnXInvoiceNFT from '../abis/EarnXInvoiceNFT.json';

// Contract addresses from fixed deployment
const CONTRACT_ADDRESSES = {
  PROTOCOL: "0xec40a9Bb73A17A9b2571A8F89D404557b6E9866A" as const,
  USDC: "0x211a38792781b2c7a584a96F0e735d56e809fe85" as const,
  VERIFICATION_MODULE: "0xDFe9b0627e0ec2b653FaDe125421cc32575631FC" as const,
  PRICE_MANAGER: "0x789f82778A8d9eB6514a457112a563A89F79A2f1" as const,
  INVESTMENT_MODULE: "0x199516b47F1ce8C77617b58526ad701bF1f750FA" as const,
  INVOICE_NFT: "0x4f330C74c7bd84665722bA0664705e2f2E6080DC" as const,
} as const;

// Types
interface InvoiceDetails {
  id: number;
  supplier: string;
  buyer: string;
  amount: number;
  commodity: string;
  supplierCountry: string;
  buyerCountry: string;
  exporterName: string;
  buyerName: string;
  dueDate: number;
  aprBasisPoints: number;
  status: number;
  createdAt: number;
  documentVerified: boolean;
  targetFunding: number;
  currentFunding: number;
}

interface InvestmentOpportunity extends InvoiceDetails {
  remainingFunding: number;
  fundingProgress: number;
  apr: number;
  riskScore: number;
  creditRating: string;
  isAvailable: boolean;
}

interface ProtocolStats {
  totalInvoices: number;
  totalFundsRaised: number;
  pendingInvoices: number;
  verifiedInvoices: number;
  fundedInvoices: number;
  repaidInvoices: number;
}

export const useMantleEarnX = () => {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Contract writes
  const { writeContractAsync: writeProtocol } = useWriteContract();
  const { writeContractAsync: writeUSDC } = useWriteContract();
  const { writeContractAsync: writeVerification } = useWriteContract();

  // ============ READ CONTRACT DATA ============
  
  // Get protocol stats
  const { data: protocolStatsData } = useReadContract({
    address: CONTRACT_ADDRESSES.PROTOCOL,
    abi: MantleEarnXProtocol.abi,
    functionName: 'getProtocolStats',
  });

  // Get USDC balance
  const { data: usdcBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.USDC,
    abi: MantleUSDC.abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  // Get invoice counter
  const { data: invoiceCounter } = useReadContract({
    address: CONTRACT_ADDRESSES.PROTOCOL,
    abi: MantleEarnXProtocol.abi,
    functionName: 'invoiceCounter',
  });

  // ============ SUBMIT INVOICE ============
  const submitInvoice = useCallback(async (invoiceData: {
    buyer: string;
    amount: string;
    commodity: string;
    supplierCountry: string;
    buyerCountry: string;
    exporterName: string;
    buyerName: string;
    dueDate: number;
    documentHash: string;
  }) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!address) {
        throw new Error('Wallet not connected. Please connect your wallet first.');
      }

      if (!publicClient) {
        throw new Error('Public client not available. Please check your network connection.');
      }

      console.log('🚀 Submitting invoice to Mantle EarnX Protocol:', invoiceData);

      // Check if connected to Mantle Sepolia
      if (publicClient?.chain?.id !== 5003) {
        throw new Error(`Wrong network! Please switch to Mantle Sepolia (Chain ID: 5003). Currently on Chain ID: ${publicClient?.chain?.id}`);
      }

      // Check MNT balance for gas
      const balance = await publicClient.getBalance({ address: address });
      const balanceMNT = Number(formatUnits(balance, 18));
      console.log(`💰 User MNT balance: ${balanceMNT} MNT`);

      if (balanceMNT < 0.001) {
        throw new Error(`Insufficient MNT for gas fees. You have ${balanceMNT.toFixed(6)} MNT but need at least 0.001 MNT. Please add MNT to your wallet.`);
      }

      // Submit transaction
      const tx = await writeProtocol({
        address: CONTRACT_ADDRESSES.PROTOCOL,
        abi: MantleEarnXProtocol.abi,
        functionName: 'submitInvoice',
        args: [
          invoiceData.buyer as Address,
          parseUnits(invoiceData.amount, 6), // USDC has 6 decimals
          invoiceData.commodity,
          invoiceData.supplierCountry,
          invoiceData.buyerCountry,
          invoiceData.exporterName,
          invoiceData.buyerName,
          BigInt(invoiceData.dueDate),
          invoiceData.documentHash,
        ],
      });

      console.log('🎯 Transaction submitted:', tx);

      if (!tx) {
        throw new Error('Transaction was not submitted');
      }

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
      console.log('📋 Transaction receipt:', receipt);

      if (!receipt) {
        throw new Error('Transaction receipt not available');
      }

      // Extract invoice ID from logs
      let invoiceId: string | null = null;
      if (receipt.logs && receipt.logs.length > 0) {
        const invoiceSubmittedEvent = receipt.logs.find((log: any) => 
          log.address.toLowerCase() === CONTRACT_ADDRESSES.PROTOCOL.toLowerCase()
        );
        
        if (invoiceSubmittedEvent && invoiceSubmittedEvent.topics && invoiceSubmittedEvent.topics[1]) {
          invoiceId = BigInt(invoiceSubmittedEvent.topics[1]).toString();
          console.log('📋 Extracted invoice ID from event:', invoiceId);
        }
      }

      // Fallback: Read the current invoice counter
      if (!invoiceId) {
        try {
          const counter = await publicClient.readContract({
            address: CONTRACT_ADDRESSES.PROTOCOL,
            abi: MantleEarnXProtocol.abi,
            functionName: 'invoiceCounter',
          }) as bigint | undefined;
          
          if (counter) {
            invoiceId = counter.toString();
            console.log('📋 Got invoice ID from counter:', invoiceId);
          }
        } catch (counterError) {
          console.warn('Could not read invoice counter:', counterError);
        }
      }

      console.log('✅ Invoice submitted successfully!', {
        txHash: tx,
        invoiceId: invoiceId,
        blockNumber: receipt.blockNumber
      });

      return { 
        success: true, 
        txHash: tx, 
        invoiceId: invoiceId,
        blockNumber: receipt.blockNumber.toString(),
      };

    } catch (error) {
      console.error('❌ Error submitting invoice:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit invoice');
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      setIsLoading(false);
    }
  }, [writeProtocol, publicClient, address]);

  // ============ INVEST IN INVOICE ============
  const investInInvoice = useCallback(async (invoiceId: string, amount: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Invalid investment amount');
      }

      console.log(`💰 Starting investment: ${amount} USDC in Invoice ${invoiceId}`);

      if (!address || !walletClient || !publicClient) {
        throw new Error('Wallet not connected');
      }

      // Check USDC balance
      const userBalance = usdcBalance ? Number(usdcBalance) / 1e6 : 0;
      if (userBalance < amountNum) {
        throw new Error(`Insufficient balance. You have ${userBalance.toFixed(2)} USDC but need ${amountNum} USDC`);
      }

      // Check USDC allowance
      const allowanceResult = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.USDC,
        abi: MantleUSDC.abi,
        functionName: 'allowance',
        args: [address, CONTRACT_ADDRESSES.PROTOCOL],
      }) as bigint;

      const allowance = Number(allowanceResult) / 1e6;
      console.log(`Current allowance: ${allowance} USDC, Required: ${amountNum} USDC`);

      if (allowance < amountNum) {
        throw new Error(`Insufficient USDC allowance. Please approve USDC spending first.`);
      }

      // Invest in invoice
      const tx = await walletClient.writeContract({
        address: CONTRACT_ADDRESSES.PROTOCOL,
        abi: MantleEarnXProtocol.abi,
        functionName: 'investInInvoice',
        args: [BigInt(invoiceId), parseUnits(amount, 6)],
        account: address,
      });

      console.log('✅ Investment transaction submitted:', tx);

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: tx,
        timeout: 60000,
      });

      if (receipt.status === 'success') {
        console.log('🎉 Investment confirmed!');
        return { 
          success: true, 
          txHash: tx,
          message: `Investment successful! ${amount} USDC invested in Invoice #${invoiceId}`,
        };
      } else {
        throw new Error('Investment transaction failed');
      }

    } catch (error: any) {
      console.error('❌ Investment failed:', error);
      
      let errorMessage = 'Investment failed';
      if (error?.name === 'UserRejectedRequestError' || error?.code === 4001) {
        errorMessage = 'Transaction was cancelled by user';
      } else if (error?.message?.includes('insufficient')) {
        errorMessage = error.message;
      } else if (error?.message?.includes('allowance')) {
        errorMessage = 'Please approve USDC spending first';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, publicClient, address, usdcBalance]);

  // ============ APPROVE USDC ============
  const approveUSDC = useCallback(async (spender: string, amount: string) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!address || !walletClient || !publicClient) {
        throw new Error('Wallet not connected');
      }

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Invalid approval amount');
      }

      console.log(`💳 Approving ${amount} USDC for ${spender}`);

      // Use a large approval amount to avoid repeated approvals
      const approvalAmount = Math.max(amountNum * 5, 50000);

      const tx = await walletClient.writeContract({
        address: CONTRACT_ADDRESSES.USDC,
        abi: MantleUSDC.abi,
        functionName: 'approve',
        args: [spender as `0x${string}`, parseUnits(approvalAmount.toString(), 6)],
        account: address,
      });

      console.log('✅ Approval transaction submitted:', tx);

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: tx,
        timeout: 60000,
      });

      if (receipt.status === 'success') {
        console.log('🎉 USDC approval confirmed!');
        return { 
          success: true, 
          txHash: tx,
          message: `Successfully approved ${approvalAmount.toLocaleString()} USDC!`
        };
      } else {
        throw new Error('Approval transaction failed');
      }

    } catch (error: any) {
      console.error('❌ USDC approval failed:', error);
      
      let errorMessage = 'Approval failed';
      if (error?.name === 'UserRejectedRequestError' || error?.code === 4001) {
        errorMessage = 'Approval was cancelled by user';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [address, walletClient, publicClient]);

  // ============ MINT TEST USDC ============
  const mintTestUSDC = useCallback(async (amount: string) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!address || !walletClient || !publicClient) {
        throw new Error('Wallet not connected');
      }

      console.log(`🏦 Minting ${amount} test USDC to ${address}`);

      const tx = await walletClient.writeContract({
        address: CONTRACT_ADDRESSES.USDC,
        abi: MantleUSDC.abi,
        functionName: 'faucet',
        args: [parseUnits(amount, 6)],
        account: address,
      });

      console.log('✅ USDC mint transaction submitted:', tx);

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: tx,
        timeout: 60000,
      });

      if (receipt.status === 'success') {
        console.log('🎉 USDC mint confirmed!');
        return { 
          success: true, 
          txHash: tx,
          message: `Successfully minted ${amount} USDC!`
        };
      } else {
        throw new Error('USDC mint transaction failed');
      }

    } catch (error: any) {
      console.error('❌ USDC mint failed:', error);
      
      let errorMessage = 'Failed to mint USDC';
      if (error?.name === 'UserRejectedRequestError' || error?.code === 4001) {
        errorMessage = 'Mint was cancelled by user';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [address, walletClient, publicClient]);

  // ============ GET INVOICE DETAILS ============
  const getInvoiceDetails = useCallback(async (invoiceId: string): Promise<InvoiceDetails | null> => {
    try {
      if (!publicClient) return null;

      const result = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.PROTOCOL,
        abi: MantleEarnXProtocol.abi,
        functionName: 'getInvoice',
        args: [BigInt(invoiceId)],
      }) as any[];

      if (!result) return null;

      const [
        id, supplier, buyer, amount, commodity, supplierCountry, buyerCountry,
        exporterName, buyerName, dueDate, aprBasisPoints, status, createdAt,
        documentVerified, targetFunding, currentFunding
      ] = result;

      return {
        id: Number(id),
        supplier,
        buyer,
        amount: Number(amount),
        commodity,
        supplierCountry,
        buyerCountry,
        exporterName,
        buyerName,
        dueDate: Number(dueDate),
        aprBasisPoints: Number(aprBasisPoints),
        status: Number(status),
        createdAt: Number(createdAt),
        documentVerified,
        targetFunding: Number(targetFunding),
        currentFunding: Number(currentFunding),
      };
    } catch (error) {
      console.error('Error getting invoice details:', error);
      return null;
    }
  }, [publicClient]);

  // ============ GET INVESTMENT OPPORTUNITIES ============
  const getInvestmentOpportunities = useCallback(async (): Promise<InvestmentOpportunity[]> => {
    try {
      if (!publicClient) return [];

      const opportunityIds = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.PROTOCOL,
        abi: MantleEarnXProtocol.abi,
        functionName: 'getInvestmentOpportunities',
      }) as bigint[];

      if (!opportunityIds || opportunityIds.length === 0) {
        return [];
      }

      const opportunities: InvestmentOpportunity[] = [];

      for (const invoiceId of opportunityIds) {
        const details = await getInvoiceDetails(invoiceId.toString());
        if (details && details.status === 2) { // Verified status
          const remainingFunding = details.targetFunding - details.currentFunding;
          const fundingProgress = details.targetFunding > 0 ? (details.currentFunding / details.targetFunding) * 100 : 0;
          const apr = details.aprBasisPoints / 100;

          opportunities.push({
            ...details,
            remainingFunding: remainingFunding / 1e6, // Convert to USDC
            fundingProgress,
            apr,
            riskScore: 25, // Default risk score
            creditRating: 'B', // Default rating
            isAvailable: remainingFunding > 0,
          });
        }
      }

      return opportunities.sort((a, b) => b.apr - a.apr); // Sort by APR descending

    } catch (error) {
      console.error('Error getting investment opportunities:', error);
      return [];
    }
  }, [publicClient, getInvoiceDetails]);

  // ============ PROCESSED DATA ============
  const protocolStats: ProtocolStats | null = protocolStatsData ? {
    totalInvoices: Number(protocolStatsData[0]),
    totalFundsRaised: Number(protocolStatsData[1]) / 1e6,
    pendingInvoices: Number(protocolStatsData[2]),
    verifiedInvoices: Number(protocolStatsData[3]),
    fundedInvoices: Number(protocolStatsData[4]),
    repaidInvoices: Number(protocolStatsData[5]),
  } : null;

  const usdcBalanceFormatted = usdcBalance ? Number(usdcBalance) / 1e6 : 0;
  const invoiceCounterNum = invoiceCounter ? Number(invoiceCounter) : 0;

  return {
    // Connection state
    isConnected,
    address,
    isLoading,
    error,

    // Contract addresses
    contractAddresses: CONTRACT_ADDRESSES,

    // Protocol data
    protocolStats,
    invoiceCounter: invoiceCounterNum,
    usdcBalance: usdcBalanceFormatted,

    // Functions
    submitInvoice,
    investInInvoice,
    approveUSDC,
    mintTestUSDC,
    getInvoiceDetails,
    getInvestmentOpportunities,

    // Clear error
    clearError: () => setError(null),
  };
};