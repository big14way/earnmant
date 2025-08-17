// config/mantle.ts - Mantle Network Configuration
export const MANTLE_SEPOLIA_CONFIG = {
  // Network details
  chainId: 5003,
  name: "Mantle Sepolia Testnet",
  rpcUrl: "https://rpc.sepolia.mantle.xyz",
  blockExplorer: "https://explorer.sepolia.mantle.xyz",
  nativeCurrency: {
    name: "Mantle Token",
    symbol: "MNT",
    decimals: 18
  },

  // Contract addresses from successful deployment
  contracts: {
    PROTOCOL: "0x95EAb385c669aca31C0d406c270d6EdDFED0D1ee",
    USDC: "0x211a38792781b2c7a584a96F0e735d56e809fe85",
    VERIFICATION_MODULE: "0x4adDFcfa066E0c955bC0347d9565454AD7Ceaae1",
    PRICE_MANAGER: "0x789f82778A8d9eB6514a457112a563A89F79A2f1",
    INVESTMENT_MODULE: "0x199516b47F1ce8C77617b58526ad701bF1f750FA",
    INVOICE_NFT: "0x4f330C74c7bd84665722bA0664705e2f2E6080DC",
  },

  // Explorer links
  explorerLinks: {
    protocol: "https://explorer.sepolia.mantle.xyz/address/0x95EAb385c669aca31C0d406c270d6EdDFED0D1ee",
    usdc: "https://explorer.sepolia.mantle.xyz/address/0x211a38792781b2c7a584a96F0e735d56e809fe85",
    verification: "https://explorer.sepolia.mantle.xyz/address/0x4adDFcfa066E0c955bC0347d9565454AD7Ceaae1",
    priceManager: "https://explorer.sepolia.mantle.xyz/address/0x789f82778A8d9eB6514a457112a563A89F79A2f1",
    investment: "https://explorer.sepolia.mantle.xyz/address/0x199516b47F1ce8C77617b58526ad701bF1f750FA",
    invoiceNFT: "https://explorer.sepolia.mantle.xyz/address/0x4f330C74c7bd84665722bA0664705e2f2E6080DC",
  },

  // Faucets for testing
  faucets: {
    MNT: "https://faucet.sepolia.mantle.xyz/",
    USDC: "Contract has faucet() function for testing",
  },

  // Features specific to this deployment
  features: {
    verification: {
      type: "EIP-712",
      description: "Uses EIP-712 signature verification instead of Chainlink oracles",
      authority: "0x3C343AD077983371b29fee386bdBC8a92E934C51"
    },
    investment: {
      fundingPercentage: 90,
      minAPR: 8,
      maxAPR: 20,
      riskBasedPricing: true
    },
    tokens: {
      USDC: {
        symbol: "USDC",
        name: "USD Coin (Mantle)",
        decimals: 6,
        address: "0x211a38792781b2c7a584a96F0e735d56e809fe85",
        isNative: false
      }
    }
  }
};

// Export for easy access in components
export const MANTLE_CONTRACTS = MANTLE_SEPOLIA_CONFIG.contracts;
export const MANTLE_NETWORK = MANTLE_SEPOLIA_CONFIG;

// Helper function to check if current chain is Mantle Sepolia
export const isMantleSepoliaNetwork = (chainId: number | undefined): boolean => {
  return chainId === MANTLE_SEPOLIA_CONFIG.chainId;
};

// Helper function to get contract address with validation
export const getMantleContractAddress = (contractName: keyof typeof MANTLE_CONTRACTS): string => {
  const address = MANTLE_CONTRACTS[contractName];
  if (!address) {
    throw new Error(`Contract address not found for ${contractName} on Mantle Sepolia`);
  }
  return address;
};

// Helper function to format Mantle explorer URL
export const getMantleExplorerUrl = (address: string, type: 'address' | 'tx' = 'address'): string => {
  const baseUrl = MANTLE_SEPOLIA_CONFIG.blockExplorer;
  return `${baseUrl}/${type}/${address}`;
};

// Default export
export default MANTLE_SEPOLIA_CONFIG;