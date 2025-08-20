// components/ui/TransactionNotification.tsx - Transaction Status Notifications
import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  ExternalLink, 
  Copy,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Hash } from 'viem';
import { formatTxHash, getMantleExplorerUrl } from '../../utils/transactionUtils';

interface TransactionNotificationProps {
  hash?: Hash;
  status: 'pending' | 'confirmed' | 'failed';
  type: 'submit' | 'invest' | 'approve';
  amount?: string;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}

export const TransactionNotification: React.FC<TransactionNotificationProps> = ({
  hash,
  status,
  type,
  amount,
  onClose,
  autoClose = true,
  duration = 5000
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (autoClose && (status === 'confirmed' || status === 'failed') && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, status, duration, onClose]);

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />;
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return 'border-yellow-200 bg-yellow-50';
      case 'confirmed':
        return 'border-green-200 bg-green-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getTitle = () => {
    const typeMap = {
      submit: 'Invoice Submission',
      invest: 'Investment',
      approve: 'USDC Approval'
    };
    
    const statusMap = {
      pending: 'Processing',
      confirmed: 'Successful',
      failed: 'Failed'
    };

    return `${typeMap[type]} ${statusMap[status]}`;
  };

  const getMessage = () => {
    switch (status) {
      case 'pending':
        return 'Transaction submitted to blockchain. Please wait for confirmation...';
      case 'confirmed':
        return `Transaction confirmed successfully! ${amount ? `Amount: ${amount}` : ''}`;
      case 'failed':
        return 'Transaction failed. Please try again or contact support.';
      default:
        return 'Processing transaction...';
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const openExplorer = () => {
    if (hash) {
      window.open(getMantleExplorerUrl(hash), '_blank');
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md w-full transform transition-all duration-300 ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className={`border rounded-lg p-4 shadow-lg ${getStatusColor()}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <h3 className="font-semibold text-gray-900">{getTitle()}</h3>
          </div>
          {onClose && (
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => onClose(), 300);
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Message */}
        <p className="text-sm text-gray-700 mb-3">
          {getMessage()}
        </p>

        {/* Transaction Hash */}
        {hash && (
          <div className="bg-white bg-opacity-50 rounded p-2 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Transaction Hash:</span>
              <div className="flex items-center space-x-1">
                <code className="text-xs font-mono text-gray-800">
                  {formatTxHash(hash)}
                </code>
                <button
                  onClick={() => copyToClipboard(hash)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="Copy full hash"
                >
                  <Copy className="w-3 h-3 text-gray-500" />
                </button>
              </div>
            </div>
            {copied && (
              <div className="text-xs text-green-600 mt-1">Copied to clipboard!</div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {status === 'pending' && (
              <div className="flex items-center space-x-1 text-xs text-yellow-600">
                <Clock className="w-3 h-3" />
                <span>Waiting for confirmation...</span>
              </div>
            )}
            {status === 'confirmed' && (
              <div className="text-xs text-green-600">
                ✅ Confirmed on Mantle Sepolia
              </div>
            )}
            {status === 'failed' && (
              <div className="text-xs text-red-600">
                ❌ Transaction failed
              </div>
            )}
          </div>

          {hash && (
            <button
              onClick={openExplorer}
              className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              <span>View on Explorer</span>
            </button>
          )}
        </div>

        {/* Progress bar for pending transactions */}
        {status === 'pending' && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div className="bg-yellow-500 h-1 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Transaction notification manager component
interface TransactionManagerProps {
  children: React.ReactNode;
}

export const TransactionNotificationManager: React.FC<TransactionManagerProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    hash?: Hash;
    status: 'pending' | 'confirmed' | 'failed';
    type: 'submit' | 'invest' | 'approve';
    amount?: string;
  }>>([]);

  const addNotification = (notification: Omit<typeof notifications[0], 'id'>) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { ...notification, id }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Expose methods globally for easy access
  useEffect(() => {
    (window as any).addTransactionNotification = addNotification;
    return () => {
      delete (window as any).addTransactionNotification;
    };
  }, []);

  return (
    <>
      {children}
      {notifications.map((notification) => (
        <TransactionNotification
          key={notification.id}
          hash={notification.hash}
          status={notification.status}
          type={notification.type}
          amount={notification.amount}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </>
  );
};

export default TransactionNotification;
