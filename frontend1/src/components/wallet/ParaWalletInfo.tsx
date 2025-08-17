// frontend1/src/components/wallet/ParaWalletInfo.tsx
// Information component for Para wallet integration via WalletConnect

import React from 'react';

interface ParaWalletInfoProps {
  className?: string;
}

export const ParaWalletInfo: React.FC<ParaWalletInfoProps> = ({ 
  className = '' 
}) => {
  return (
    <div className={`bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white text-lg font-bold">P</span>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            🚀 Para WalletConnect Kit
          </h3>
          <p className="text-gray-700 mb-4">
            Experience Para's official WalletConnect Kit integration with optimized connection flow,
            MPC-powered security, and seamless dApp interaction. No seed phrases, enterprise-grade protection.
          </p>
          
          <div className="bg-white rounded-lg p-4 mb-4 border border-blue-100">
            <h4 className="font-medium text-gray-900 mb-3">Para WalletConnect Kit Connection:</h4>
            <ol className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">1</span>
                <span>Click "Connect Para Wallet" button (optimized for Para)</span>
              </li>
              <li className="flex items-start">
                <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">2</span>
                <span>Para WalletConnect modal opens automatically</span>
              </li>
              <li className="flex items-start">
                <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">3</span>
                <span>Scan QR code with Para wallet or use deep linking</span>
              </li>
              <li className="flex items-start">
                <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">4</span>
                <span>Enjoy seamless MPC-secured transactions!</span>
              </li>
            </ol>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2 text-green-700">
              <span>✅</span>
              <span>MPC Security</span>
            </div>
            <div className="flex items-center space-x-2 text-green-700">
              <span>✅</span>
              <span>Official WalletConnect Kit</span>
            </div>
            <div className="flex items-center space-x-2 text-green-700">
              <span>✅</span>
              <span>No Seed Phrases</span>
            </div>
            <div className="flex items-center space-x-2 text-green-700">
              <span>✅</span>
              <span>Enterprise Grade</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Learn more about Para wallet
              </div>
              <a 
                href="https://getpara.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
              >
                Visit getpara.com →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParaWalletInfo;
