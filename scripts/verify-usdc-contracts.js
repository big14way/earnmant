// Script to verify USDC contracts on Mantle Sepolia
const { createPublicClient, http } = require('viem');
const { mantleSepoliaTestnet } = require('viem/chains');

// USDC contracts to test
const USDC_CONTRACTS = [
  "0x211a38792781b2c7a584a96F0e735d56e809fe85", // Primary
  "0x0088d454b77FfeF4e6d4f7426AB01e73Bd283B12", // Fallback 1
  "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8", // Fallback 2 (Common Sepolia USDC)
];

// Simple ERC20 ABI
const ERC20_ABI = [
  {
    "type": "function",
    "name": "name",
    "inputs": [],
    "outputs": [{"name": "", "type": "string"}],
    "stateMutability": "view"
  },
  {
    "type": "function", 
    "name": "symbol",
    "inputs": [],
    "outputs": [{"name": "", "type": "string"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "decimals", 
    "inputs": [],
    "outputs": [{"name": "", "type": "uint8"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "totalSupply",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  }
];

async function verifyUSDCContract(client, address) {
  console.log(`\n🔍 Checking contract at ${address}...`);
  
  try {
    // Check if contract exists
    const bytecode = await client.getBytecode({ address });
    
    if (!bytecode || bytecode === '0x') {
      console.log(`❌ No contract found at ${address}`);
      return { exists: false, valid: false };
    }
    
    console.log(`✅ Contract exists (bytecode length: ${bytecode.length})`);
    
    // Try to read ERC20 properties
    const results = await Promise.allSettled([
      client.readContract({
        address,
        abi: ERC20_ABI,
        functionName: 'name',
      }),
      client.readContract({
        address,
        abi: ERC20_ABI,
        functionName: 'symbol',
      }),
      client.readContract({
        address,
        abi: ERC20_ABI,
        functionName: 'decimals',
      }),
      client.readContract({
        address,
        abi: ERC20_ABI,
        functionName: 'totalSupply',
      })
    ]);
    
    const [nameResult, symbolResult, decimalsResult, totalSupplyResult] = results;
    
    console.log(`   Name: ${nameResult.status === 'fulfilled' ? nameResult.value : 'Failed'}`);
    console.log(`   Symbol: ${symbolResult.status === 'fulfilled' ? symbolResult.value : 'Failed'}`);
    console.log(`   Decimals: ${decimalsResult.status === 'fulfilled' ? Number(decimalsResult.value) : 'Failed'}`);
    console.log(`   Total Supply: ${totalSupplyResult.status === 'fulfilled' ? totalSupplyResult.value.toString() : 'Failed'}`);
    
    const validERC20 = results.some(result => result.status === 'fulfilled');
    
    if (validERC20) {
      console.log(`✅ Contract appears to be a valid ERC20 token`);
      return {
        exists: true,
        valid: true,
        name: nameResult.status === 'fulfilled' ? nameResult.value : 'Unknown',
        symbol: symbolResult.status === 'fulfilled' ? symbolResult.value : 'Unknown',
        decimals: decimalsResult.status === 'fulfilled' ? Number(decimalsResult.value) : 18
      };
    } else {
      console.log(`❌ Contract exists but doesn't appear to be a valid ERC20`);
      return { exists: true, valid: false };
    }
    
  } catch (error) {
    console.log(`❌ Error checking contract: ${error.message}`);
    return { exists: false, valid: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Verifying USDC contracts on Mantle Sepolia...\n');
  
  // Create public client for Mantle Sepolia
  const client = createPublicClient({
    chain: mantleSepoliaTestnet,
    transport: http()
  });
  
  console.log(`🌐 Connected to Mantle Sepolia`);
  console.log(`   Chain ID: ${mantleSepoliaTestnet.id}`);
  console.log(`   RPC: ${mantleSepoliaTestnet.rpcUrls.default.http[0]}`);
  
  let workingContract = null;
  
  for (const contractAddress of USDC_CONTRACTS) {
    const result = await verifyUSDCContract(client, contractAddress);
    
    if (result.valid && !workingContract) {
      workingContract = contractAddress;
      console.log(`🎯 Found working USDC contract: ${contractAddress}`);
    }
  }
  
  if (workingContract) {
    console.log(`\n✅ RECOMMENDATION: Use ${workingContract} as your USDC contract`);
  } else {
    console.log(`\n❌ No working USDC contracts found. You may need to deploy a test USDC contract.`);
    console.log(`\n🛠️  Suggested next steps:`);
    console.log(`   1. Deploy a test USDC contract to Mantle Sepolia`);
    console.log(`   2. Or find the correct USDC contract address for Mantle Sepolia`);
    console.log(`   3. Update CONTRACT_ADDRESSES in useEarnX.ts`);
  }
}

main().catch(console.error);