// frontend1/src/utils/testParaIntegration.ts
// Comprehensive test suite for Para integration

import { validateParaConfig } from '../config/para';
import { createParaProvider } from '../lib/para-wallet-real';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

export class ParaIntegrationTester {
  private results: TestResult[] = [];

  async runAllTests(): Promise<TestResult[]> {
    console.log('🧪 Starting Para Integration Test Suite...');
    console.log('=' .repeat(50));

    this.results = [];

    // Test 1: Environment Variables
    await this.testEnvironmentVariables();

    // Test 2: Para Configuration
    await this.testParaConfiguration();

    // Test 3: Mock SDK Initialization
    await this.testMockSDKInitialization();

    // Test 4: Wallet Connection Flow
    await this.testWalletConnectionFlow();

    // Test 5: Message Signing
    await this.testMessageSigning();

    // Test 6: Transaction Sending
    await this.testTransactionSending();

    // Test 7: Disconnect Flow
    await this.testDisconnectFlow();

    // Print Results
    this.printResults();

    return this.results;
  }

  private async testEnvironmentVariables() {
    console.log('🔧 Testing Environment Variables...');
    
    const useParaWallet = process.env.REACT_APP_USE_PARA_WALLET;
    const paraApiKey = process.env.REACT_APP_PARA_API_KEY;
    const paraEnvironment = process.env.REACT_APP_PARA_ENVIRONMENT;

    if (useParaWallet === 'true') {
      this.addResult('Environment - Para Enabled', true, 'Para wallet is enabled');
    } else {
      this.addResult('Environment - Para Enabled', false, 'Para wallet is not enabled');
    }

    if (paraApiKey && paraApiKey !== 'your-para-api-key') {
      this.addResult('Environment - API Key', true, `API key configured: ${paraApiKey.substring(0, 10)}...`);
    } else {
      this.addResult('Environment - API Key', false, 'Para API key not configured');
    }

    if (paraEnvironment) {
      this.addResult('Environment - Environment', true, `Environment set to: ${paraEnvironment}`);
    } else {
      this.addResult('Environment - Environment', false, 'Para environment not set');
    }
  }

  private async testParaConfiguration() {
    console.log('⚙️ Testing Para Configuration...');
    
    try {
      const isValid = validateParaConfig();
      if (isValid) {
        this.addResult('Configuration - Validation', true, 'Para configuration is valid');
      } else {
        this.addResult('Configuration - Validation', false, 'Para configuration validation failed');
      }
    } catch (error) {
      this.addResult('Configuration - Validation', false, `Configuration error: ${error}`);
    }
  }

  private async testMockSDKInitialization() {
    console.log('🔧 Testing Mock SDK Initialization...');
    
    try {
      const config = {
        apiKey: process.env.REACT_APP_PARA_API_KEY || 'test-key',
        environment: 'sandbox' as const,
        chains: [
          {
            id: 5003,
            name: 'Mantle Sepolia',
            rpcUrl: 'https://rpc.sepolia.mantle.xyz',
            nativeCurrency: {
              name: 'MNT',
              symbol: 'MNT',
              decimals: 18,
            },
          },
        ],
      };

      const provider = createParaProvider(config);
      const wallet = provider.getWallet();

      if (wallet) {
        this.addResult('Mock SDK - Initialization', true, 'Mock SDK initialized successfully');
        
        // Test initial state
        const isAuthenticated = await wallet.isAuthenticated();
        this.addResult('Mock SDK - Initial State', true, `Initial authentication: ${isAuthenticated}`);
      } else {
        this.addResult('Mock SDK - Initialization', false, 'Failed to initialize mock SDK');
      }
    } catch (error) {
      this.addResult('Mock SDK - Initialization', false, `SDK initialization error: ${error}`);
    }
  }

  private async testWalletConnectionFlow() {
    console.log('🔗 Testing Wallet Connection Flow...');
    
    try {
      const config = {
        apiKey: process.env.REACT_APP_PARA_API_KEY || 'test-key',
        environment: 'sandbox' as const,
        chains: [
          {
            id: 5003,
            name: 'Mantle Sepolia',
            rpcUrl: 'https://rpc.sepolia.mantle.xyz',
            nativeCurrency: {
              name: 'MNT',
              symbol: 'MNT',
              decimals: 18,
            },
          },
        ],
      };

      const provider = createParaProvider(config);
      const wallet = provider.getWallet();

      // Test authentication
      const authResult = await wallet.authenticate({
        preferredMethod: 'social',
        chains: [5003]
      });

      if (authResult.success && authResult.address) {
        this.addResult('Wallet - Connection', true, `Connected successfully: ${authResult.address}`);
        
        // Test address retrieval
        const address = await wallet.getAddress();
        this.addResult('Wallet - Address', true, `Address retrieved: ${address}`);
        
        // Test balance retrieval
        const balance = await wallet.getBalance();
        this.addResult('Wallet - Balance', true, `Balance retrieved: ${balance} MNT`);
      } else {
        this.addResult('Wallet - Connection', false, 'Failed to connect wallet');
      }
    } catch (error) {
      this.addResult('Wallet - Connection', false, `Connection error: ${error}`);
    }
  }

  private async testMessageSigning() {
    console.log('✍️ Testing Message Signing...');
    
    try {
      const config = {
        apiKey: process.env.REACT_APP_PARA_API_KEY || 'test-key',
        environment: 'sandbox' as const,
        chains: [
          {
            id: 5003,
            name: 'Mantle Sepolia',
            rpcUrl: 'https://rpc.sepolia.mantle.xyz',
            nativeCurrency: {
              name: 'MNT',
              symbol: 'MNT',
              decimals: 18,
            },
          },
        ],
      };

      const provider = createParaProvider(config);
      const wallet = provider.getWallet();

      // Connect first
      await wallet.authenticate({ preferredMethod: 'social' });

      // Test message signing
      const testMessage = 'Hello from EarnX Para Integration Test!';
      const signature = await wallet.signMessage(testMessage);

      if (signature && signature.startsWith('0x') && signature.length === 132) {
        this.addResult('Wallet - Message Signing', true, `Message signed successfully: ${signature.substring(0, 20)}...`);
      } else {
        this.addResult('Wallet - Message Signing', false, 'Invalid signature format');
      }
    } catch (error) {
      this.addResult('Wallet - Message Signing', false, `Signing error: ${error}`);
    }
  }

  private async testTransactionSending() {
    console.log('📤 Testing Transaction Sending...');
    
    try {
      const config = {
        apiKey: process.env.REACT_APP_PARA_API_KEY || 'test-key',
        environment: 'sandbox' as const,
        chains: [
          {
            id: 5003,
            name: 'Mantle Sepolia',
            rpcUrl: 'https://rpc.sepolia.mantle.xyz',
            nativeCurrency: {
              name: 'MNT',
              symbol: 'MNT',
              decimals: 18,
            },
          },
        ],
      };

      const provider = createParaProvider(config);
      const wallet = provider.getWallet();

      // Connect first
      await wallet.authenticate({ preferredMethod: 'social' });

      // Test transaction sending
      const testTx = {
        to: '0x742d35cC6601c13a5B5b42C3C3De4b4cbFe31e9F',
        value: '0x0',
        data: '0x',
      };

      const txHash = await wallet.sendTransaction(testTx);

      if (txHash && txHash.startsWith('0x') && txHash.length === 66) {
        this.addResult('Wallet - Transaction', true, `Transaction sent successfully: ${txHash.substring(0, 20)}...`);
      } else {
        this.addResult('Wallet - Transaction', false, 'Invalid transaction hash format');
      }
    } catch (error) {
      this.addResult('Wallet - Transaction', false, `Transaction error: ${error}`);
    }
  }

  private async testDisconnectFlow() {
    console.log('👋 Testing Disconnect Flow...');
    
    try {
      const config = {
        apiKey: process.env.REACT_APP_PARA_API_KEY || 'test-key',
        environment: 'sandbox' as const,
        chains: [
          {
            id: 5003,
            name: 'Mantle Sepolia',
            rpcUrl: 'https://rpc.sepolia.mantle.xyz',
            nativeCurrency: {
              name: 'MNT',
              symbol: 'MNT',
              decimals: 18,
            },
          },
        ],
      };

      const provider = createParaProvider(config);
      const wallet = provider.getWallet();

      // Connect first
      await wallet.authenticate({ preferredMethod: 'social' });

      // Test disconnect
      await wallet.logout();

      // Verify disconnection
      const isAuthenticated = await wallet.isAuthenticated();
      if (!isAuthenticated) {
        this.addResult('Wallet - Disconnect', true, 'Wallet disconnected successfully');
      } else {
        this.addResult('Wallet - Disconnect', false, 'Wallet still connected after logout');
      }
    } catch (error) {
      this.addResult('Wallet - Disconnect', false, `Disconnect error: ${error}`);
    }
  }

  private addResult(name: string, passed: boolean, message: string, details?: any) {
    this.results.push({ name, passed, message, details });
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${name}: ${message}`);
  }

  private printResults() {
    console.log('\n' + '=' .repeat(50));
    console.log('🧪 Para Integration Test Results');
    console.log('=' .repeat(50));

    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const percentage = Math.round((passed / total) * 100);

    console.log(`📊 Overall: ${passed}/${total} tests passed (${percentage}%)`);
    
    if (passed === total) {
      console.log('🎉 All tests passed! Para integration is working correctly.');
    } else {
      console.log('⚠️ Some tests failed. Check the results above for details.');
    }

    console.log('\n📋 Test Summary:');
    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.name}`);
    });
  }
}

// Export test runner function
export async function runParaIntegrationTests(): Promise<TestResult[]> {
  const tester = new ParaIntegrationTester();
  return await tester.runAllTests();
}

// Add to window for easy browser console testing
if (typeof window !== 'undefined') {
  (window as any).testParaIntegration = runParaIntegrationTests;
}
