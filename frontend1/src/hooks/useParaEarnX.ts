// frontend1/src/hooks/useParaEarnX.ts
// EarnX hooks that work with Para wallet instead of Wagmi

import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
// @ts-ignore - Para integration temporarily disabled for main app functionality
// import { useAccount, useSignMessage, useSendTransaction } from 'wagmi';

// Contract addresses for Mantle Sepolia (matching Wagmi addresses)
const CONTRACT_ADDRESSES = {
  PROTOCOL: '0xec40a9Bb73A17A9b2571A8F89D404557b6E9866A',
  USDC: '0x211a38792781b2c7a584a96F0e735d56e809fe85',
  VERIFICATION_MODULE: '0xDFe9b0627e0ec2b653FaDe125421cc32575631FC',
  INVESTMENT_MODULE: '0x742d35cC6601c13a5B5b42C3C3De4b4cbFe31e9F',
  INVOICE_NFT: '0x8b71C2e2B2E2B2E2B2E2B2E2B2E2B2E2B2E2B2E2',
  VERIFICATION: '0x9c82C3e3C3e3C3e3C3e3C3e3C3e3C3e3C3e3C3e3',
  PRICE_MANAGER: '0xAd93D4D4D4D4D4D4D4D4D4D4D4D4D4D4D4D4D4D4',
};

// USDC ABI (minimal + test functions)
const USDC_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
  // Test token functions (may not exist on all contracts)
  'function mint(address to, uint256 amount) returns (bool)',
  'function faucet() external',
  'function claim() external',
  'function drip() external',
];

// Investment Module ABI (minimal)
const INVESTMENT_ABI = [
  'function investInInvoice(uint256 invoiceId, uint256 amount) payable',
  'function getInvestmentOpportunities() view returns (tuple(uint256 id, uint256 amount, uint256 yield, string description)[])',
  'function getUserInvestments(address user) view returns (tuple(uint256 id, uint256 amount, uint256 yield)[])',
];

