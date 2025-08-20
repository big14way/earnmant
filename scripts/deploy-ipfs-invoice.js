const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying IPFSInvoiceProtocol to Mantle Sepolia...");

  // Get the ContractFactory and Signers here.
  const IPFSInvoiceProtocol = await hre.ethers.getContractFactory("IPFSInvoiceProtocol");
  
  console.log("📄 Deploying gas-optimized IPFS invoice contract...");
  
  // Deploy the contract
  const ipfsInvoiceProtocol = await IPFSInvoiceProtocol.deploy();
  await ipfsInvoiceProtocol.waitForDeployment();

  const contractAddress = await ipfsInvoiceProtocol.getAddress();
  
  console.log("✅ IPFSInvoiceProtocol deployed to:", contractAddress);
  
  // Test the contract immediately
  console.log("🧪 Testing contract...");
  try {
    const totalInvoices = await ipfsInvoiceProtocol.getTotalInvoices();
    console.log("📊 Total invoices:", totalInvoices.toString());
    
    // Test string to bytes32 conversion
    const testHash = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
    const bytes32Hash = await ipfsInvoiceProtocol.stringToBytes32(testHash);
    console.log("🔗 Test IPFS hash conversion:", bytes32Hash);
    
    console.log("✅ Contract is working correctly!");
  } catch (testError) {
    console.error("❌ Contract test failed:", testError.message);
  }
  
  console.log("\n🎉 Deployment Summary:");
  console.log("Contract Address:", contractAddress);
  console.log("Network: Mantle Sepolia");
  console.log("Deployer:", await ipfsInvoiceProtocol.runner.getAddress());
  console.log("💡 This contract uses bytes32 for IPFS hashes to optimize gas usage");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });