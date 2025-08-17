const hre = require("hardhat");
const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Starting EarnX deployment on Mantle Network...");
  
  const [deployer] = await ethers.getSigners();
  const networkName = hre.network.name;
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId;
  
  console.log(`📡 Network: ${networkName}`);
  console.log(`⛓️  Chain ID: ${chainId}`);
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`💰 Balance: ${ethers.formatEther(await deployer.provider.getBalance(deployer.address))} ETH`);
  
  // Deployment configuration
  const config = {
    network: networkName,
    chainId: chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {}
  };
  
  try {
    // ============ STEP 1: Deploy USDC Token (for testing) ============
    console.log("\n📄 Step 1: Deploying MantleUSDC Token...");
    const MantleUSDC = await ethers.getContractFactory("MantleUSDC");
    const usdcToken = await MantleUSDC.deploy();
    await usdcToken.waitForDeployment();
    
    console.log(`✅ USDC Token deployed at: ${usdcToken.target}`);
    config.contracts.usdcToken = {
      name: "MantleUSDC",
      address: usdcToken.target,
      deploymentHash: "N/A - ethers v6"
    };
    
    // ============ STEP 2: Deploy Price Manager ============
    console.log("\n💹 Step 2: Deploying Price Manager...");
    const MantlePriceManager = await ethers.getContractFactory("MantlePriceManager");
    const priceManager = await MantlePriceManager.deploy();
    await priceManager.waitForDeployment();
    
    console.log(`✅ Price Manager deployed at: ${priceManager.target}`);
    config.contracts.priceManager = {
      name: "MantlePriceManager",
      address: priceManager.target,
      deploymentHash: "N/A - ethers v6"
    };
    
    // ============ STEP 3: Deploy NFT Contract ============
    console.log("\n🎨 Step 3: Deploying Invoice NFT...");
    const EarnXInvoiceNFT = await ethers.getContractFactory("EarnXInvoiceNFT");
    const invoiceNFT = await EarnXInvoiceNFT.deploy();
    await invoiceNFT.waitForDeployment();
    
    console.log(`✅ Invoice NFT deployed at: ${invoiceNFT.target}`);
    config.contracts.invoiceNFT = {
      name: "EarnXInvoiceNFT",
      address: invoiceNFT.target,
      deploymentHash: "N/A - ethers v6"
    };
    
    // ============ STEP 4: Deploy Verification Module ============
    console.log("\n🔐 Step 4: Deploying Verification Module...");
    const MantleEarnXVerificationModule = await ethers.getContractFactory("MantleEarnXVerificationModule");
    const verificationModule = await MantleEarnXVerificationModule.deploy(deployer.address); // Deployer as verification authority
    await verificationModule.waitForDeployment();
    
    console.log(`✅ Verification Module deployed at: ${verificationModule.target}`);
    config.contracts.verificationModule = {
      name: "MantleEarnXVerificationModule",
      address: verificationModule.target,
      deploymentHash: "N/A - ethers v6",
      verificationAuthority: deployer.address
    };
    
    // ============ STEP 5: Deploy Investment Module ============
    console.log("\n💼 Step 5: Deploying Investment Module...");
    const EarnXInvestmentModule = await ethers.getContractFactory("EarnXInvestmentModule");
    const investmentModule = await EarnXInvestmentModule.deploy(usdcToken.target);
    await investmentModule.waitForDeployment();
    
    console.log(`✅ Investment Module deployed at: ${investmentModule.target}`);
    config.contracts.investmentModule = {
      name: "EarnXInvestmentModule",
      address: investmentModule.target,
      deploymentHash: "N/A - ethers v6"
    };
    
    // ============ STEP 6: Deploy Main Protocol ============
    console.log("\n🏛️  Step 6: Deploying Main Protocol...");
    const MantleEarnXProtocol = await ethers.getContractFactory("MantleEarnXProtocol");
    const protocol = await MantleEarnXProtocol.deploy(
      invoiceNFT.target,
      usdcToken.target,
      priceManager.target,
      verificationModule.target,
      investmentModule.target
    );
    await protocol.waitForDeployment();
    
    console.log(`✅ Main Protocol deployed at: ${protocol.target}`);
    config.contracts.protocol = {
      name: "MantleEarnXProtocol",
      address: protocol.target,
      deploymentHash: "N/A - ethers v6"
    };
    
    // ============ STEP 7: Initialize Protocol ============
    console.log("\n⚙️  Step 7: Initializing Protocol...");
    
    // Initialize the main protocol
    const initTx = await protocol.initializeProtocol();
    await initTx.wait();
    console.log(`✅ Protocol initialized`);
    
    // ============ STEP 8: Setup USDC for testing ============
    console.log("\n💰 Step 8: Setting up USDC for testing...");
    
    // Mint USDC to deployer for testing
    const mintAmount = ethers.parseUnits("1000000", 6); // 1M USDC
    const mintTx = await usdcToken.mint(deployer.target, mintAmount);
    await mintTx.wait();
    console.log(`✅ Minted ${ethers.formatUnits(mintAmount, 6)} USDC to deployer`);
    
    // ============ STEP 9: Verify Deployment ============
    console.log("\n🔍 Step 9: Verifying Deployment...");
    
    // Check protocol version
    const version = await protocol.version();
    console.log(`📋 Protocol Version: ${version}`);
    
    // Check NFT setup
    const nftProtocol = await invoiceNFT.protocolAddress();
    console.log(`🎨 NFT Protocol Address: ${nftProtocol}`);
    
    // Check USDC balance
    const balance = await usdcToken.balanceOf(deployer.target);
    console.log(`💰 Deployer USDC Balance: ${ethers.formatUnits(balance, 6)}`);
    
    // ============ STEP 10: Generate ABIs ============
    console.log("\n📝 Step 10: Generating ABIs...");
    
    const abis = {
      MantleEarnXProtocol: protocol.interface.format('json'),
      MantleEarnXVerificationModule: verificationModule.interface.format('json'),
      EarnXInvestmentModule: investmentModule.interface.format('json'),
      EarnXInvoiceNFT: invoiceNFT.interface.format('json'),
      EarnXPriceManager: priceManager.interface.format('json'),
      MantleUSDC: usdcToken.interface.format('json')
    };
    
    // ============ STEP 11: Save Deployment Info ============
    console.log("\n💾 Step 11: Saving Deployment Info...");
    
    const deploymentData = {
      ...config,
      abis: abis,
      networkInfo: {
        name: network,
        chainId: chainId,
        rpcUrl: networkName === 'mantle' ? 'https://rpc.mantle.xyz' : 
                networkName === 'mantle-testnet' ? 'https://rpc.testnet.mantle.xyz' : 
                'unknown',
        blockExplorer: networkName === 'mantle' ? 'https://explorer.mantle.xyz' : 
                       networkName === 'mantle-testnet' ? 'https://explorer.testnet.mantle.xyz' : 
                       'unknown'
      },
      instructions: {
        frontend: "Update frontend1/config/contracts.json with the new addresses",
        verification: "The verification authority is set to the deployer address",
        testing: "Use the faucet() function on USDC contract to get test tokens",
        investment: "Approve USDC spending before making investments"
      }
    };
    
    // Save deployment file
    const deploymentFileName = `mantle-earnx-deployment-${Date.now()}.json`;
    const deploymentPath = path.join(__dirname, '..', 'deployments', deploymentFileName);
    
    // Ensure deployments directory exists
    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));
    console.log(`💾 Deployment saved to: ${deploymentPath}`);
    
    // Also save as latest
    const latestPath = path.join(__dirname, '..', 'deployments', 'mantle-latest.json');
    fs.writeFileSync(latestPath, JSON.stringify(deploymentData, null, 2));
    console.log(`💾 Latest deployment saved to: ${latestPath}`);
    
    // ============ DEPLOYMENT COMPLETE ============
    console.log("\n🎉 DEPLOYMENT COMPLETE! 🎉");
    console.log("\n📋 Contract Addresses:");
    console.log(`🏛️  Main Protocol: ${protocol.target}`);
    console.log(`🔐 Verification Module: ${verificationModule.target}`);
    console.log(`💼 Investment Module: ${investmentModule.target}`);
    console.log(`🎨 Invoice NFT: ${invoiceNFT.target}`);
    console.log(`💹 Price Manager: ${priceManager.target}`);
    console.log(`💰 USDC Token: ${usdcToken.target}`);
    
    console.log("\n🔧 Next Steps:");
    console.log("1. Update frontend configuration with new contract addresses");
    console.log("2. Test invoice submission and verification");
    console.log("3. Test investment flow");
    console.log("4. Deploy verification API if needed");
    
    console.log("\n💡 Testing Commands:");
    console.log(`npx hardhat verify --network ${network} ${protocol.target} ${invoiceNFT.target} ${usdcToken.target} ${priceManager.target} ${verificationModule.target} ${investmentModule.target}`);
    
    return {
      protocol: protocol.target,
      verificationModule: verificationModule.target,
      investmentModule: investmentModule.target,
      invoiceNFT: invoiceNFT.target,
      priceManager: priceManager.target,
      usdcToken: usdcToken.target
    };
    
  } catch (error) {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    throw error;
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then((addresses) => {
    console.log("\n✅ Deployment successful!");
    console.log("Contract addresses:", addresses);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed!");
    console.error(error);
    process.exit(1);
  });