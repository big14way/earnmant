const { ethers } = require("hardhat");

// Real Chainlink contract addresses for Mantle Sepolia
const MANTLE_SEPOLIA_CONFIG = {
  // CCIP Router (REAL ADDRESS)
  ccipRouter: "0xFd33fd627017fEf041445FC19a2B6521C9778f86",

  // LINK Token (REAL ADDRESS)
  linkToken: "0x22bdEdEa0beBdD7CfFC95bA53826E55afFE9DE04",

  // Additional Chainlink Infrastructure
  chainSelector: "8236463271206331221",
  rmd: "0xcCB84Ec3F6AFdD2052134f74aaAc95Ae41A7B333",
  tokenRegistry: "0x0F1eE88A582f31d92510E300fc1330AA5a525D51",
  registryModuleOwner: "0xd239f46A197ef6657af8b1C1d025410992B44771c",
  wmnt: "0x19f5557E23e9914A18239990f6C70D68FDF0deD5",

  // Price Feeds (using mock addresses for now - can be updated when available)
  ethUsdFeed: "0x0000000000000000000000000000000000000000", // Placeholder
  btcUsdFeed: "0x0000000000000000000000000000000000000000", // Placeholder
  usdcUsdFeed: "0x0000000000000000000000000000000000000000", // Placeholder
  linkUsdFeed: "0x0000000000000000000000000000000000000000", // Placeholder

  // VRF Configuration (using mock for now)
  vrfCoordinator: "0x0000000000000000000000000000000000000000", // Placeholder
  vrfGasLane: "0x0000000000000000000000000000000000000000000000000000000000000000",
  vrfSubscriptionId: 0,
  vrfCallbackGasLimit: 100000
};

// Ethereum Sepolia configuration
const ETHEREUM_SEPOLIA_CONFIG = {
  // CCIP Router
  ccipRouter: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59",
  
  // LINK Token
  linkToken: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
  
  // Price Feeds
  ethUsdFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
  btcUsdFeed: "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43",
  usdcUsdFeed: "0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E",
  linkUsdFeed: "0xc59E3633BAAC79493d908e63626716e204A45EdF"
};