export function useParaEarnX() {
  // @ts-ignore - Para integration temporarily disabled for main app functionality
  // const { address, isConnected } = useAccount();
  // const { signMessageAsync } = useSignMessage();
  // const { sendTransactionAsync } = useSendTransaction();

  // Mock values for development
  const address = null;
  const isConnected = false;
  const signMessageAsync = async () => '0x' + 'a'.repeat(130);
  const sendTransactionAsync = async () => '0x' + 'b'.repeat(64);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get Para provider and signer
  const getParaProvider = useCallback(() => {
    if (!(window as any).__paraProvider) {
      throw new Error('Para provider not initialized');
    }
    return (window as any).__paraProvider.getWallet().getProvider();
  }, []);

  const getParaSigner = useCallback(async () => {
    if (!(window as any).__paraProvider) {
      throw new Error('Para provider not initialized');
    }
    return await (window as any).__paraProvider.getWallet().getSigner();
  }, []);

  // USDC Functions
  const getUSDCBalance = useCallback(async (): Promise<string> => {
    if (!isConnected || !address) {
      throw new Error('Para wallet not connected');
    }

    try {
      const provider = getParaProvider();
      const usdcContract = new ethers.Contract(CONTRACT_ADDRESSES.USDC, USDC_ABI, provider);
      
      const balance = await usdcContract.balanceOf(address);
      const decimals = await usdcContract.decimals();
      
      return ethers.utils.formatUnits(balance, decimals);
    } catch (error) {
      console.error('Failed to get USDC balance:', error);
      throw error;
    }
  }, [isConnected, address, getParaProvider]);

  const approveUSDC = useCallback(async (spender: string, amount: string): Promise<string> => {
    if (!isConnected) {
      throw new Error('Para wallet not connected');
    }

    try {
      setIsLoading(true);
      setError(null);

      const signer = await getParaSigner();
      const usdcContract = new ethers.Contract(CONTRACT_ADDRESSES.USDC, USDC_ABI, signer);
      
      // Convert amount to proper decimals
      const decimals = await usdcContract.decimals();
      const amountBN = ethers.utils.parseUnits(amount, decimals);
      
      console.log('🔐 Para approving USDC:', amount, 'to', spender);
      
      const tx = await usdcContract.approve(spender, amountBN);
      console.log('📤 Para USDC approval transaction sent:', tx.hash);
      
      await tx.wait();
      console.log('✅ Para USDC approval confirmed');
      
      return tx.hash;
    } catch (error) {
      console.error('❌ Para USDC approval failed:', error);
      setError(error instanceof Error ? error.message : 'USDC approval failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, getParaSigner]);

  const getUSDCAllowance = useCallback(async (spender: string): Promise<string> => {
    if (!isConnected || !address) {
      throw new Error('Para wallet not connected');
    }

    try {
      const provider = getParaProvider();
      const usdcContract = new ethers.Contract(CONTRACT_ADDRESSES.USDC, USDC_ABI, provider);
      
      const allowance = await usdcContract.allowance(address, spender);
      const decimals = await usdcContract.decimals();
      
      return ethers.utils.formatUnits(allowance, decimals);
    } catch (error) {
      console.error('Failed to get USDC allowance:', error);
      throw error;
    }
  }, [isConnected, address, getParaProvider]);

  // Investment Functions
  const investInInvoice = useCallback(async (invoiceId: number, amount: string): Promise<string> => {
    if (!isConnected) {
      throw new Error('Para wallet not connected');
    }

    try {
      setIsLoading(true);
      setError(null);

      const signer = await getParaSigner();
      const investmentContract = new ethers.Contract(
        CONTRACT_ADDRESSES.INVESTMENT_MODULE, 
        INVESTMENT_ABI, 
        signer
      );
      
      // Convert amount to USDC decimals
      const amountBN = ethers.utils.parseUnits(amount, 6); // USDC has 6 decimals
      
      console.log('💰 Para investing in invoice:', invoiceId, 'amount:', amount);
      
      const tx = await investmentContract.investInInvoice(invoiceId, amountBN);
      console.log('📤 Para investment transaction sent:', tx.hash);
      
      await tx.wait();
      console.log('✅ Para investment confirmed');
      
      return tx.hash;
    } catch (error) {
      console.error('❌ Para investment failed:', error);
      setError(error instanceof Error ? error.message : 'Investment failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, getParaSigner]);

  const getInvestmentOpportunities = useCallback(async () => {
    try {
      const provider = getParaProvider();
      const investmentContract = new ethers.Contract(
        CONTRACT_ADDRESSES.INVESTMENT_MODULE, 
        INVESTMENT_ABI, 
        provider
      );
      
      const opportunities = await investmentContract.getInvestmentOpportunities();
      
      return opportunities.map((opp: any) => ({
        id: opp.id.toNumber(),
        amount: ethers.utils.formatUnits(opp.amount, 6),
        yield: opp.yield.toNumber(),
        description: opp.description,
      }));
    } catch (error) {
      console.error('Failed to get investment opportunities:', error);
      throw error;
    }
  }, [getParaProvider]);

  const getUserInvestments = useCallback(async () => {
    if (!isConnected || !address) {
      throw new Error('Para wallet not connected');
    }

    try {
      const provider = getParaProvider();
      const investmentContract = new ethers.Contract(
        CONTRACT_ADDRESSES.INVESTMENT_MODULE, 
        INVESTMENT_ABI, 
        provider
      );
      
      const investments = await investmentContract.getUserInvestments(address);
      
      return investments.map((inv: any) => ({
        id: inv.id.toNumber(),
        amount: ethers.utils.formatUnits(inv.amount, 6),
        yield: inv.yield.toNumber(),
      }));
    } catch (error) {
      console.error('Failed to get user investments:', error);
      throw error;
    }
  }, [isConnected, address, getParaProvider]);

  // Submit Invoice Function
  const submitInvoice = useCallback(async (invoiceData: {
    amount: string;
    description: string;
    dueDate: number;
    metadataURI: string;
  }): Promise<string> => {
    if (!isConnected) {
      throw new Error('Para wallet not connected');
    }

    try {
      setIsLoading(true);
      setError(null);

      // For now, we'll use a simple transaction to the investment module
      // In a real implementation, this would call the invoice submission function
      const tx = await sendTransactionAsync();

      console.log('✅ Para invoice submitted:', tx);
      return tx;
    } catch (error) {
      console.error('❌ Para invoice submission failed:', error);
      setError(error instanceof Error ? error.message : 'Invoice submission failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, sendTransactionAsync]);

  // Mint Test USDC (for testing)
  const mintTestUSDC = useCallback(async (amount: string): Promise<string> => {
    if (!isConnected) {
      throw new Error('Para wallet not connected');
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('🪙 Para minting test USDC:', amount);

      // Get Para signer to interact with USDC contract
      const signer = await getParaSigner();
      const usdcContract = new ethers.Contract(CONTRACT_ADDRESSES.USDC, USDC_ABI, signer);

      // Convert amount to proper decimals (USDC has 6 decimals)
      const amountBN = ethers.utils.parseUnits(amount, 6);

      // Call mint function (assuming the test USDC has a public mint function)
      // Note: Real USDC doesn't have public mint, but test tokens often do
      const tx = await usdcContract.mint(address, amountBN);

      console.log('📤 Para USDC mint transaction sent:', tx.hash);

      // Wait for confirmation
      await tx.wait();

      console.log('✅ Para test USDC minted:', tx.hash);
      return tx.hash;
    } catch (error) {
      console.error('❌ Para test USDC minting failed:', error);

      // If mint function doesn't exist, try a faucet approach
      if (error instanceof Error && error.message.includes('mint')) {
        console.log('🔄 Mint function not available, trying faucet approach...');

        try {
          // Try calling a faucet function instead
          const signer = await getParaSigner();
          const usdcContract = new ethers.Contract(CONTRACT_ADDRESSES.USDC, [
            'function faucet() external',
            'function claim() external',
            'function drip() external',
            ...USDC_ABI
          ], signer);

          // Try different common faucet function names
          let tx;
          try {
            tx = await usdcContract.faucet();
          } catch {
            try {
              tx = await usdcContract.claim();
            } catch {
              tx = await usdcContract.drip();
            }
          }

          console.log('📤 Para USDC faucet transaction sent:', tx.hash);
          await tx.wait();
          console.log('✅ Para test USDC claimed from faucet:', tx.hash);
          return tx.hash;
        } catch (faucetError) {
          console.error('❌ Para USDC faucet also failed:', faucetError);
          setError('USDC test token not available. Please use a different test network or get USDC from a faucet.');
          throw new Error('USDC test token not available');
        }
      }

      setError(error instanceof Error ? error.message : 'Test USDC minting failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address, getParaSigner]);

  return {
    // Wallet state
    address,
    isConnected,
    isLoading,
    error,

    // USDC functions
    getUSDCBalance,
    approveUSDC,
    getUSDCAllowance,
    mintTestUSDC,

    // Investment functions
    investInInvoice,
    getInvestmentOpportunities,
    getUserInvestments,

    // Invoice functions
    submitInvoice,

    // Utility functions
    signMessage: signMessageAsync,
    sendTransaction: sendTransactionAsync,

    // Contract addresses
    contractAddresses: CONTRACT_ADDRESSES,
  };
}
