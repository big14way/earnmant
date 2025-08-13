export const COMMODITIES = [
  { value: '', label: 'Select commodity' },
  { value: 'COCOA', label: 'Cocoa' },
  { value: 'COFFEE', label: 'Coffee' },
  { value: 'WHEAT', label: 'Wheat' },
  { value: 'COTTON', label: 'Cotton' },
  { value: 'PALM_OIL', label: 'Palm Oil' },
  { value: 'TEA', label: 'Tea' },
  { value: 'SUGAR', label: 'Sugar' },
];

export const COUNTRIES = [
  { value: 'Nigeria', label: 'Nigeria' },
  { value: 'Ethiopia', label: 'Ethiopia' },
  { value: 'Kenya', label: 'Kenya' },
  { value: 'Ghana', label: 'Ghana' },
  { value: 'Tanzania', label: 'Tanzania' },
  { value: 'Uganda', label: 'Uganda' },
  { value: 'Rwanda', label: 'Rwanda' },
  { value: 'Senegal', label: 'Senegal' },
];

export const CONTRACT_ADDRESSES = {
  // Mantle Sepolia Testnet - Ultra-Simple Protocol (Working Solution - January 2025)
  PROTOCOL: "0x0B94780aA755533276390e6269B8a9bf17F67018",
  USDC: "0x211a38792781b2c7a584a96F0e735d56e809fe85",
  INVOICE_NFT: "0x4f330C74c7bd84665722bA0664705e2f2E6080DC",
  VERIFICATION_MODULE: "0xDFe9b0627e0ec2b653FaDe125421cc32575631FC",
  PRICE_MANAGER: "0x789f82778A8d9eB6514a457112a563A89F79A2f1",
  INVESTMENT_MODULE: "0x199516b47F1ce8C77617b58526ad701bF1f750FA",
};

// Network configuration
export const MANTLE_SEPOLIA_CONFIG = {
  chainId: 5003,
  name: "Mantle Sepolia Testnet",
  rpcUrl: "https://rpc.sepolia.mantle.xyz",
  blockExplorer: "https://explorer.sepolia.mantle.xyz",
  nativeCurrency: {
    name: "Mantle Token",
    symbol: "MNT",
    decimals: 18
  }
};
