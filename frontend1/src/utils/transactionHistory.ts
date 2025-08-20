// src/utils/transactionHistory.ts - Transaction History Management
interface TransactionRecord {
  id: string;
  hash?: string;
  type: 'submit' | 'invest' | 'approve';
  status: 'pending' | 'confirmed' | 'failed' | 'ipfs_stored';
  amount?: string;
  currency?: string;
  timestamp: number;
  invoiceId?: string;
  blockNumber?: string;
  gasUsed?: string;
  description: string;
  error?: string;
}

export const saveTransactionToHistory = (
  address: string,
  transaction: Omit<TransactionRecord, 'id' | 'timestamp'>
): void => {
  try {
    const id = `${transaction.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fullTransaction: TransactionRecord = {
      ...transaction,
      id,
      timestamp: Date.now()
    };

    // Get existing history
    const historyKey = `tx_history_${address}`;
    const existingHistory = localStorage.getItem(historyKey);
    const history: TransactionRecord[] = existingHistory ? JSON.parse(existingHistory) : [];

    // Add new transaction
    history.unshift(fullTransaction); // Add to beginning

    // Keep only last 100 transactions to avoid storage bloat
    if (history.length > 100) {
      history.splice(100);
    }

    // Save back to localStorage
    localStorage.setItem(historyKey, JSON.stringify(history));

    console.log('📝 Transaction saved to history:', fullTransaction);
  } catch (error) {
    console.error('❌ Error saving transaction to history:', error);
  }
};

export const updateTransactionStatus = (
  address: string,
  transactionId: string,
  updates: Partial<Pick<TransactionRecord, 'status' | 'hash' | 'blockNumber' | 'gasUsed' | 'error'>>
): void => {
  try {
    const historyKey = `tx_history_${address}`;
    const existingHistory = localStorage.getItem(historyKey);
    
    if (!existingHistory) return;

    const history: TransactionRecord[] = JSON.parse(existingHistory);
    const transactionIndex = history.findIndex(tx => tx.id === transactionId);

    if (transactionIndex !== -1) {
      history[transactionIndex] = { ...history[transactionIndex], ...updates };
      localStorage.setItem(historyKey, JSON.stringify(history));
      console.log('📝 Transaction status updated:', transactionId, updates);
    }
  } catch (error) {
    console.error('❌ Error updating transaction status:', error);
  }
};

export const getTransactionHistory = (address: string): TransactionRecord[] => {
  try {
    const historyKey = `tx_history_${address}`;
    const existingHistory = localStorage.getItem(historyKey);
    return existingHistory ? JSON.parse(existingHistory) : [];
  } catch (error) {
    console.error('❌ Error loading transaction history:', error);
    return [];
  }
};

export const clearTransactionHistory = (address: string): void => {
  try {
    const historyKey = `tx_history_${address}`;
    localStorage.removeItem(historyKey);
    console.log('🗑️ Transaction history cleared for address:', address);
  } catch (error) {
    console.error('❌ Error clearing transaction history:', error);
  }
};