const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying SimpleInvoiceProtocol to Mantle Sepolia...");

  // Get the ContractFactory and Signers here.
  const SimpleInvoiceProtocol = await hre.ethers.getContractFactory("SimpleInvoiceProtocol");
  
  console.log("📄 Deploying contract...");
  
  // Deploy the contract
  const simpleInvoiceProtocol = await SimpleInvoiceProtocol.deploy();
  await simpleInvoiceProtocol.waitForDeployment();

  const contractAddress = await simpleInvoiceProtocol.getAddress();
  
  console.log("✅ SimpleInvoiceProtocol deployed to:", contractAddress);
  
  // Verify the contract on Etherscan/block explorer (optional)
  console.log("⏳ Waiting for block confirmations...");
  await simpleInvoiceProtocol.deploymentTransaction().wait(5);
  
  console.log("🔍 Attempting to verify contract...");
  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [],
    });
    console.log("✅ Contract verified successfully!");
  } catch (error) {
    console.log("⚠️ Verification failed:", error.message);
  }
  
  // Test the contract
  console.log("🧪 Testing contract...");
  try {
    const totalInvoices = await simpleInvoiceProtocol.getTotalInvoices();
    console.log("📊 Total invoices:", totalInvoices.toString());
    
    console.log("✅ Contract is working correctly!");
  } catch (testError) {
    console.error("❌ Contract test failed:", testError.message);
  }
  
  console.log("\n🎉 Deployment Summary:");
  console.log("Contract Address:", contractAddress);
  console.log("Network: Mantle Sepolia");
  console.log("Deployer:", await simpleInvoiceProtocol.runner.getAddress());
  
  // Save address for frontend integration
  const fs = require('fs');
  const deploymentInfo = {
    contractAddress: contractAddress,
    network: "mantle-sepolia",
    deployedAt: new Date().toISOString(),
    contractName: "SimpleInvoiceProtocol"
  };
  
  fs.writeFileSync('./deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Deployment info saved to deployment-info.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });