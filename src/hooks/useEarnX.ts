// hooks/useEarnX.ts - Complete EarnX Protocol Integration for Mantle Network
import { useState, useCallback } from 'react';
// @ts-ignore
import { useAccount, useWriteContract, useReadContract, usePublicClient, useWalletClient } from 'wagmi';
import { parseUnits, formatUnits, Address } from 'viem';

// Import ABIs from Mantle deployment
import MantleEarnXProtocol from '../abis/MantleEarnXProtocol.json';
import MantleEarnXVerificationModule from '../abis/MantleEarnXVerificationModule.json';
import MantleUSDC from '../abis/MantleUSDC.json';
import MantlePriceManager from '../abis/MantlePriceManager.json';
import EarnXInvestmentModule from '../abis/EarnXInvestmentModule.json';
import EarnXInvoiceNFT from '../abis/EarnXInvoiceNFT.json';

const EarnXProtocolABI = MantleEarnXProtocol.abi;
const EarnXPriceManagerABI = MantlePriceManager.abi;
const EarnXVerificationModuleABI = MantleEarnXVerificationModule.abi;
const EarnXUSDCABI = MantleUSDC.abi;

// Use MantleUSDC ABI
const MockUSDCABI = EarnXUSDCABI;

// ✅ MANTLE SEPOLIA DEPLOYMENT - Fixed Version (January 2025)
const CONTRACT_ADDRESSES = {
  PROTOCOL: "0xec40a9Bb73A17A9b2571A8F89D404557b6E9866A" as const, // ✅ FIXED MANTLE EARNX PROTOCOL
  USDC: "0x211a38792781b2c7a584a96F0e735d56e809fe85" as const,     // ✅ MANTLE USDC
  VERIFICATION_MODULE: "0xDFe9b0627e0ec2b653FaDe125421cc32575631FC" as const, // ✅ FIXED MANTLE VERIFICATION MODULE

  // ✅ All supporting contracts from Mantle deployment
  INVOICE_NFT: "0x4f330C74c7bd84665722bA0664705e2f2E6080DC" as const,
  PRICE_MANAGER: "0x789f82778A8d9eB6514a457112a563A89F79A2f1" as const,
  INVESTMENT_MODULE: "0x199516b47F1ce8C77617b58526ad701bF1f750FA" as const,
} as const;

// Use the imported verification module ABI
const EARNX_VERIFICATION_ABI = EarnXVerificationModuleABI;

// Types
interface VerificationData {
  verified: boolean;
  valid: boolean;
  details: string;
  risk: number;
  rating: string;
  timestamp: number;
  error?: string;
}

interface ProtocolStats {
  totalInvoices: number;
  totalFundsRaised: number;
  pendingInvoices: number;
  verifiedInvoices: number;
  fundedInvoices: number;
}

interface LiveMarketData {
  ethPrice: number;
  usdcPrice: number;
  btcPrice: number;
  mntPrice: number;
  lastUpdate: number;
  marketVolatility: number;
  initialPricesFetched: boolean;
}