async function main() {
  console.log("🚀 Deploying Chainlink Enhanced EarnX Protocol...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());
  
  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, "Chain ID:", network.chainId);
  
  let config;
  const chainId = Number(network.chainId);
  if (chainId === 5003) { // Mantle Sepolia
    config = MANTLE_SEPOLIA_CONFIG;
    console.log("📍 Deploying on Mantle Sepolia");
  } else if (chainId === 11155111) { // Ethereum Sepolia
    config = ETHEREUM_SEPOLIA_CONFIG;
    console.log("📍 Deploying on Ethereum Sepolia");
  } else {
    throw new Error(`Unsupported network: ${chainId}`);
  }
  
  // ============ DEPLOY ENHANCED PRICE MANAGER ============
  console.log("\n📊 Deploying Enhanced Price Manager...");
  const ChainlinkEnhancedPriceManager = await ethers.getContractFactory("ChainlinkEnhancedPriceManager");
  const priceManager = await ChainlinkEnhancedPriceManager.deploy(
    config.ethUsdFeed,
    config.btcUsdFeed,
    config.usdcUsdFeed,
    config.linkUsdFeed
  );
  await priceManager.waitForDeployment();
  console.log("✅ Enhanced Price Manager deployed to:", await priceManager.getAddress());
  
  if (chainId === 5003) { // Mantle Sepolia specific deployments
    
    // ============ DEPLOY VRF INVOICE GENERATOR ============
    console.log("\n🎲 Deploying VRF Invoice Generator...");
    const ChainlinkVRFInvoiceGenerator = await ethers.getContractFactory("ChainlinkVRFInvoiceGenerator");
    const vrfGenerator = await ChainlinkVRFInvoiceGenerator.deploy(
      config.vrfSubscriptionId,
      config.vrfCoordinator,
      config.vrfGasLane,
      config.vrfCallbackGasLimit
    );
    await vrfGenerator.waitForDeployment();
    console.log("✅ VRF Invoice Generator deployed to:", await vrfGenerator.getAddress());
    
    // ============ DEPLOY CCIP SOURCE MINTER ============
    console.log("\n🌉 Deploying CCIP Source Minter...");
    const CCIPSourceMinterMantle = await ethers.getContractFactory("CCIPSourceMinterMantle");
    const sourceMinter = await CCIPSourceMinterMantle.deploy(
      config.ccipRouter,
      config.linkToken
    );
    await sourceMinter.waitForDeployment();
    console.log("✅ CCIP Source Minter deployed to:", await sourceMinter.getAddress());
    
    // ============ DEPLOY EXISTING CONTRACTS ============
    console.log("\n📄 Deploying existing contracts...");
    
    // Deploy USDC
    const MantleUSDC = await ethers.getContractFactory("MantleUSDC");
    const usdcToken = await MantleUSDC.deploy();
    await usdcToken.waitForDeployment();
    console.log("✅ USDC deployed to:", await usdcToken.getAddress());

    // Deploy Invoice NFT
    const EarnXInvoiceNFT = await ethers.getContractFactory("EarnXInvoiceNFT");
    const invoiceNFT = await EarnXInvoiceNFT.deploy();
    await invoiceNFT.waitForDeployment();
    console.log("✅ Invoice NFT deployed to:", await invoiceNFT.getAddress());
    
    // Deploy Verification Module (with deployer as verification authority)
    const MantleEarnXVerificationModule = await ethers.getContractFactory("MantleEarnXVerificationModule");
    const verificationModule = await MantleEarnXVerificationModule.deploy(deployer.address);
    await verificationModule.waitForDeployment();
    console.log("✅ Verification Module deployed to:", await verificationModule.getAddress());
    
    // Deploy Investment Module
    const EarnXInvestmentModule = await ethers.getContractFactory("EarnXInvestmentModule");
    const investmentModule = await EarnXInvestmentModule.deploy(await usdcToken.getAddress());
    await investmentModule.waitForDeployment();
    console.log("✅ Investment Module deployed to:", await investmentModule.getAddress());
    
    // ============ DEPLOY MAIN PROTOCOL ============
    console.log("\n🏛️ Deploying Main Protocol...");
    const MantleEarnXProtocol = await ethers.getContractFactory("MantleEarnXProtocol");
    const protocol = await MantleEarnXProtocol.deploy(
      await invoiceNFT.getAddress(),
      await usdcToken.getAddress(),
      await priceManager.getAddress(),
      await verificationModule.getAddress(),
      await investmentModule.getAddress(),
      await sourceMinter.getAddress()
    );
    await protocol.waitForDeployment();
    console.log("✅ Main Protocol deployed to:", await protocol.getAddress());
    
    // ============ SETUP AUTHORIZATIONS ============
    console.log("\n🔐 Setting up authorizations...");
    
    // Authorize protocol in source minter
    await sourceMinter.setAuthorizedCaller(await protocol.getAddress(), true);
    console.log("✅ Protocol authorized in CCIP Source Minter");

    // Authorize protocol in VRF generator
    await vrfGenerator.setAuthorizedCaller(await protocol.getAddress(), true);
    console.log("✅ Protocol authorized in VRF Generator");

    // Transfer ownership of verification module to protocol
    await verificationModule.transferOwnership(await protocol.getAddress());
    console.log("✅ Verification module ownership transferred to protocol");

    // Initialize protocol
    await protocol.initializeProtocol();
    console.log("✅ Protocol initialized");
    
    console.log("\n🎉 Mantle Sepolia deployment complete!");
    console.log("📋 Contract Addresses:");
    console.log("  - Enhanced Price Manager:", await priceManager.getAddress());
    console.log("  - VRF Invoice Generator:", await vrfGenerator.getAddress());
    console.log("  - CCIP Source Minter:", await sourceMinter.getAddress());
    console.log("  - USDC Token:", await usdcToken.getAddress());
    console.log("  - Invoice NFT:", await invoiceNFT.getAddress());
    console.log("  - Verification Module:", await verificationModule.getAddress());
    console.log("  - Investment Module:", await investmentModule.getAddress());
    console.log("  - Main Protocol:", await protocol.getAddress());
    
  } else if (chainId === 11155111) { // Ethereum Sepolia specific deployments
    
    // ============ DEPLOY INVOICE NFT ============
    console.log("\n🎨 Deploying Invoice NFT...");
    const InvoiceNFT = await ethers.getContractFactory("InvoiceNFT");
    const invoiceNFT = await InvoiceNFT.deploy();
    await invoiceNFT.waitForDeployment();
    console.log("✅ Invoice NFT deployed to:", invoiceNFT.address);
    
    // ============ DEPLOY CCIP DESTINATION MINTER ============
    console.log("\n🌉 Deploying CCIP Destination Minter...");
    const CCIPDestinationMinterEthereum = await ethers.getContractFactory("CCIPDestinationMinterEthereum");
    const destinationMinter = await CCIPDestinationMinterEthereum.deploy(
      config.ccipRouter,
      config.linkToken,
      await invoiceNFT.getAddress()
    );
    await destinationMinter.waitForDeployment();
    console.log("✅ CCIP Destination Minter deployed to:", destinationMinter.address);
    
    // ============ SETUP AUTHORIZATIONS ============
    console.log("\n🔐 Setting up authorizations...");
    
    // Authorize destination minter to mint NFTs
    await invoiceNFT.setAuthorizedMinter(await destinationMinter.getAddress(), true);
    console.log("✅ Destination Minter authorized to mint NFTs");

    console.log("\n🎉 Ethereum Sepolia deployment complete!");
    console.log("📋 Contract Addresses:");
    console.log("  - Enhanced Price Manager:", await priceManager.getAddress());
    console.log("  - Invoice NFT:", await invoiceNFT.getAddress());
    console.log("  - CCIP Destination Minter:", await destinationMinter.getAddress());

    console.log("\n⚠️  IMPORTANT: Set the destination minter address in the Mantle Sepolia source minter!");
    console.log("   Destination Minter Address:", await destinationMinter.getAddress());
  }
  
  console.log("\n✨ Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
