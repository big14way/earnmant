// Diagnose RPC and contract interaction issues
const hre = require("hardhat");

async function main() {
    console.log('🔍 Diagnosing RPC and contract interaction issues...');
    
    const [deployer] = await hre.ethers.getSigners();
    console.log('📝 Using account:', deployer.address);
    
    // Contract addresses from deployment
    const USDC_ADDRESS = "0xa49Ae8a172017B6394310522c673A38d3D64b0A7";
    const PROTOCOL_ADDRESS = "0xd592da75C554beD6b42766968Fee71e4C6A0d8b2";

    console.log('🌐 Network Info:');
    console.log('  Network Name:', hre.network.name);
    console.log('  Chain ID:', (await hre.ethers.provider.getNetwork()).chainId);
    console.log('  Block Number:', await hre.ethers.provider.getBlockNumber());
    
    console.log('\n💰 Account Balance:');
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log('  ETH/MNT Balance:', hre.ethers.formatEther(balance), 'MNT');
    
    console.log('\n📋 Step 1: Testing USDC Contract Connection...');
    
    try {
        // Connect to USDC contract
        const usdc = await hre.ethers.getContractAt("MantleUSDC", USDC_ADDRESS);
        
        // Basic contract info
        const name = await usdc.name();
        const symbol = await usdc.symbol();
        const decimals = await usdc.decimals();
        console.log('✅ USDC Contract Info:');
        console.log('  Name:', name);
        console.log('  Symbol:', symbol);
        console.log('  Decimals:', decimals);
        
        // Check balance
        const usdcBalance = await usdc.balanceOf(deployer.address);
        console.log('  USDC Balance:', (Number(usdcBalance) / 1e6).toFixed(2), 'USDC');
        
        // Check current allowance
        const currentAllowance = await usdc.allowance(deployer.address, PROTOCOL_ADDRESS);
        console.log('  Current Allowance:', (Number(currentAllowance) / 1e6).toFixed(2), 'USDC');
        
    } catch (error) {
        console.error('❌ USDC Contract Connection Failed:', error.message);
        return;
    }
    
    console.log('\n🧪 Step 2: Testing Gas Estimation for USDC Approval...');
    
    try {
        const usdc = await hre.ethers.getContractAt("MantleUSDC", USDC_ADDRESS);
        const approvalAmount = hre.ethers.parseUnits("100", 6); // 100 USDC
        
        // Estimate gas for approval
        const estimatedGas = await usdc.approve.estimateGas(PROTOCOL_ADDRESS, approvalAmount);
        console.log('✅ Gas Estimation Successful:');
        console.log('  Estimated Gas:', estimatedGas.toString());
        
        // Get gas price
        const gasPrice = await hre.ethers.provider.getFeeData();
        console.log('  Gas Price:', hre.ethers.formatUnits(gasPrice.gasPrice || 0, 'gwei'), 'gwei');
        console.log('  Max Fee Per Gas:', hre.ethers.formatUnits(gasPrice.maxFeePerGas || 0, 'gwei'), 'gwei');
        
        // Calculate total cost
        const totalCost = estimatedGas * (gasPrice.gasPrice || BigInt(0));
        console.log('  Estimated Cost:', hre.ethers.formatEther(totalCost), 'MNT');
        
    } catch (error) {
        console.error('❌ Gas Estimation Failed:', error.message);
        console.log('📋 Error Details:');
        if (error.data) {
            console.log('  Error Data:', error.data);
        }
        if (error.reason) {
            console.log('  Error Reason:', error.reason);
        }
        return;
    }
    
    console.log('\n💳 Step 3: Attempting Actual USDC Approval...');
    
    try {
        const usdc = await hre.ethers.getContractAt("MantleUSDC", USDC_ADDRESS);
        const smallApprovalAmount = hre.ethers.parseUnits("1", 6); // 1 USDC only
        
        console.log('⏳ Submitting approval transaction for 1 USDC...');
        
        // Try the approval with correct gas settings from diagnosis
        const tx = await usdc.approve(PROTOCOL_ADDRESS, smallApprovalAmount, {
            gasLimit: BigInt(160000000), // Use 160M gas as determined from diagnosis
        });
        
        console.log('✅ Transaction Submitted!');
        console.log('  Transaction Hash:', tx.hash);
        console.log('  Nonce:', tx.nonce);
        console.log('  Gas Limit:', tx.gasLimit?.toString());
        console.log('  Gas Price:', hre.ethers.formatUnits(tx.gasPrice || 0, 'gwei'), 'gwei');
        
        console.log('⏳ Waiting for confirmation...');
        const receipt = await tx.wait();
        
        console.log('🎉 Transaction Confirmed!');
        console.log('  Block Number:', receipt.blockNumber);
        console.log('  Gas Used:', receipt.gasUsed.toString());
        console.log('  Status:', receipt.status === 1 ? 'Success' : 'Failed');
        console.log('  Explorer URL: https://explorer.sepolia.mantle.xyz/tx/' + tx.hash);
        
        // Verify the approval worked
        const newAllowance = await usdc.allowance(deployer.address, PROTOCOL_ADDRESS);
        console.log('✅ New Allowance:', (Number(newAllowance) / 1e6).toFixed(2), 'USDC');
        
    } catch (error) {
        console.error('❌ USDC Approval Transaction Failed:', error.message);
        console.log('📋 Detailed Error Info:');
        console.log('  Error Code:', error.code);
        console.log('  Error Action:', error.action);
        if (error.transaction) {
            console.log('  Transaction:', error.transaction);
        }
        if (error.receipt) {
            console.log('  Receipt:', error.receipt);
        }
        if (error.reason) {
            console.log('  Reason:', error.reason);
        }
        if (error.data) {
            console.log('  Data:', error.data);
        }
    }
    
    console.log('\n🏁 Diagnosis complete!');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Diagnosis failed:', error);
        process.exit(1);
    });