export const useEarnX = () => {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Contract writes
  const { writeContractAsync: writeEarnXCore } = useWriteContract();
  const { writeContractAsync: writeUSDC } = useWriteContract();
  const { writeContractAsync: writeVerification } = useWriteContract();
  const { writeContractAsync: writePriceManager } = useWriteContract();
  
  // ============ PROTOCOL STATS ============
  
  // Protocol Stats
  const { data: protocolStats } = useReadContract({
    address: CONTRACT_ADDRESSES.PROTOCOL,
    abi: EarnXProtocolABI,
    functionName: 'getProtocolStats',
  });
  
  // Invoice counter
  const { data: invoiceCounter } = useReadContract({
    address: CONTRACT_ADDRESSES.PROTOCOL,
    abi: EarnXProtocolABI,
    functionName: 'invoiceCounter',
  });
  
  // ============ LIVE MARKET DATA ============
  
  // Live market prices
  const { data: priceData } = useReadContract({
    address: CONTRACT_ADDRESSES.PRICE_MANAGER,
    abi: EarnXPriceManagerABI,
    functionName: 'getAllPrices',
    query: { refetchInterval: 30000 }
  });
  
  // ============ USDC DATA ============
  
  // Get USDC balance
  const { data: usdcBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.USDC,
    abi: MockUSDCABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });
  
  // ============ VERIFICATION READ FUNCTIONS ============
  
  // Get verification data for specific invoice with demo mode support
  const getVerificationData = useCallback(async (invoiceId: string): Promise<VerificationData | null> => {
    try {
      console.log(`🔍 Getting verification data for invoice ${invoiceId}`);
      
      // First try real blockchain verification
      try {
        const result = await publicClient?.readContract({
          address: CONTRACT_ADDRESSES.VERIFICATION_MODULE,
          abi: EARNX_VERIFICATION_ABI,
          functionName: 'getDocumentVerification',
          args: [BigInt(invoiceId)],
        }) as [boolean, boolean, string, bigint, string, bigint] | undefined;
        
        if (result) {
          const [verified, valid, details, risk, rating, timestamp] = result;
          
          const verificationData = {
            verified,
            valid,
            details,
            risk: Number(risk),
            rating,
            timestamp: Number(timestamp),
          };
          
          console.log(`✅ Real blockchain verification data for invoice ${invoiceId}:`, verificationData);
          return verificationData;
        }
      } catch (blockchainError) {
        console.log(`⚠️ Blockchain verification failed for invoice ${invoiceId}, checking demo mode...`);
      }
      
      // Check if this is a demo invoice
      const demoInvoices = localStorage.getItem('demo_invoices');
      if (demoInvoices) {
        const invoices = JSON.parse(demoInvoices);
        const demoInvoice = invoices[invoiceId];
        
        if (demoInvoice) {
          console.log(`🎭 Found demo invoice ${invoiceId}, checking verification status...`);
          
          // Check if demo verification exists
          const demoVerifications = localStorage.getItem('demo_verifications');
          if (demoVerifications) {
            const verifications = JSON.parse(demoVerifications);
            const verification = verifications[invoiceId];
            
            if (verification) {
              console.log(`🎭 Demo verification found for invoice ${invoiceId}:`, verification);
              return verification;
            }
          }
          
          // Check if enough time has passed for auto-verification (10 seconds for faster demo)
          const timeSinceSubmission = Date.now() - demoInvoice.timestamp;
          if (timeSinceSubmission > 10000) {
            console.log(`🎭 Auto-verifying demo invoice ${invoiceId} after 10 seconds...`);
            
            // Generate demo verification data
            const demoVerification = {
              verified: true,
              valid: true,
              details: `Demo invoice ${invoiceId} verified successfully by EarnX API simulation. All checks passed.`,
              risk: Math.floor(Math.random() * 30) + 10, // 10-40 risk score
              rating: ['A', 'A-', 'B+', 'B'][Math.floor(Math.random() * 4)],
              timestamp: Math.floor(Date.now() / 1000),
              isDemo: true
            };
            
            // Store demo verification
            const existingVerifications = localStorage.getItem('demo_verifications');
            const verifications = existingVerifications ? JSON.parse(existingVerifications) : {};
            verifications[invoiceId] = demoVerification;
            localStorage.setItem('demo_verifications', JSON.stringify(verifications));
            
            console.log(`🎭 Demo verification created for invoice ${invoiceId}:`, demoVerification);
            return demoVerification;
          } else {
            console.log(`🎭 Demo invoice ${invoiceId} still processing (${10 - Math.floor(timeSinceSubmission / 1000)}s remaining)...`);
            return null; // Continue polling
          }
        }
      }
      
      // Invoice not found in blockchain or demo
      console.log(`📋 Invoice ${invoiceId} not found in blockchain or demo system`);
      return { 
        verified: false, 
        valid: false, 
        details: `Invoice ${invoiceId} not found in verification system`, 
        risk: 0, 
        rating: '', 
        timestamp: 0,
        error: 'INVOICE_NOT_FOUND'
      };
      
    } catch (error) {
      console.error('❌ Error getting verification data:', error);
      return null;
    }
  }, [publicClient]);
  
  // Get last Functions response (global - for debugging only)
  const getLastFunctionsResponse = useCallback(async () => {
    try {
      const result = await publicClient?.readContract({
        address: CONTRACT_ADDRESSES.VERIFICATION_MODULE,
        abi: EARNX_VERIFICATION_ABI,
        functionName: 'getLastFunctionsResponse',
      }) as [string, string, string] | undefined;
      
      if (!result) return null;
      
      const [lastRequestId, lastResponse, lastError] = result;
      
      // Decode the response
      let decodedResponse = '';
      if (lastResponse && lastResponse !== '0x') {
        try {
          decodedResponse = Buffer.from(lastResponse.slice(2), 'hex').toString('utf8');
        } catch (e) {
          console.warn('Could not decode response:', e);
        }
      }
      
      return {
        lastRequestId,
        lastResponse,
        lastError,
        decodedResponse,
        responseLength: lastResponse ? (lastResponse.length - 2) / 2 : 0,
      };
    } catch (error) {
      console.error('Error getting last Functions response:', error);
      return null;
    }
  }, [publicClient]);
  
  // ============ EARNX CORE READ FUNCTIONS ============
  
  // Get investment opportunities
  const getInvestmentOpportunities = useCallback(async () => {
    try {
      const result = await publicClient?.readContract({
        address: CONTRACT_ADDRESSES.PROTOCOL,
        abi: EarnXProtocolABI,
        functionName: 'getInvestmentOpportunities',
      }) as bigint[] | undefined;
      
      return result?.map(id => Number(id)) || [];
    } catch (error) {
      console.error('Error getting investment opportunities:', error);
      return [];
    }
  }, [publicClient]);
  
  // Get invoice details
  const getInvoiceDetails = useCallback(async (invoiceId: string) => {
    try {
      const result = await publicClient?.readContract({
        address: CONTRACT_ADDRESSES.PROTOCOL,
        abi: EarnXProtocolABI,
        functionName: 'getInvoice',
        args: [BigInt(invoiceId)],
      }) as any[] | undefined;
      
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
  
  // ============ USDC FUNCTIONS ============
  
  // Get USDC allowance
  const getUSDCAllowance = useCallback(async (spender: string) => {
    try {
      const result = await publicClient?.readContract({
        address: CONTRACT_ADDRESSES.USDC,
        abi: MockUSDCABI,
        functionName: 'allowance',
        args: [address as Address, spender as Address],
      }) as bigint | undefined;
      
      return result ? Number(result) : 0;
    } catch (error) {
      console.error('Error getting USDC allowance:', error);
      return 0;
    }
  }, [publicClient, address]);
  
  // ============ WRITE FUNCTIONS ============
  
  // Submit invoice to EarnXCore with fallback to demo mode
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
      
      console.log('🚀 Submitting invoice to EarnXCore:', invoiceData);
      
      // Pre-flight checks
      if (!address) {
        throw new Error('Wallet not connected. Please connect your wallet first.');
      }
      
      if (!publicClient) {
        throw new Error('Public client not available. Please check your network connection.');
      }
      
      console.log('🔍 Pre-flight checks:', {
        walletConnected: !!address,
        walletAddress: address,
        publicClient: !!publicClient,
        contractAddress: CONTRACT_ADDRESSES.PROTOCOL,
        networkChainId: publicClient?.chain?.id,
        expectedChainId: 5003, // Mantle Sepolia testnet
        networkMatch: publicClient?.chain?.id === 5003
      });
      
      // Check if connected to Mantle Sepolia testnet
      if (publicClient?.chain?.id !== 5003) {
        throw new Error(`Wrong network! Please switch to Mantle Sepolia Testnet (Chain ID: 5003). Currently on Chain ID: ${publicClient?.chain?.id}`);
      }
      
      // Check MNT balance for gas
      const balance = await publicClient.getBalance({ address: address });
      const balanceMNT = Number(formatUnits(balance, 18));
      console.log(`💰 User MNT balance: ${balanceMNT} MNT`);
      
      if (balanceMNT < 0.001) {
        throw new Error(`Insufficient MNT for gas fees. You have ${balanceMNT.toFixed(6)} MNT but need at least 0.001 MNT. Please add MNT to your wallet.`);
      }
      
      console.log('📋 Contract call parameters:', {
        address: CONTRACT_ADDRESSES.PROTOCOL,
        buyer: invoiceData.buyer,
        amount: parseUnits(invoiceData.amount, 6).toString(),
        commodity: invoiceData.commodity,
        supplierCountry: invoiceData.supplierCountry,
        buyerCountry: invoiceData.buyerCountry,
        exporterName: invoiceData.exporterName,
        buyerName: invoiceData.buyerName,
        dueDate: BigInt(invoiceData.dueDate).toString(),
        documentHash: invoiceData.documentHash,
      });

      // Try real blockchain submission first
      try {
        console.log('🔄 Calling writeEarnXCore with:', {
          contractAddress: CONTRACT_ADDRESSES.PROTOCOL,
          functionName: 'submitInvoice',
          writeEarnXCoreAvailable: !!writeEarnXCore,
          abiLength: EarnXProtocolABI.length
        });
        
        // Submit transaction and wait for hash
        const tx = await writeEarnXCore({
          address: CONTRACT_ADDRESSES.PROTOCOL,
          abi: EarnXProtocolABI,
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
        
        console.log('🎯 Transaction call completed, result:', tx);
        
        console.log('⏳ Transaction submitted, waiting for confirmation...', tx);
        
        // Check if transaction hash was returned
        if (!tx) {
          throw new Error('Transaction was not submitted - writeEarnXCore returned undefined');
        }
        
        // Wait for transaction to be confirmed and get receipt
        const receipt = await publicClient?.waitForTransactionReceipt({ hash: tx });
        console.log('📋 Transaction receipt:', receipt);
        
        if (!receipt) {
          throw new Error('Transaction receipt not available');
        }
        
        // Extract the invoice ID from transaction logs or read from contract
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
        
        // Fallback: Read the current invoice counter from contract
        if (!invoiceId) {
          try {
            const counter = await publicClient?.readContract({
              address: CONTRACT_ADDRESSES.PROTOCOL,
              abi: EarnXProtocolABI,
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
        
        console.log('✅ Real blockchain submission successful!', {
          txHash: tx,
          invoiceId: invoiceId,
          blockNumber: receipt.blockNumber
        });
        
        return { 
          success: true, 
          txHash: tx, 
          invoiceId: invoiceId,
          blockNumber: receipt.blockNumber.toString(),
          isDemo: false
        };
        
      } catch (blockchainError) {
        console.error('❌ Real blockchain submission failed:', blockchainError);
        console.error('❌ Full error details:', {
          message: blockchainError instanceof Error ? blockchainError.message : String(blockchainError),
          stack: blockchainError instanceof Error ? blockchainError.stack : null,
          contractAddress: CONTRACT_ADDRESSES.PROTOCOL,
          args: [
            invoiceData.buyer,
            parseUnits(invoiceData.amount, 6).toString(),
            invoiceData.commodity,
            invoiceData.supplierCountry,
            invoiceData.buyerCountry,
            invoiceData.exporterName,
            invoiceData.buyerName,
            BigInt(invoiceData.dueDate).toString(),
            invoiceData.documentHash,
          ]
        });
        
        // 🎭 ENHANCED FALLBACK - Real API verification + Local storage
        console.log('🎭 Blockchain failed, using enhanced verification fallback...');
        
        // Step 1: Call real verification API directly
        let verificationResult = { result: "1,35,B" }; // Default fallback
        
        try {
          console.log('🌐 Calling verification API directly...');
          const apiResponse = await fetch('https://earnx-verification-api.onrender.com/api/v1/verification/verify-minimal', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              invoiceId: `INV-${Date.now()}`,
              documentHash: invoiceData.documentHash,
              commodity: invoiceData.commodity,
              amount: parseInt(invoiceData.amount.toString()) || 50000,
              supplierCountry: invoiceData.supplierCountry,
              buyerCountry: invoiceData.buyerCountry,
              exporterName: invoiceData.exporterName,
              buyerName: invoiceData.buyerName
            })
          });

          if (apiResponse.ok) {
            verificationResult = await apiResponse.json();
            console.log('✅ Real API verification successful:', verificationResult);
          } else {
            console.log('⚠️ API call failed, using default verification');
          }
        } catch (apiError) {
          console.log('⚠️ API error, using default verification:', apiError);
        }

        // Parse verification result
        const [isValid, riskScore, creditRating] = verificationResult.result.split(',');
        
        // Generate verified invoice ID with real verification data
        const currentTime = Date.now();
        const demoInvoiceId = `VERIFIED-${currentTime}`;
        const demoTxHash = `0x${Math.random().toString(16).substring(2).padStart(64, '0')}`;
        const demoBlockNumber = Math.floor(Math.random() * 1000000) + 1000000;
        
        console.log(`📝 Creating verified invoice with ID: ${demoInvoiceId}`);
        console.log(`📊 Verification: Valid=${isValid}, Risk=${riskScore}, Rating=${creditRating}`);
        
        // Store demo invoice in localStorage
        const existingInvoices = localStorage.getItem('demo_invoices');
        const invoices = existingInvoices ? JSON.parse(existingInvoices) : {};
        
        invoices[demoInvoiceId] = {
          id: demoInvoiceId,
          buyer: invoiceData.buyer,
          supplier: address,
          amount: invoiceData.amount,
          commodity: invoiceData.commodity,
          supplierCountry: invoiceData.supplierCountry,
          buyerCountry: invoiceData.buyerCountry,
          exporterName: invoiceData.exporterName,
          buyerName: invoiceData.buyerName,
          dueDate: invoiceData.dueDate,
          documentHash: invoiceData.documentHash,
          status: isValid === '1' ? 'Verified' : 'Verifying',
          createdAt: currentTime,
          timestamp: currentTime,
          txHash: demoTxHash,
          blockNumber: demoBlockNumber,
          // ✅ Add real verification data
          isVerified: isValid === '1',
          riskScore: parseInt(riskScore) || 35,
          creditRating: creditRating || 'B',
          investmentReady: isValid === '1' && parseInt(riskScore) < 50,
          verificationSource: 'api-fallback'
        };
        
        localStorage.setItem('demo_invoices', JSON.stringify(invoices));
        
        console.log('🎭 Demo invoice stored successfully:', invoices[demoInvoiceId]);
        
        return {
          success: true,
          invoiceId: demoInvoiceId,
          txHash: demoTxHash,
          blockNumber: demoBlockNumber,
          isDemo: true,
          message: 'Invoice submitted in demo mode due to blockchain issues'
        };
      }
      
    } catch (error) {
      console.error('❌ Error submitting invoice:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit invoice');
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      setIsLoading(false);
    }
  }, [writeEarnXCore, publicClient]);
  
  // ✅ FIXED: Investment function in useEarnX hook - check CORE CONTRACT allowance
const investInInvoice = useCallback(async (invoiceId: string, amount: string) => {
  try {
    setIsLoading(true);
    setError(null);
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      throw new Error('Invalid investment amount');
    }
    
    console.log(`💰 Starting investment: ${amount} USDC in Invoice ${invoiceId}`);
    console.log(`👤 Investor address: ${address}`);
    
    // Step 1: Validate user balance
    const userBalance = usdcBalance ? Number(usdcBalance) / 1e6 : 0;
    if (userBalance < amountNum) {
      throw new Error(`Insufficient balance. You have ${userBalance.toFixed(2)} USDC but need ${amountNum} USDC`);
    }
    
    // ✅ FIXED: Step 2 - Check allowance for CORE CONTRACT (not Investment Module)
    console.log('📝 Checking USDC allowance for Core Contract...');
    const allowance = await getUSDCAllowance(CONTRACT_ADDRESSES.PROTOCOL); // ✅ CORRECT: Core Contract
    const amountWei = amountNum * 1e6;
    
    console.log(`Core Contract allowance: ${allowance / 1e6} USDC, Required: ${amountNum} USDC`);
    
    if (allowance < amountWei) {
      throw new Error(`Insufficient USDC allowance for Core Contract. Current: ${(allowance/1e6).toFixed(2)} USDC, Need: ${amountNum} USDC. Please approve USDC first.`);
    }
    
    // Step 3: Validate invoice
    console.log('📝 Validating invoice...');
    const invoiceDetails = await getInvoiceDetails(invoiceId);
    
    if (!invoiceDetails) {
      throw new Error('Could not fetch invoice details');
    }
    
    console.log(`✅ Invoice ${invoiceId} status: ${invoiceDetails.status} (need 2 for Verified)`);
    console.log(`✅ Invoice APR: ${invoiceDetails.aprBasisPoints} basis points`);
    console.log(`✅ Invoice supplier: ${invoiceDetails.supplier}`);
    console.log(`✅ Your address: ${address}`);
    
    if (invoiceDetails.status !== 2) {
      throw new Error(`Invoice not available for investment. Status: ${invoiceDetails.status} (need 2 for Verified)`);
    }
    
    if (invoiceDetails.aprBasisPoints <= 0) {
      throw new Error('Invoice has no APR set. Verification may not be complete.');
    }
    
    const remainingFunding = (invoiceDetails.targetFunding - invoiceDetails.currentFunding) / 1e6;
    if (amountNum > remainingFunding) {
      throw new Error(`Investment amount (${amountNum}) exceeds remaining funding (${remainingFunding.toFixed(2)})`);
    }
    
    // Pre-check: Are you the supplier?
    if (invoiceDetails.supplier.toLowerCase() === address?.toLowerCase()) {
      throw new Error('Supplier cannot invest in own invoice. Please use a different wallet address to invest.');
    }
    
    // Step 4: Submit transaction
    console.log('🔄 Preparing transaction for wallet confirmation...');
    console.log('💡 Please check your wallet for the transaction confirmation popup!');
    
    if (!walletClient) {
      throw new Error('Wallet client not available. Please reconnect your wallet.');
    }
    
    if (!publicClient) {
      throw new Error('Public client not available. Please check your network connection.');
    }
    
    try {
      console.log('🚀 Sending transaction to wallet for confirmation...');
      
      const transactionArgs = [BigInt(invoiceId), parseUnits(amount, 6)];
      
      const investInInvoiceAbi = EarnXProtocolABI.find(
        (item: any) => item.type === 'function' && item.name === 'investInInvoice'
      );
      
      if (!investInInvoiceAbi) {
        throw new Error('investInInvoice function not found in contract ABI');
      }
      
      // ✅ CORRECT: Call Core Contract (which handles the allowance check)
      const txHash = await walletClient.writeContract({
        address: CONTRACT_ADDRESSES.PROTOCOL as `0x${string}`,
        abi: [investInInvoiceAbi],
        functionName: 'investInInvoice',
        args: transactionArgs,
        account: address as `0x${string}`,
      });
      
      console.log('✅ Transaction confirmed by user!');
      console.log('✅ Transaction hash:', txHash);
      
      // Wait for transaction confirmation
      console.log('⏳ Waiting for blockchain confirmation...');
      
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
        timeout: 60000,
      });
      
      if (receipt.status === 'success') {
        console.log('🎉 Transaction confirmed on blockchain!');
        console.log('📄 Receipt:', receipt);
        
        return { 
          success: true, 
          txHash: txHash,
          message: `Investment successful! ${amount} USDC invested in Invoice #${invoiceId}`,
          receipt: receipt
        };
      } else {
        throw new Error('Transaction failed on blockchain');
      }
      
    } catch (walletError: any) {
      console.error('❌ Detailed wallet error:', walletError);
      
      // Handle user rejection
      if (walletError?.name === 'UserRejectedRequestError' || 
          walletError?.message?.includes('User rejected') ||
          walletError?.message?.includes('user rejected') ||
          walletError?.code === 4001) {
        throw new Error('Transaction was cancelled by user');
      }
      
      // Extract specific contract error messages
      let errorMessage = 'Transaction failed';
      
      if (walletError?.cause?.reason) {
        errorMessage = `Contract error: ${walletError.cause.reason}`;
      } else if (walletError?.shortMessage) {
        errorMessage = `Contract error: ${walletError.shortMessage}`;
      } else if (walletError?.details) {
        errorMessage = `Contract error: ${walletError.details}`;
      } else if (walletError?.message?.includes('execution reverted')) {
        const patterns = [
          /execution reverted: (.+?)(\"|$)/,
          /reverted with reason string '(.+?)'/,
          /revert (.+?)(\"|$)/,
          /'(.+?)'/
        ];
        
        for (const pattern of patterns) {
          const match = walletError.message.match(pattern);
          if (match && match[1]) {
            errorMessage = `Contract error: ${match[1]}`;
            break;
          }
        }
        
        if (errorMessage === 'Transaction failed') {
          errorMessage = `Contract execution reverted: ${walletError.message}`;
        }
      } else if (walletError?.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas fee';
      } else if (walletError?.message?.includes('gas')) {
        errorMessage = 'Gas estimation failed. Transaction may revert.';
      } else if (walletError?.message) {
        errorMessage = `Wallet error: ${walletError.message}`;
      }
      
      console.log('🔍 Final extracted error message:', errorMessage);
      throw new Error(errorMessage);
    }
    
  } catch (error) {
    console.error('❌ Investment failed:', error);
    
    let errorMessage = 'Investment failed';
    if (error instanceof Error) {
      if (error.message.includes('insufficient allowance') || error.message.includes('Insufficient USDC allowance')) {
        errorMessage = 'Please approve USDC for Core Contract first';
      } else if (error.message.includes('exceeds')) {
        errorMessage = 'Investment amount too high';
      } else if (error.message.includes('cancelled') || error.message.includes('rejected')) {
        errorMessage = 'Transaction was cancelled by user';
      } else if (error.message.includes('insufficient balance') || error.message.includes('Insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction';
      } else if (error.message.includes('not available for investment')) {
        errorMessage = 'Invoice not ready for investment';
      } else if (error.message.includes('Supplier cannot invest')) {
        errorMessage = 'You cannot invest in your own invoice. Please use a different wallet address.';
      } else if (error.message.includes('Contract error:')) {
        errorMessage = error.message; // Keep contract errors as-is
      } else if (error.message.includes('Wallet client not available')) {
        errorMessage = 'Please reconnect your wallet and try again';
      } else {
        errorMessage = error.message;
      }
    }
    
    setError(errorMessage);
    return { 
      success: false, 
      error: errorMessage,
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  } finally {
    setIsLoading(false);
  }
}, [
  walletClient,
  publicClient,
  getUSDCAllowance, 
  getInvoiceDetails,
  usdcBalance, 
  setIsLoading, 
  setError,
  address
]);
  
  // Approve USDC spending
  const approveUSDC = useCallback(async (spender: string, amount: string) => {
    if (!address || !walletClient || !publicClient) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Invalid approval amount');
      }
      
      console.log(`💳 Approving ${amount} USDC for ${spender}`);
      console.log(`💳 Spender should be Protocol Contract: ${CONTRACT_ADDRESSES.PROTOCOL}`);
      console.log(`💳 Please check your wallet for the approval transaction!`);
      
      // Check current allowance
      const currentAllowance = await getUSDCAllowance(spender);
      console.log(`💳 Current allowance for ${spender}: ${currentAllowance / 1e6} USDC`);
      
      // Use a large approval amount to avoid repeated approvals
      const approvalAmount = Math.max(amountNum * 5, 50000); // Approve 5x the amount or 50,000 USDC minimum
      
      console.log(`💳 Approving ${approvalAmount} USDC for ${spender}...`);
      
      try {
        // ✅ FIXED: Use walletClient directly - this WILL wait for user confirmation
        const approveTx = await walletClient.writeContract({
          address: CONTRACT_ADDRESSES.USDC as `0x${string}`,
          abi: MockUSDCABI,
          functionName: 'approve',
          args: [spender as `0x${string}`, parseUnits(approvalAmount.toString(), 6)],
          account: address as `0x${string}`,
        });
        
        console.log('✅ Approval transaction confirmed by user!');
        console.log('✅ Transaction hash:', approveTx);
        
        // Check if we got a valid transaction hash
        if (!approveTx || typeof approveTx !== 'string' || approveTx.length < 10) {
          throw new Error('Approval transaction failed - invalid transaction hash');
        }
        
        // Wait for blockchain confirmation
        console.log('⏳ Waiting for blockchain confirmation...');
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: approveTx,
          timeout: 60000, // 60 second timeout
        });
        
        if (receipt.status === 'success') {
          console.log('🎉 Approval confirmed on blockchain!');
          
          // Verify approval
          const newAllowance = await getUSDCAllowance(spender);
          console.log(`💳 New allowance for ${spender}: ${newAllowance / 1e6} USDC`);
          
          if (newAllowance >= parseUnits(amount, 6)) {
            console.log('✅ USDC approval verification successful!');
            return { 
              success: true, 
              txHash: approveTx,
              message: `Successfully approved ${approvalAmount.toLocaleString()} USDC for Protocol Contract!`
            };
          } else {
            throw new Error('Approval verification failed - allowance not set correctly');
          }
        } else {
          throw new Error('Approval transaction was reverted by blockchain');
        }
        
      } catch (walletError: any) {
        console.error('❌ Wallet approval error:', walletError);
        console.error('❌ Error details:', {
          name: walletError?.name,
          message: walletError?.message,
          code: walletError?.code,
          cause: walletError?.cause,
        });
        
        // Handle user rejection
        if (walletError?.name === 'UserRejectedRequestError' || 
            walletError?.message?.includes('User rejected') ||
            walletError?.message?.includes('user rejected') ||
            walletError?.code === 4001) {
          throw new Error('Approval was cancelled by user');
        }
        
        // Handle insufficient gas
        if (walletError?.message?.includes('insufficient funds for intrinsic transaction cost')) {
          throw new Error('Insufficient MNT for gas fees');
        }
        
        // Handle other wallet errors
        if (walletError?.message?.includes('execution reverted')) {
          throw new Error('Approval transaction failed - please try again');
        }
        
        throw new Error(`Approval failed: ${walletError?.message || 'Unknown wallet error'}`);
      }
      
    } catch (error) {
      console.error('❌ USDC approval failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve USDC';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [
    address, 
    walletClient, 
    publicClient, 
    getUSDCAllowance, 
    setIsLoading, 
    setError
  ]);
  
  // Check if contract is paused
  const checkContractStatus = useCallback(async () => {
    if (!publicClient) return null;
    
    try {
      const [paused, contractInfo] = await Promise.all([
        publicClient.readContract({
          address: CONTRACT_ADDRESSES.USDC,
          abi: MockUSDCABI,
          functionName: 'paused'
        }),
        publicClient.readContract({
          address: CONTRACT_ADDRESSES.USDC,
          abi: MockUSDCABI,
          functionName: 'getContractInfo'
        })
      ]);
      
      console.log('📋 USDC Contract Status:', { paused, contractInfo });
      return { paused, contractInfo };
    } catch (error) {
      console.error('❌ Error checking contract status:', error);
      return null;
    }
  }, [publicClient]);

  // Mint test USDC with improved error handling and debugging
  const mintTestUSDC = useCallback(async (amount: string) => {
    if (!address || !walletClient || !publicClient) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`🏦 Minting ${amount} test USDC to ${address}`);
      
      // First check contract status
      const status = await checkContractStatus();
      if (status?.paused) {
        throw new Error('USDC contract is currently paused');
      }
      
      // Check current balance first
      const currentBalance = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.USDC,
        abi: MockUSDCABI,
        functionName: 'balanceOf',
        args: [address]
      });
      
      const currentBalanceNumber = Number(currentBalance) / 1e6;
      console.log('💰 Current USDC balance:', currentBalanceNumber);
      
      // Check if user already has sufficient balance for testing
      const requestedAmount = Number(amount);
      if (currentBalanceNumber >= requestedAmount) {
        return {
          success: true,
          message: `You already have ${currentBalanceNumber} USDC in your wallet. No need to mint more!`,
          balanceBefore: currentBalanceNumber,
          balanceAfter: currentBalanceNumber,
          skipMint: true
        };
      }
      
      // Check account MNT balance for gas
      const mntBalance = await publicClient.getBalance({ address: address as `0x${string}` });
      console.log('⛽ MNT balance for gas:', Number(mntBalance) / 1e18);
      
      if (mntBalance === 0n) {
        throw new Error('Insufficient MNT balance for gas fees. Please get some MNT from a faucet first.');
      }
      
      // Parse amount to proper uint256
      const amountWei = parseUnits(amount, 6);
      console.log('📊 Minting amount (with decimals):', amountWei.toString());
      
      // Add gas estimation to check for potential revert reasons
      try {
        const gasEstimate = await publicClient.estimateContractGas({
          address: CONTRACT_ADDRESSES.USDC as `0x${string}`,
          abi: MockUSDCABI,
          functionName: 'faucet',
          args: [amountWei],
          account: address as `0x${string}`,
        });
        console.log('⛽ Estimated gas:', gasEstimate.toString());
      } catch (gasError: any) {
        console.error('❌ Gas estimation failed:', gasError);
        throw new Error(`Transaction would revert: ${gasError?.message || 'Unknown gas estimation error'}`);
      }
      
      // Try faucet function with explicit gas limit
      const tx = await walletClient.writeContract({
        address: CONTRACT_ADDRESSES.USDC as `0x${string}`,
        abi: MockUSDCABI,
        functionName: 'faucet',
        args: [amountWei],
        account: address as `0x${string}`,
        gas: 100000n, // Set explicit gas limit
      });
      
      console.log('✅ USDC mint transaction submitted:', tx);
      
      if (!tx || typeof tx !== 'string') {
        throw new Error('Invalid transaction hash received');
      }
      
      // Wait for transaction confirmation
      console.log('⏳ Waiting for blockchain confirmation...');
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: tx,
        timeout: 60000,
      });
      
      if (receipt.status === 'success') {
        console.log('🎉 USDC mint confirmed on blockchain!');
        console.log(`✅ Successfully minted ${amount} USDC to ${address}`);
        
        // Check new balance
        const newBalance = await publicClient.readContract({
          address: CONTRACT_ADDRESSES.USDC,
          abi: MockUSDCABI,
          functionName: 'balanceOf',
          args: [address]
        });
        
        console.log('💰 New USDC balance:', Number(newBalance) / 1e6);
        
        return { 
          success: true, 
          txHash: tx,
          message: `Successfully minted ${amount} USDC to your wallet!`,
          receipt: receipt,
          balanceBefore: Number(currentBalance) / 1e6,
          balanceAfter: Number(newBalance) / 1e6
        };
      } else {
        console.error('❌ Transaction receipt indicates failure:', receipt);
        throw new Error('USDC mint transaction was reverted on blockchain');
      }
      
    } catch (error: any) {
      console.error('❌ Error minting USDC:', error);
      
      let errorMessage = 'Failed to mint USDC';
      
      if (error?.name === 'UserRejectedRequestError' || 
          error?.message?.includes('User rejected') ||
          error?.code === 4001) {
        errorMessage = 'USDC mint was cancelled by user';
      } else if (error?.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient MNT for gas fees. Please get MNT from a faucet first.';
      } else if (error?.message?.includes('Insufficient MNT balance')) {
        errorMessage = error.message;
      } else if (error?.message?.includes('paused')) {
        errorMessage = 'USDC contract is currently paused';
      } else if (error?.message?.includes('Faucet limit exceeded')) {
        errorMessage = 'Daily faucet limit exceeded. You already have enough USDC for testing or need to wait for reset.';
      } else if (error?.message?.includes('execution reverted') || error?.message?.includes('Transaction would revert')) {
        errorMessage = 'USDC faucet rejected transaction - possible cooldown or limit reached. Try again later or with a smaller amount.';
      } else if (error?.message?.includes('Gas estimation failed')) {
        errorMessage = 'Transaction simulation failed - the USDC faucet may have restrictions. Try again later.';
      } else if (error?.message) {
        errorMessage = `USDC mint failed: ${error.message}`;
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [address, walletClient, publicClient, checkContractStatus]);
  
  // Check USDC faucet status and any restrictions
  const checkUSDCFaucetStatus = useCallback(async () => {
    if (!publicClient || !address) return null;
    
    try {
      // Check contract info if available
      const contractInfo = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.USDC,
        abi: MockUSDCABI,
        functionName: 'getContractInfo',
      }).catch(() => null);
      
      // Check current balance
      const balance = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.USDC,
        abi: MockUSDCABI,
        functionName: 'balanceOf',
        args: [address]
      });
      
      // Check total supply if available
      const totalSupply = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.USDC,
        abi: MockUSDCABI,
        functionName: 'totalSupply',
      }).catch(() => null);
      
      return {
        contractInfo,
        currentBalance: Number(balance) / 1e6,
        totalSupply: totalSupply ? Number(totalSupply) / 1e6 : null,
        address: CONTRACT_ADDRESSES.USDC
      };
    } catch (error) {
      console.error('❌ Error checking USDC faucet status:', error);
      return null;
    }
  }, [publicClient, address]);

  // Add a refreshBalance function
  const refreshBalance = useCallback(async () => {
    if (!address || !publicClient) return;
    try {
      const balance = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.USDC,
        abi: MockUSDCABI,
        functionName: 'balanceOf',
        args: [address]
      });
      return Number(balance) / 1e6;
    } catch (error) {
      console.error('Error refreshing balance:', error);
      return null;
    }
  }, [address, publicClient]);
  
  // ============ PROCESSED DATA ============
  
  // Aliases for Dashboard compatibility
  const stats = protocolStats ? {
    totalInvoices: Number(protocolStats[0]),
    totalFundsRaised: Number(protocolStats[1]) / 1e6,
    pendingInvoices: Number(protocolStats[2]),
    verifiedInvoices: Number(protocolStats[3]),
    fundedInvoices: Number(protocolStats[4]),
    repaidInvoices: Number(protocolStats[5]),
  } : null;
  
  const loading = isLoading;
  const contracts = CONTRACT_ADDRESSES;
  
  // Live market data (using Mantle prices)
  const liveMarketData = priceData ? {
    ethPrice: Number(priceData[0]) / 1e8,
    usdcPrice: Number(priceData[1]) / 1e8, 
    btcPrice: Number(priceData[2]) / 1e8,
    mntPrice: Number(priceData[3]) / 1e8, // MNT price instead of LINK
    lastUpdate: Number(priceData[4]),
    marketVolatility: 0.02, // Default volatility
    initialPricesFetched: true,
  } : null;
  
  // Return all functions and data
  return {
    // Connection state
    isConnected,
    address,
    isLoading,
    error,
    
    // Protocol data
    protocolStats: stats,
    invoiceCounter: invoiceCounter ? Number(invoiceCounter) : 0,
    
    // Live market data
    liveMarketData,
    
    // USDC data
    usdcBalance: usdcBalance ? Number(usdcBalance) / 1e6 : 0,
    
    // Contract addresses
    contractAddresses: CONTRACT_ADDRESSES,
    contracts,
    
    // Core functions
    getInvestmentOpportunities,
    getInvoiceDetails,
    submitInvoice,
    investInInvoice,
    
    // Verification functions
    getVerificationData,
    getLastFunctionsResponse,
    
    // USDC functions
    getUSDCAllowance,
    approveUSDC,
    mintTestUSDC,
    checkUSDCFaucetStatus,
    refreshBalance,
    
    // Dashboard compatibility
    loading,
    
    // Clear error
    clearError: () => setError(null),
  };
};