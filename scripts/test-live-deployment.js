// Test Live Deployment on Mantle Sepolia
const { ethers } = require("hardhat");

// Live contract addresses from our deployment
const LIVE_ADDRESSES = {
  PROTOCOL: "0x8528bB7b0c112Ad465a7A26bc12e6484052960f4",
  PRICE_MANAGER: "0x2526C7f2E2883112B3bd345dA8e3bfa1802d094e",
  USDC: "0xFA938c958ebED1E484f92dd013DDBDc782a2Cf3D",
  VERIFICATION_MODULE: "0x132737a3881f32a8486196766386C08dEBAA6969",
  INVOICE_NFT: "0x714532c747322448eABB75Cc956AD07DA08F7545",
  INVESTMENT_MODULE: "0xdbfA1FAAAA2DB65829421862CF7cb5AB718Bda01",
  CCIP_SOURCE_MINTER: "0xdf0ED3Af8bCcd8DcaB0D77216317BA32177df34A",
  VRF_GENERATOR: "0x728B9b25E5c67FDec0C35aEAe4719715b10300fb"
};

async function main() {
  console.log("🚀 Testing Live EarnX Deployment on Mantle Sepolia...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Testing with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MNT");
  
  // Connect to live contracts
  const protocol = await ethers.getContractAt("MantleEarnXProtocol", LIVE_ADDRESSES.PROTOCOL);
  const priceManager = await ethers.getContractAt("ChainlinkEnhancedPriceManager", LIVE_ADDRESSES.PRICE_MANAGER);
  const usdc = await ethers.getContractAt("MantleUSDC", LIVE_ADDRESSES.USDC);
  
  console.log("\n📊 Testing Chainlink Enhanced Price Manager...");
  
  try {
    // Test commodity pricing (returns [price, updatedAt])
    const [cassavaPrice, cassavaUpdatedAt] = await priceManager.getCommodityPrice("Cassava");
    console.log("✅ Cassava Price:", ethers.formatUnits(cassavaPrice, 8), "USD");
    console.log("   Last Updated:", new Date(Number(cassavaUpdatedAt) * 1000).toLocaleString());

    const [coffeePrice, coffeeUpdatedAt] = await priceManager.getCommodityPrice("Coffee");
    console.log("✅ Coffee Price:", ethers.formatUnits(coffeePrice, 8), "USD");
    console.log("   Last Updated:", new Date(Number(coffeeUpdatedAt) * 1000).toLocaleString());

    // Test currency conversion
    const ngnToUsd = await priceManager.convertToUsd(ethers.parseUnits("1000", 18), "NGN");
    console.log("✅ 1000 NGN =", ethers.formatUnits(ngnToUsd, 18), "USD");

    // Test risk assessment (commodity, supplierCountry, buyerCountry, amount)
    const riskScore = await priceManager.calculateTradeRisk("Cassava", "Nigeria", "Ghana", ethers.parseUnits("10000", 6));
    console.log("✅ Nigeria → Ghana Cassava Trade Risk:", riskScore.toString(), "%");

  } catch (error) {
    console.log("⚠️  Price Manager Error:", error.message);
  }
  
  console.log("\n🏛️ Testing Main Protocol...");
  
  try {
    // Check protocol version and stats
    const version = await protocol.version();
    console.log("✅ Protocol Version:", version);

    const [totalInvoices, totalFundsRaised, pendingInvoices, verifiedInvoices, fundedInvoices, repaidInvoices] = await protocol.getProtocolStats();
    console.log("✅ Protocol Stats:");
    console.log("   Total Invoices:", totalInvoices.toString());
    console.log("   Total Funds Raised:", ethers.formatUnits(totalFundsRaised, 6), "USDC");
    console.log("   Pending:", pendingInvoices.toString());
    console.log("   Verified:", verifiedInvoices.toString());
    console.log("   Funded:", fundedInvoices.toString());
    console.log("   Repaid:", repaidInvoices.toString());

  } catch (error) {
    console.log("⚠️  Protocol Error:", error.message);
  }
  
  console.log("\n💰 Testing USDC Token...");
  
  try {
    // Check USDC balance
    const balance = await usdc.balanceOf(deployer.address);
    console.log("✅ USDC Balance:", ethers.formatUnits(balance, 6), "USDC");
    
    // Mint some USDC for testing
    await usdc.mint(deployer.address, ethers.parseUnits("1000", 6));
    console.log("✅ Minted 1000 USDC for testing");
    
    const newBalance = await usdc.balanceOf(deployer.address);
    console.log("✅ New USDC Balance:", ethers.formatUnits(newBalance, 6), "USDC");
    
  } catch (error) {
    console.log("⚠️  USDC Error:", error.message);
  }
  
  console.log("\n🎉 Live Deployment Test Complete!");
  console.log("🌍 EarnX is now live on Mantle Sepolia with real Chainlink infrastructure!");
  console.log("🔗 View on Mantle Explorer: https://sepolia.mantlescan.xyz/");
  console.log("📋 Main Protocol:", LIVE_ADDRESSES.PROTOCOL);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
