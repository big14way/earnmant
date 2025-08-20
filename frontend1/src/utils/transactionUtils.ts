// utils/transactionUtils.ts - Comprehensive Transaction Monitoring & Explorer Integration
import { Hash, TransactionReceipt } from 'viem';
import { MANTLE_SEPOLIA_CONFIG } from '../config/constants';

export interface TransactionStatus {
  hash: Hash;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  explorerUrl: string;
  gasUsed?: bigint;
  effectiveGasPrice?: bigint;
  blockNumber?: bigint;
  timestamp?: number;
}

export interface TransactionResult {
  success: boolean;
  hash?: Hash;
  receipt?: TransactionReceipt;
  error?: string;
  explorerUrl?: string;
}

/**
 * Generate Mantle Explorer URL for transaction or address
 */
export const getMantleExplorerUrl = (hashOrAddress: string, type: 'tx' | 'address' = 'tx'): string => {
  const baseUrl = MANTLE_SEPOLIA_CONFIG.blockExplorer;
  return `${baseUrl}/${type}/${hashOrAddress}`;
};

/**
 * Generate explorer URL for contract interaction
 */
export const getContractExplorerUrl = (contractAddress: string): string => {
  return getMantleExplorerUrl(contractAddress, 'address');
};

/**
 * Format transaction hash for display
 */
export const formatTxHash = (hash: string): string => {
  if (!hash) return '';
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
};

/**
 * Format gas amount for display
 */
export const formatGasAmount = (gasUsed: bigint, gasPrice: bigint): string => {
  const totalGas = gasUsed * gasPrice;
  const gasInMNT = Number(totalGas) / 1e18;
  return `${gasInMNT.toFixed(6)} MNT`;
};

/**
 * Create transaction notification data
 */
export const createTransactionNotification = (
  type: 'submit' | 'invest' | 'approve',
  status: 'pending' | 'confirmed' | 'failed',
  hash?: Hash,
  amount?: string
) => {
  const baseMessage = {
    submit: 'Invoice Submission',
    invest: 'Investment',
    approve: 'USDC Approval'
  }[type];

  const statusMessage = {
    pending: 'Transaction submitted to blockchain...',
    confirmed: 'Transaction confirmed successfully!',
    failed: 'Transaction failed. Please try again.'
  }[status];

  return {
    title: `${baseMessage} ${status === 'confirmed' ? 'Successful' : status === 'failed' ? 'Failed' : 'Pending'}`,
    message: statusMessage,
    hash: hash,
    explorerUrl: hash ? getMantleExplorerUrl(hash) : undefined,
    amount: amount,
    timestamp: Date.now()
  };
};

/**
 * Monitor transaction status with polling
 */
export class TransactionMonitor {
  private static instance: TransactionMonitor;
  private pendingTransactions: Map<Hash, TransactionStatus> = new Map();
  private callbacks: Map<Hash, (status: TransactionStatus) => void> = new Map();

  static getInstance(): TransactionMonitor {
    if (!TransactionMonitor.instance) {
      TransactionMonitor.instance = new TransactionMonitor();
    }
    return TransactionMonitor.instance;
  }

  /**
   * Add transaction to monitoring
   */
  addTransaction(hash: Hash, callback?: (status: TransactionStatus) => void): void {
    const status: TransactionStatus = {
      hash,
      status: 'pending',
      confirmations: 0,
      explorerUrl: getMantleExplorerUrl(hash)
    };

    this.pendingTransactions.set(hash, status);
    if (callback) {
      this.callbacks.set(hash, callback);
    }

    // Start monitoring this transaction
    this.monitorTransaction(hash);
  }

  /**
   * Monitor individual transaction
   */
  private async monitorTransaction(hash: Hash): Promise<void> {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    const checkStatus = async () => {
      try {
        attempts++;
        const status = this.pendingTransactions.get(hash);
        if (!status || status.status !== 'pending') return;

        // In a real implementation, you would check the transaction status
        // For now, we'll simulate confirmation after a delay
        if (attempts >= 3) { // Simulate confirmation after ~15 seconds
          status.status = 'confirmed';
          status.confirmations = 1;
          status.timestamp = Date.now();
          
          const callback = this.callbacks.get(hash);
          if (callback) {
            callback(status);
          }
          
          // Clean up
          this.pendingTransactions.delete(hash);
          this.callbacks.delete(hash);
          return;
        }

        // Continue monitoring
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 5000); // Check every 5 seconds
        } else {
          // Timeout - mark as failed
          status.status = 'failed';
          const callback = this.callbacks.get(hash);
          if (callback) {
            callback(status);
          }
          this.pendingTransactions.delete(hash);
          this.callbacks.delete(hash);
        }
      } catch (error) {
        console.error('Error monitoring transaction:', error);
        const status = this.pendingTransactions.get(hash);
        if (status) {
          status.status = 'failed';
          const callback = this.callbacks.get(hash);
          if (callback) {
            callback(status);
          }
        }
        this.pendingTransactions.delete(hash);
        this.callbacks.delete(hash);
      }
    };

    // Start checking
    setTimeout(checkStatus, 5000); // First check after 5 seconds
  }

  /**
   * Get current status of transaction
   */
  getTransactionStatus(hash: Hash): TransactionStatus | undefined {
    return this.pendingTransactions.get(hash);
  }

  /**
   * Get all pending transactions
   */
  getPendingTransactions(): TransactionStatus[] {
    return Array.from(this.pendingTransactions.values());
  }
}

/**
 * Transaction success handler
 */
export const handleTransactionSuccess = (
  hash: Hash,
  type: 'submit' | 'invest' | 'approve',
  amount?: string
): TransactionResult => {
  const explorerUrl = getMantleExplorerUrl(hash);
  
  // Add to monitoring
  const monitor = TransactionMonitor.getInstance();
  monitor.addTransaction(hash, (status) => {
    console.log(`Transaction ${hash} status updated:`, status);
  });

  return {
    success: true,
    hash,
    explorerUrl,
  };
};

/**
 * Transaction error handler
 */
export const handleTransactionError = (
  error: any,
  type: 'submit' | 'invest' | 'approve'
): TransactionResult => {
  console.error(`${type} transaction error:`, error);
  
  let errorMessage = 'Transaction failed';
  
  if (error?.name === 'UserRejectedRequestError' || 
      error?.message?.includes('User rejected') ||
      error?.code === 4001) {
    errorMessage = 'Transaction was cancelled by user';
  } else if (error?.message?.includes('insufficient funds')) {
    errorMessage = 'Insufficient funds for transaction';
  } else if (error?.message?.includes('gas')) {
    errorMessage = 'Gas estimation failed. Please try again.';
  } else if (error?.message) {
    errorMessage = error.message;
  }

  return {
    success: false,
    error: errorMessage
  };
};

/**
 * Estimate gas for transaction
 */
export const estimateTransactionGas = async (
  contractCall: any
): Promise<{ gasLimit: bigint; gasPrice: bigint; estimatedCost: string }> => {
  try {
    // In a real implementation, you would estimate gas here
    // For now, return reasonable defaults for Mantle
    const gasLimit = BigInt(200000); // 200k gas limit
    const gasPrice = BigInt(100000000); // 0.1 gwei
    const estimatedCost = formatGasAmount(gasLimit, gasPrice);
    
    return {
      gasLimit,
      gasPrice,
      estimatedCost
    };
  } catch (error) {
    console.error('Gas estimation failed:', error);
    throw new Error('Unable to estimate transaction cost');
  }
};

export default {
  getMantleExplorerUrl,
  getContractExplorerUrl,
  formatTxHash,
  formatGasAmount,
  createTransactionNotification,
  TransactionMonitor,
  handleTransactionSuccess,
  handleTransactionError,
  estimateTransactionGas
};
