// src/components/pages/TransactionHistory.tsx - Transaction History Page
import React, { useState, useEffect } from 'react';
import {
  Clock, CheckCircle, XCircle, ExternalLink, Filter, Search, Calendar,
  ArrowUpDown, TrendingUp, FileText, DollarSign, RefreshCw, Eye,
  Copy, AlertTriangle, Award, Zap, Users
} from 'lucide-react';
import { useEarnX } from '../../hooks/useEarnX';
import { getMantleExplorerUrl } from '../../utils/transactionUtils';

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

export const TransactionHistory: React.FC = () => {
  const { isConnected, address } = useEarnX();
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'failed' | 'ipfs_stored'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'submit' | 'invest' | 'approve'>('all');
  const [sortBy, setSortBy] = useState<'timestamp' | 'amount' | 'status'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [copied, setCopied] = useState<string | null>(null);

  // Load transaction history from localStorage and blockchain
  useEffect(() => {
    loadTransactionHistory();
  }, [address, isConnected]);

  // Filter and sort transactions
  useEffect(() => {
    let filtered = transactions;

    // Apply filters
    if (statusFilter !== 'all') {
      filtered = filtered.filter(tx => tx.status === statusFilter);
    }
    if (typeFilter !== 'all') {
      filtered = filtered.filter(tx => tx.type === typeFilter);
    }
    if (searchTerm) {
      filtered = filtered.filter(tx => 
        tx.hash?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.invoiceId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortBy) {
        case 'timestamp':
          aVal = a.timestamp;
          bVal = b.timestamp;
          break;
        case 'amount':
          aVal = parseFloat(a.amount || '0');
          bVal = parseFloat(b.amount || '0');
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        default:
          aVal = a.timestamp;
          bVal = b.timestamp;
      }

      if (sortOrder === 'desc') {
        return bVal > aVal ? 1 : -1;
      } else {
        return aVal > bVal ? 1 : -1;
      }
    });

    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, statusFilter, typeFilter, sortBy, sortOrder]);

  const loadTransactionHistory = async () => {
    if (!address) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Load from localStorage
      const localTxHistory = localStorage.getItem(`tx_history_${address}`);
      const localTxs: TransactionRecord[] = localTxHistory ? JSON.parse(localTxHistory) : [];

      // Load demo invoices (submitted invoices)
      const demoInvoices = localStorage.getItem('demo_invoices');
      if (demoInvoices) {
        const invoices = JSON.parse(demoInvoices);
        Object.values(invoices).forEach((invoice: any) => {
          if (invoice.supplier?.toLowerCase() === address.toLowerCase()) {
            const existingTx = localTxs.find(tx => tx.invoiceId === invoice.id);
            if (!existingTx) {
              localTxs.push({
                id: `submit-${invoice.id}`,
                hash: invoice.txHash,
                type: 'submit',
                status: invoice.status === 'Verified' ? 'confirmed' : invoice.status === 'Failed' ? 'failed' : 'pending',
                amount: invoice.amount,
                currency: 'USDC',
                timestamp: invoice.timestamp || invoice.createdAt,
                invoiceId: invoice.id,
                blockNumber: invoice.blockNumber?.toString(),
                description: `Submitted ${invoice.commodity} invoice for ${invoice.amount} USDC`,
              });
            }
          }
        });
      }

      // Load portfolio investments
      const portfolio = localStorage.getItem(`portfolio_${address}`);
      if (portfolio) {
        const portfolioData = JSON.parse(portfolio);
        portfolioData.investments?.forEach((investment: any) => {
          const existingTx = localTxs.find(tx => tx.id === `invest-${investment.id}`);
          if (!existingTx) {
            localTxs.push({
              id: `invest-${investment.id}`,
              type: 'invest',
              status: 'confirmed',
              amount: investment.amountInvested,
              currency: 'USDC',
              timestamp: investment.investmentDate,
              invoiceId: investment.invoiceId,
              description: `Invested ${investment.amountInvested} USDC in Invoice ${investment.invoiceId}`,
            });
          }
        });
      }

      // Sort by timestamp (newest first)
      localTxs.sort((a, b) => b.timestamp - a.timestamp);

      setTransactions(localTxs);
    } catch (error) {
      console.error('Error loading transaction history:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshHistory = () => {
    loadTransactionHistory();
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'ipfs_stored':
        return <FileText className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'ipfs_stored':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'submit':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'invest':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'approve':
        return <CheckCircle className="w-4 h-4 text-purple-500" />;
      default:
        return <Zap className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatAmount = (amount?: string, currency?: string) => {
    if (!amount) return 'N/A';
    return `${parseFloat(amount).toLocaleString()} ${currency || 'USDC'}`;
  };

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Your Wallet</h3>
          <p className="text-gray-600">
            Please connect your wallet to view your transaction history.
          </p>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Transaction History</h1>
            <p className="text-gray-600">
              Track all your blockchain transactions and submissions
            </p>
          </div>
          <button
            onClick={refreshHistory}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by hash, invoice ID, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="failed">Failed</option>
            <option value="ipfs_stored">IPFS Stored</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="submit">Submissions</option>
            <option value="invest">Investments</option>
            <option value="approve">Approvals</option>
          </select>

          {/* Sort */}
          <select
            value={`${sortBy}_${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('_');
              setSortBy(field as any);
              setSortOrder(order as any);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="timestamp_desc">Newest First</option>
            <option value="timestamp_asc">Oldest First</option>
            <option value="amount_desc">Highest Amount</option>
            <option value="amount_asc">Lowest Amount</option>
            <option value="status_asc">Status A-Z</option>
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
            </div>
            <Zap className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Confirmed</p>
              <p className="text-2xl font-bold text-green-600">
                {transactions.filter(tx => tx.status === 'confirmed' || tx.status === 'ipfs_stored').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {transactions.filter(tx => tx.status === 'pending').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Volume</p>
              <p className="text-2xl font-bold text-gray-900">
                {transactions.reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0).toLocaleString()} USDC
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Transaction List */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading transaction history...</p>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions Found</h3>
          <p className="text-gray-600">
            {transactions.length === 0 
              ? "You haven't made any transactions yet. Start by submitting an invoice or making an investment!"
              : "No transactions match your current filters."
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type & Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction Hash
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        {getTypeIcon(tx.type)}
                        <div>
                          <div className="text-sm font-medium text-gray-900 capitalize">
                            {tx.type}
                          </div>
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(tx.status)}`}>
                            {getStatusIcon(tx.status)}
                            <span className="ml-1 capitalize">{tx.status}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{tx.description}</div>
                      {tx.invoiceId && (
                        <div className="text-xs text-gray-500">Invoice: {tx.invoiceId}</div>
                      )}
                      {tx.error && (
                        <div className="text-xs text-red-600 mt-1">{tx.error}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatAmount(tx.amount, tx.currency)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(tx.timestamp)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {tx.hash ? (
                        <div className="flex items-center space-x-2">
                          <code className="text-xs font-mono text-gray-600">
                            {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                          </code>
                          <button
                            onClick={() => copyToClipboard(tx.hash!, `hash-${tx.id}`)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="Copy hash"
                          >
                            <Copy className="w-3 h-3 text-gray-500" />
                          </button>
                          {copied === `hash-${tx.id}` && (
                            <span className="text-xs text-green-600">Copied!</span>
                          )}
                          {/* Show demo indicator for mock hashes */}
                          {tx.hash.startsWith('0x0') || (tx.hash.length === 66 && !tx.blockNumber) ? (
                            <span className="text-xs bg-orange-100 text-orange-800 px-1 rounded">Demo</span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">No hash</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {tx.hash && !tx.hash.startsWith('0x0') && tx.blockNumber ? (
                        <a
                          href={getMantleExplorerUrl(tx.hash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900 inline-flex items-center space-x-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Explorer</span>
                        </a>
                      ) : tx.hash ? (
                        <span className="text-xs text-gray-500 inline-flex items-center space-x-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Demo Tx</span>
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;