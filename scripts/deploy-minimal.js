const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Minimal EarnX deployment on Mantle Network...");
  
  const [deployer] = await ethers.getSigners();
  const networkName = hre.network.name;
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId;
  
  console.log(`📡 Network: ${networkName}`);
  console.log(`⛓️  Chain ID: ${chainId}`);
  console.log(`👤 Deployer: ${deployer.address}`);
  
  // Check balance first
  const balance = await deployer.provider.getBalance(deployer.address);
  const balanceInEth = ethers.formatEther(balance);
  console.log(`💰 Balance: ${balanceInEth} MNT`);
  
  if (balance === 0n) {
    console.log("❌ No funds available for deployment");
    console.log("🪙 Get testnet tokens from: https://faucet.sepolia.mantle.xyz/");
    process.exit(1);
  }
  
  try {
    // Deploy only USDC first (smallest contract)
    console.log("\n📄 Deploying MantleUSDC Token (minimal test)...");
    const MantleUSDC = await ethers.getContractFactory("MantleUSDC");
    
    // Get gas estimate
    const deploymentData = MantleUSDC.interface.encodeDeploy([]);
    const gasEstimate = await deployer.estimateGas({ data: deploymentData });
    const gasPrice = await deployer.provider.getGasPrice();
    const estimatedCost = gasEstimate * gasPrice;
    
    console.log(`⛽ Estimated gas: ${gasEstimate.toString()}`);
    console.log(`⛽ Gas price: ${ethers.formatUnits(gasPrice, "gwei")} gwei`);
    console.log(`💸 Estimated cost: ${ethers.formatEther(estimatedCost)} MNT`);
    
    if (balance < estimatedCost) {
      console.log("❌ Insufficient funds for even minimal deployment");
      console.log(`💸 Need: ${ethers.formatEther(estimatedCost)} MNT`);
      console.log(`💸 Have: ${balanceInEth} MNT`);
      process.exit(1);
    }
    
    const usdcToken = await MantleUSDC.deploy({
      gasLimit: gasEstimate + 50000n, // Add buffer
      gasPrice: gasPrice
    });
    await usdcToken.waitForDeployment();
    
    console.log(`✅ USDC Token deployed at: ${usdcToken.target}`);
    
    // Check balance after deployment
    const newBalance = await deployer.provider.getBalance(deployer.address);
    const newBalanceInEth = ethers.formatEther(newBalance);
    console.log(`💰 Balance after deployment: ${newBalanceInEth} MNT`);
    console.log(`💸 Gas used: ${ethers.formatEther(balance - newBalance)} MNT`);
    
    console.log("\n🎉 Minimal deployment successful!");
    console.log("✅ Ready to deploy full protocol");
    
  } catch (error) {
    console.error("\n❌ Deployment failed:");
    console.error(error.message);
    
    if (error.message.includes("insufficient funds")) {
      console.log("\n💡 Solutions:");
      console.log("1. Get more testnet tokens");
      console.log("2. Reduce gas price in hardhat.config.ts");
      console.log("3. Wait and try again (gas prices fluctuate)");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });