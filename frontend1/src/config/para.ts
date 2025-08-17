// frontend1/src/config/para.ts
// Para Wallet Configuration for EarnX

export const PARA_CONFIG = {
  // API Configuration
  apiKey: process.env.REACT_APP_PARA_API_KEY || 'beta_5559b242f9faff75369ef8a42a9aeddf',
  environment: (process.env.REACT_APP_PARA_ENVIRONMENT as 'production' | 'sandbox') || 'sandbox',
  
  // Supported Chains
  chains: [
    {
      id: 5003, // Mantle Sepolia
      name: 'Mantle Sepolia',
      rpcUrl: 'https://rpc.sepolia.mantle.xyz',
      blockExplorer: 'https://explorer.sepolia.mantle.xyz',
      nativeCurrency: {
        name: 'Mantle Token',
        symbol: 'MNT',
        decimals: 18,
      },
      testnet: true,
    },
    // Future chains can be added here
    // {
    //   id: 5000, // Mantle Mainnet
    //   name: 'Mantle',
    //   rpcUrl: 'https://rpc.mantle.xyz',
    //   blockExplorer: 'https://explorer.mantle.xyz',
    //   nativeCurrency: {
    //     name: 'Mantle Token',
    //     symbol: 'MNT',
    //     decimals: 18,
    //   },
    //   testnet: false,
    // },
  ],

  // UI Theme Configuration
  theme: {
    primaryColor: '#3B82F6', // EarnX blue
    secondaryColor: '#8B5CF6', // EarnX purple
    accentColor: '#10B981', // EarnX emerald
    borderRadius: '12px',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    mode: 'light' as const,
  },

  // Authentication Methods
  socialLogins: [
    'google',    // Primary for African users
    'email',     // Fallback option
    'apple',     // iOS users
    'twitter',   // Social media users
  ] as const,

  // Feature Flags
  features: {
    enablePasskeys: process.env.REACT_APP_ENABLE_PASSKEYS !== 'false',
    enableAccountAbstraction: process.env.REACT_APP_ENABLE_ACCOUNT_ABSTRACTION === 'true',
    enableGaslessTransactions: process.env.REACT_APP_ENABLE_GASLESS_TRANSACTIONS === 'true',
    enableSocialRecovery: true,
    enableMultiDevice: true,
    enableBiometrics: true,
  },

  // Gasless Transaction Configuration
  gasless: {
    enabled: process.env.REACT_APP_ENABLE_GASLESS_TRANSACTIONS === 'true',
    sponsorAddress: process.env.REACT_APP_GAS_SPONSOR_ADDRESS,
    maxGasLimit: '500000',
    supportedOperations: [
      'approve',
      'transfer',
      'investInInvoice',
      'submitInvoice',
    ],
  },

  // Security Configuration
  security: {
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    requireBiometrics: false, // Optional for better UX
    enableDeviceBinding: true,
    allowMultipleSessions: true,
  },

  // Localization
  localization: {
    defaultLanguage: 'en',
    supportedLanguages: [
      'en', // English
      'fr', // French (West Africa)
      'sw', // Swahili (East Africa)
      'ha', // Hausa (Nigeria)
      'am', // Amharic (Ethiopia)
    ],
  },

  // Mobile Configuration
  mobile: {
    enablePWA: true,
    enablePushNotifications: true,
    enableOfflineMode: true,
    enableDeepLinking: true,
  },

  // Analytics & Monitoring
  analytics: {
    enabled: process.env.NODE_ENV === 'production',
    trackUserActions: true,
    trackErrors: true,
    trackPerformance: true,
  },

  // Development Configuration
  development: {
    enableDebugMode: process.env.NODE_ENV === 'development',
    enableTestMode: process.env.REACT_APP_PARA_ENVIRONMENT === 'sandbox',
    mockTransactions: false,
    verboseLogging: process.env.NODE_ENV === 'development',
  },
};

// Para SDK Initialization Options
export const PARA_INIT_OPTIONS = {
  ...PARA_CONFIG,
  
  // Callback URLs
  callbacks: {
    onConnect: (address: string) => {
      console.log('Para wallet connected:', address);
      // Track connection event
      if (PARA_CONFIG.analytics.enabled) {
        // Analytics tracking code here
      }
    },
    
    onDisconnect: () => {
      console.log('Para wallet disconnected');
      // Track disconnection event
    },
    
    onError: (error: Error) => {
      console.error('Para wallet error:', error);
      // Error tracking code here
    },
    
    onTransaction: (txHash: string) => {
      console.log('Para transaction:', txHash);
      // Track transaction event
    },
  },

  // Custom UI Components
  ui: {
    connectModal: {
      title: 'Connect to EarnX',
      subtitle: 'Choose your preferred login method',
      logo: '/logo.png',
      brandColor: PARA_CONFIG.theme.primaryColor,
    },
    
    accountModal: {
      showBalance: true,
      showTransactionHistory: true,
      showSettings: true,
    },
  },
};

// Helper function to get Para config based on environment
export function getParaConfig() {
  const config = { ...PARA_CONFIG };
  
  // Environment-specific overrides
  if (process.env.NODE_ENV === 'production') {
    config.environment = 'production';
    config.development.enableDebugMode = false;
    config.development.verboseLogging = false;
  }
  
  return config;
}

// Validation function for Para configuration
export function validateParaConfig() {
  const config = getParaConfig();

  console.log('🔍 Validating Para configuration...');
  console.log('🔑 API Key:', config.apiKey.substring(0, 10) + '...');
  console.log('🌍 Environment:', config.environment);
  console.log('⛓️ Chains:', config.chains.length);

  if (!config.apiKey || config.apiKey === 'your-para-api-key') {
    console.warn('❌ Para API key not configured. Please set REACT_APP_PARA_API_KEY');
    return false;
  }

  if (config.chains.length === 0) {
    console.error('❌ No chains configured for Para wallet');
    return false;
  }

  console.log('✅ Para configuration is valid!');
  return true;
}
