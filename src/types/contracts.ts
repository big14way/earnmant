export interface ContractConfig {
  address: string;
  abi: any[];
}

export interface ChainlinkFeeds {
  ETH_USD: string;
  USDC_USD: string;
}

export const CHAIN_CONFIG = {
  MANTLE_SEPOLIA: {
    chainId: 5003,
    name: 'Mantle Sepolia',
    rpcUrl: 'https://rpc.sepolia.mantle.xyz',
  }
};
