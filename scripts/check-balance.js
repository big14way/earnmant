const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking account balance...");
  
  const [deployer] = await ethers.getSigners();
  const networkName = hre.network.name;
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId;
  
  console.log(`📡 Network: ${networkName}`);
  console.log(`⛓️  Chain ID: ${chainId}`);
  console.log(`👤 Deployer: ${deployer.address}`);
  
  try {
    const balance = await deployer.provider.getBalance(deployer.address);
    const balanceInEth = ethers.formatEther(balance);
    
    console.log(`💰 Balance: ${balanceInEth} MNT`);
    console.log(`💰 Balance (wei): ${balance.toString()}`);
    
    if (balance > 0n) {
      console.log("✅ Account has funds - ready to deploy!");
      
      // Calculate estimated deployment cost
      const gasPrice = await deployer.provider.getGasPrice();
      console.log(`⛽ Current Gas Price: ${ethers.formatUnits(gasPrice, "gwei")} gwei`);
      
      // Estimate deployment cost (rough estimate)
      const estimatedGas = 3000000n; // 3M gas
      const estimatedCost = gasPrice * estimatedGas;
      const estimatedCostInEth = ethers.formatEther(estimatedCost);
      
      console.log(`📊 Estimated deployment cost: ${estimatedCostInEth} MNT`);
      
      if (balance >= estimatedCost) {
        console.log("✅ Sufficient funds for deployment!");
      } else {
        console.log("❌ Insufficient funds for deployment");
        console.log(`💸 Need at least: ${estimatedCostInEth} MNT`);
        console.log(`💸 Current balance: ${balanceInEth} MNT`);
        console.log(`💸 Shortfall: ${ethers.formatEther(estimatedCost - balance)} MNT`);
      }
    } else {
      console.log("❌ No funds in account");
      console.log("🪙 Please get testnet tokens from:");
      console.log("   • https://faucet.sepolia.mantle.xyz/");
      console.log("   • https://www.alchemy.com/faucets/mantle-sepolia");
    }
    
  } catch (error) {
    console.error("❌ Error checking balance:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });