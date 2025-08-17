require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-ignition");
require("@nomicfoundation/hardhat-ignition-ethers");
require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, // 🔧 CRITICAL: This fixes the "Stack too deep" error
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
      gas: 12000000,
      blockGasLimit: 12000000,
      allowUnlimitedContractSize: true,
    },
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/J6loM2kcvrC21YpzGrM0Sxfuh3-p5OKP",
      accounts: process.env.MANTLE_TESTNET_PRIVATE_KEY ? ['0x' + process.env.MANTLE_TESTNET_PRIVATE_KEY] : [],
      chainId: 11155111,
      gas: 6000000,
      gasPrice: 20000000000, // 20 gwei
      timeout: 20000,
    },
    'lisk-sepolia': {
      url: 'https://rpc.sepolia-api.lisk.com',
      accounts: (process.env.SEPOLIA_PRIVATE_KEY && !process.env.SEPOLIA_PRIVATE_KEY.includes('your_private_key_here')) ? [process.env.SEPOLIA_PRIVATE_KEY] : [],
      gasPrice: 1000000000,
      chainId: 4202,
      timeout: 20000,
    },
    'base-sepolia': {
      url: 'https://sepolia.base.org',
      accounts: (process.env.SEPOLIA_PRIVATE_KEY && !process.env.SEPOLIA_PRIVATE_KEY.includes('your_private_key_here')) ? [process.env.SEPOLIA_PRIVATE_KEY] : [],
      chainId: 84532,
      gas: 6000000,
      gasPrice: 1000000000, // 1 gwei
      timeout: 20000,
    },
    'arbitrum-sepolia': {
      url: 'https://sepolia-rollup.arbitrum.io/rpc',
      accounts: (process.env.SEPOLIA_PRIVATE_KEY && !process.env.SEPOLIA_PRIVATE_KEY.includes('your_private_key_here')) ? [process.env.SEPOLIA_PRIVATE_KEY] : [],
      chainId: 421614,
      gas: 6000000,
      timeout: 20000,
    },
    'polygon-amoy': {
      url: 'https://rpc-amoy.polygon.technology',
      accounts: (process.env.SEPOLIA_PRIVATE_KEY && !process.env.SEPOLIA_PRIVATE_KEY.includes('your_private_key_here')) ? [process.env.SEPOLIA_PRIVATE_KEY] : [],
      chainId: 80002,
      gas: 6000000,
      gasPrice: 20000000000,
      timeout: 20000,
    },
    'morph-testnet': {
      url: 'https://rpc-quicknode-holesky.morphl2.io',
      accounts: process.env.MORPH_TESTNET_PRIVATE_KEY ? [process.env.MORPH_TESTNET_PRIVATE_KEY] : [],
      chainId: 2810,
      gas: 6000000,
      gasPrice: 1000000000,
      timeout: 30000,
    },
    'mantle-testnet': {
      url: 'https://rpc.sepolia.mantle.xyz',
      accounts: process.env.MANTLE_TESTNET_PRIVATE_KEY ? ['0x' + process.env.MANTLE_TESTNET_PRIVATE_KEY] : [],
      chainId: 5003,
      gas: 10000000, // Increased to 10M gas
      gasPrice: 100000000, // 0.1 gwei - much lower
      timeout: 60000,
    },
    'mantle': {
      url: 'https://rpc.mantle.xyz',
      accounts: process.env.MANTLE_PRIVATE_KEY ? ['0x' + process.env.MANTLE_PRIVATE_KEY] : [],
      chainId: 5000,
      gas: 6000000,
      gasPrice: 1000000000, // 1 gwei
      timeout: 30000,
    },
    // Mainnet networks (commented for safety)
    // base: {
    //   url: 'https://mainnet.base.org',
    //   accounts: [process.env.BASE_PRIVATE_KEY],
    //   chainId: 8453,
    // },
    // polygon: {
    //   url: 'https://polygon-rpc.com',
    //   accounts: [process.env.POLYGON_PRIVATE_KEY],
    //   chainId: 137,
    // },
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY,
      'base-sepolia': process.env.BASESCAN_API_KEY,
      base: process.env.BASESCAN_API_KEY,
      'arbitrum-sepolia': process.env.ARBISCAN_API_KEY,
      'polygon-amoy': process.env.POLYGONSCAN_API_KEY,
    },
    customChains: [
      {
        network: "base-sepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org"
        }
      },
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org"
        }
      },
      {
        network: "arbitrum-sepolia",
        chainId: 421614,
        urls: {
          apiURL: "https://api-sepolia.arbiscan.io/api",
          browserURL: "https://sepolia.arbiscan.io"
        }
      },
      {
        network: "polygon-amoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com"
        }
      }
    ]
  },
  // Gas reporting for optimization
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: 'USD',
    gasPrice: 20,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  // Paths configuration
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
    ignition: "./ignition"
  },
  // Ignition configuration
  ignition: {
    requiredConfirmations: 1,
  },
  // Mocha timeout for tests
  mocha: {
    timeout: 40000
  }
};