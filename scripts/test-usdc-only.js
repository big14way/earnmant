// Test USDC contract functionality specifically
const hre = require("hardhat");

async function main() {
    console.log('🧪 Testing USDC contract functionality...');
    
    const [deployer] = await hre.ethers.getSigners();
    console.log('📝 Using account:', deployer.address);

    // USDC contract address from deployment
    const USDC_ADDRESS = "0xa49Ae8a172017B6394310522c673A38d3D64b0A7";
    const PROTOCOL_ADDRESS = "0xd592da75C554beD6b42766968Fee71e4C6A0d8b2";

    console.log('🔗 Connecting to USDC contract at:', USDC_ADDRESS);
    
    try {
        // Connect to USDC contract
        const usdc = await hre.ethers.getContractAt("MantleUSDC", USDC_ADDRESS);
        
        // Step 1: Check basic contract info
        console.log('\n📊 Step 1: Checking USDC contract info...');
        const name = await usdc.name();
        const symbol = await usdc.symbol();
        const decimals = await usdc.decimals();
        console.log(`💰 Token: ${name} (${symbol}) with ${decimals} decimals`);
        
        // Step 2: Check current balance
        console.log('\n💵 Step 2: Checking current balance...');
        const balance = await usdc.balanceOf(deployer.address);
        const formattedBalance = (Number(balance) / Math.pow(10, 6)).toFixed(2);
        console.log(`💰 Current balance: ${formattedBalance} USDC`);
        
        // Step 3: Try to mint some USDC if balance is low
        if (Number(balance) < 1000 * Math.pow(10, 6)) {
            console.log('\n🪙 Step 3: Minting test USDC...');
            const mintAmount = hre.ethers.parseUnits("10000", 6); // 10,000 USDC
            
            try {
                const mintTx = await usdc.mint(deployer.address, mintAmount);
                await mintTx.wait();
                console.log('✅ Successfully minted 10,000 USDC');
                
                // Check balance after minting
                const newBalance = await usdc.balanceOf(deployer.address);
                const newFormattedBalance = (Number(newBalance) / Math.pow(10, 6)).toFixed(2);
                console.log(`💰 New balance: ${newFormattedBalance} USDC`);
            } catch (mintError) {
                console.log('⚠️ Mint failed:', mintError.message);
            }
        }
        
        // Step 4: Test approval functionality
        console.log('\n✅ Step 4: Testing approval functionality...');
        
        // Check current allowance
        const currentAllowance = await usdc.allowance(deployer.address, PROTOCOL_ADDRESS);
        console.log(`📄 Current allowance: ${(Number(currentAllowance) / Math.pow(10, 6)).toFixed(2)} USDC`);
        
        // Try to approve
        const approvalAmount = hre.ethers.parseUnits("1000", 6); // 1,000 USDC
        console.log(`💳 Attempting to approve ${(Number(approvalAmount) / Math.pow(10, 6)).toFixed(2)} USDC...`);
        
        try {
            // If there's existing allowance, reset to 0 first
            if (Number(currentAllowance) > 0) {
                console.log('🔄 Resetting allowance to 0 first...');
                const resetTx = await usdc.approve(PROTOCOL_ADDRESS, 0);
                await resetTx.wait();
                console.log('✅ Reset complete');
            }
            
            // Now approve the new amount
            const approveTx = await usdc.approve(PROTOCOL_ADDRESS, approvalAmount);
            const receipt = await approveTx.wait();
            console.log('✅ Approval successful!');
            console.log('📋 Transaction hash:', approveTx.hash);
            console.log('⛽ Gas used:', receipt.gasUsed.toString());
            
            // Verify the approval
            const newAllowance = await usdc.allowance(deployer.address, PROTOCOL_ADDRESS);
            console.log(`✅ New allowance: ${(Number(newAllowance) / Math.pow(10, 6)).toFixed(2)} USDC`);
            
        } catch (approveError) {
            console.error('❌ Approval failed:', approveError.message);
            
            // Try to get more error details
            if (approveError.data) {
                console.log('📝 Error data:', approveError.data);
            }
        }
        
        console.log('\n🎉 USDC contract test completed!');
        
    } catch (error) {
        console.error('❌ USDC contract test failed:', error.message);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Test failed:', error);
        process.exit(1);
    });