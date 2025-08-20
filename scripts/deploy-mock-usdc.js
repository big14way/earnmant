const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying MockUSDC to Mantle Sepolia...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", await deployer.getAddress());

  // Check balance
  const balance = await ethers.provider.getBalance(await deployer.getAddress());
  console.log("💰 Account balance:", ethers.formatEther(balance), "MNT");

  if (balance < ethers.parseEther("0.01")) {
    console.error("❌ Insufficient balance for deployment. Need at least 0.01 MNT");
    process.exit(1);
  }
  
  // Deploy MockUSDC
  console.log("📦 Compiling and deploying MockUSDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");

  const mockUSDC = await MockUSDC.deploy();

  await mockUSDC.waitForDeployment();
  
  console.log("✅ MockUSDC deployed successfully!");
  console.log("📍 Contract address:", await mockUSDC.getAddress());
  console.log("🔗 Explorer:", `https://explorer.sepolia.mantle.xyz/address/${await mockUSDC.getAddress()}`);

  // Verify deployment by checking contract details
  const name = await mockUSDC.name();
  const symbol = await mockUSDC.symbol();
  const decimals = await mockUSDC.decimals();
  const totalSupply = await mockUSDC.totalSupply();
  const deployerBalance = await mockUSDC.balanceOf(await deployer.getAddress());
  
  console.log("\n📋 Contract Details:");
  console.log("   Name:", name);
  console.log("   Symbol:", symbol);
  console.log("   Decimals:", decimals);
  console.log("   Total Supply:", ethers.formatUnits(totalSupply, decimals), symbol);
  console.log("   Deployer Balance:", ethers.formatUnits(deployerBalance, decimals), symbol);

  // Test the faucet function
  console.log("\n🚰 Testing faucet function...");
  const faucetTx = await mockUSDC.faucet(ethers.parseUnits("100", decimals));
  await faucetTx.wait();

  const newBalance = await mockUSDC.balanceOf(await deployer.getAddress());
  console.log("✅ Faucet test successful!");
  console.log("   New Balance:", ethers.formatUnits(newBalance, decimals), symbol);
  
  console.log("\n🎯 Deployment Summary:");
  console.log("   MockUSDC Address:", await mockUSDC.getAddress());
  console.log("   Transaction Hash:", mockUSDC.deploymentTransaction()?.hash);
  console.log("   Block Number:", mockUSDC.deploymentTransaction()?.blockNumber);
  console.log("   Gas Used:", mockUSDC.deploymentTransaction()?.gasLimit?.toString());

  console.log("\n📝 Next Steps:");
  console.log("1. Update CONTRACT_ADDRESSES.USDC in frontend1/src/config/constants.ts");
  console.log("2. Use the faucet() function to get test USDC tokens");
  console.log("3. Test the approval and transfer functions");

  return await mockUSDC.getAddress();
}

main()
  .then((address) => {
    console.log(`\n🎉 Deployment completed successfully!`);
    console.log(`📋 MockUSDC Address: ${address}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
