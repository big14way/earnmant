// frontend1/src/components/test/ParaIntegrationTest.tsx
// Test component to verify Para integration works
import React, { useState } from 'react';
import { ParaConnectButton } from '../wallet/ParaConnectButton';
// @ts-ignore - Para integration temporarily disabled for main app functionality
// import { useAccount, useSignMessage, useSendTransaction } from 'wagmi';
import { runParaIntegrationTests } from '../../utils/testParaIntegration';
import { Shield, Zap, CheckCircle, AlertCircle, Wallet, Play } from 'lucide-react';

export function ParaIntegrationTest() {
  // @ts-ignore - Para integration temporarily disabled for main app functionality
  // const { address, isConnected } = useAccount();
  // const { signMessageAsync } = useSignMessage();
  // const { sendTransactionAsync } = useSendTransaction();

  // Temporary mock values for development
  const address = '0x1234567890123456789012345678901234567890';
  const isConnected = false;
  
  const [testResults, setTestResults] = useState<{
    signMessage?: boolean;
    sendTransaction?: boolean;
    integrationTests?: any[];
  }>({});

  const [isTestingSignMessage, setIsTestingSignMessage] = useState(false);
  const [isTestingTransaction, setIsTestingTransaction] = useState(false);
  const [isRunningIntegrationTests, setIsRunningIntegrationTests] = useState(false);

  const testSignMessage = async () => {
    if (!isConnected) return;

    setIsTestingSignMessage(true);
    try {
      // Mock signature for development
      const signature = '0x' + 'a'.repeat(130);
      console.log('✅ Sign message test successful (mocked):', signature);
      setTestResults(prev => ({ ...prev, signMessage: true }));
    } catch (error) {
      console.error('❌ Sign message test failed:', error);
      setTestResults(prev => ({ ...prev, signMessage: false }));
    } finally {
      setIsTestingSignMessage(false);
    }
  };

  const testSendTransaction = async () => {
    if (!isConnected) return;

    setIsTestingTransaction(true);
    try {
      // Mock transaction hash for development
      const txHash = '0x' + 'b'.repeat(64);
      console.log('✅ Send transaction test successful (mocked):', txHash);
      setTestResults(prev => ({ ...prev, sendTransaction: true }));
    } catch (error) {
      console.error('❌ Send transaction test failed:', error);
      setTestResults(prev => ({ ...prev, sendTransaction: false }));
    } finally {
      setIsTestingTransaction(false);
    }
  };

  const runFullIntegrationTests = async () => {
    setIsRunningIntegrationTests(true);
    try {
      console.log('🧪 Running full Para integration test suite...');
      const results = await runParaIntegrationTests();
      setTestResults(prev => ({ ...prev, integrationTests: results }));

      const passed = results.filter(r => r.passed).length;
      const total = results.length;
      console.log(`✅ Integration tests completed: ${passed}/${total} passed`);
    } catch (error) {
      console.error('❌ Integration tests failed:', error);
    } finally {
      setIsRunningIntegrationTests(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Shield className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Para Integration Test</h1>
          <Zap className="w-8 h-8 text-purple-600" />
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Test the Para wallet integration for EarnX. This demonstrates social login, 
          MPC security, and seamless transaction signing.
        </p>
      </div>

      {/* Connection Status */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Connection Status</h2>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
            isConnected 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`} />
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>

        {isConnected ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/70 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Wallet Address</div>
                <div className="font-mono text-sm text-gray-900 break-all">
                  {address}
                </div>
              </div>
              <div className="bg-white/70 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Balance</div>
                <div className="font-semibold text-gray-900">
                  Connected
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span>Para wallet connected successfully with MPC security</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-6">Connect your Para wallet to test the integration</p>
            <ParaConnectButton 
              label="Connect Para Wallet"
              size="lg"
              variant="primary"
            />
          </div>
        )}
      </div>

      {/* Feature Tests */}
      {isConnected && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sign Message Test */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Sign Message</h3>
              {testResults.signMessage !== undefined && (
                <div className={`flex items-center gap-1 text-sm ${
                  testResults.signMessage ? 'text-green-600' : 'text-red-600'
                }`}>
                  {testResults.signMessage ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  {testResults.signMessage ? 'Passed' : 'Failed'}
                </div>
              )}
            </div>
            
            <p className="text-gray-600 text-sm mb-4">
              Test Para's message signing capability with MPC security.
            </p>
            
            <button
              onClick={testSignMessage}
              disabled={isTestingSignMessage}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isTestingSignMessage ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Test Sign Message</span>
                </>
              )}
            </button>
          </div>

          {/* Send Transaction Test */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Send Transaction</h3>
              {testResults.sendTransaction !== undefined && (
                <div className={`flex items-center gap-1 text-sm ${
                  testResults.sendTransaction ? 'text-green-600' : 'text-red-600'
                }`}>
                  {testResults.sendTransaction ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  {testResults.sendTransaction ? 'Passed' : 'Failed'}
                </div>
              )}
            </div>
            
            <p className="text-gray-600 text-sm mb-4">
              Test Para's transaction sending with account abstraction.
            </p>
            
            <button
              onClick={testSendTransaction}
              disabled={isTestingTransaction}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isTestingTransaction ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Test Transaction</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Full Integration Test */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Full Integration Test</h3>
          {testResults.integrationTests && (
            <div className="text-sm text-gray-600">
              {testResults.integrationTests.filter(r => r.passed).length}/{testResults.integrationTests.length} passed
            </div>
          )}
        </div>

        <p className="text-gray-600 text-sm mb-4">
          Run comprehensive tests for all Para integration components including environment, configuration, SDK, and wallet functionality.
        </p>

        <button
          onClick={runFullIntegrationTests}
          disabled={isRunningIntegrationTests}
          className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 mb-4"
        >
          {isRunningIntegrationTests ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Running Tests...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Run Full Test Suite</span>
            </>
          )}
        </button>

        {testResults.integrationTests && (
          <div className="bg-white/70 rounded-lg p-4 max-h-60 overflow-y-auto">
            <div className="space-y-2">
              {testResults.integrationTests.map((result, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{result.name}</span>
                  <div className="flex items-center gap-2">
                    {result.passed ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className={result.passed ? 'text-green-600' : 'text-red-600'}>
                      {result.passed ? 'Pass' : 'Fail'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Para Features */}
      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl p-6 border border-emerald-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Para Features Enabled</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Shield className="w-4 h-4 text-green-500" />
            <span>MPC Security</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Zap className="w-4 h-4 text-blue-500" />
            <span>Account Abstraction</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <CheckCircle className="w-4 h-4 text-purple-500" />
            <span>Social Login</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Wallet className="w-4 h-4 text-emerald-500" />
            <span>Gasless Ready</span>
          </div>
        </div>
      </div>

      {/* Integration Info */}
      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Integration Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">API Key:</span>
            <span className="ml-2 text-gray-600 font-mono">
              {process.env.REACT_APP_PARA_API_KEY?.substring(0, 10)}...
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Environment:</span>
            <span className="ml-2 text-gray-600">
              {process.env.REACT_APP_PARA_ENVIRONMENT || 'sandbox'}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Chain:</span>
            <span className="ml-2 text-gray-600">Mantle Sepolia (5003)</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Status:</span>
            <span className="ml-2 text-green-600 font-medium">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
