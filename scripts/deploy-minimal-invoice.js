const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying MinimalInvoiceProtocol to Mantle Sepolia...");

  // Get the ContractFactory and Signers here.
  const MinimalInvoiceProtocol = await hre.ethers.getContractFactory("MinimalInvoiceProtocol");
  
  console.log("📄 Deploying contract...");
  
  // Deploy the contract
  const minimalInvoiceProtocol = await MinimalInvoiceProtocol.deploy();
  await minimalInvoiceProtocol.waitForDeployment();

  const contractAddress = await minimalInvoiceProtocol.getAddress();
  
  console.log("✅ MinimalInvoiceProtocol deployed to:", contractAddress);
  
  // Test the contract immediately
  console.log("🧪 Testing contract...");
  try {
    const totalInvoices = await minimalInvoiceProtocol.getTotalInvoices();
    console.log("📊 Total invoices:", totalInvoices.toString());
    
    console.log("✅ Contract is working correctly!");
  } catch (testError) {
    console.error("❌ Contract test failed:", testError.message);
  }
  
  console.log("\n🎉 Deployment Summary:");
  console.log("Contract Address:", contractAddress);
  console.log("Network: Mantle Sepolia");
  console.log("Deployer:", await minimalInvoiceProtocol.runner.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });