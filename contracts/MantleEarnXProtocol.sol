// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./EarnXInvoiceNFT.sol";
import "./MantleUSDC.sol";
import "./ChainlinkEnhancedPriceManager.sol";
import "./MantleEarnXVerificationModule.sol";
import "./EarnXInvestmentModule.sol";
import "./CCIPSourceMinterMantle.sol";

/**
 * @title MantleEarnXProtocol
 * @notice Main EarnX protocol contract optimized for Mantle Network
 * @dev Uses EIP-712 verification instead of Chainlink Functions
 */
contract MantleEarnXProtocol {
    
    // ============ CORE CONTRACTS ============
    EarnXInvoiceNFT public immutable invoiceNFT;
    MantleUSDC public immutable usdcToken;
    ChainlinkEnhancedPriceManager public immutable priceManager;

    // ============ MODULES ============
    MantleEarnXVerificationModule public immutable verificationModule;
    EarnXInvestmentModule public immutable investmentModule;

    // ============ CHAINLINK CCIP ============
    CCIPSourceMinterMantle public immutable ccipSourceMinter;
    
    // ============ STATE VARIABLES ============
    address public owner;
    uint256 public invoiceCounter;
    bool public paused;
    uint256 public constant FUNDING_PERCENTAGE = 9000; // 90% of invoice value
    uint256 public constant BASIS_POINTS_DENOMINATOR = 10000;
    
    // ============ STRUCTS ============
    struct Invoice {
        uint256 id;
        address supplier;
        address buyer;
        uint256 amount;
        string commodity;
        string supplierCountry;
        string buyerCountry;
        string exporterName;
        string buyerName;
        uint256 dueDate;
        uint256 aprBasisPoints;
        InvoiceStatus status;
        uint256 createdAt;
        bool documentVerified;
        uint256 targetFunding;
        uint256 currentFunding;
        string documentHash;
    }
    
    enum InvoiceStatus { 
        Submitted,       // 0 - Just submitted
        Verifying,       // 1 - Under verification
        Verified,        // 2 - Verified, open for investment
        FullyFunded,     // 3 - Investment target reached
        Approved,        // 4 - APR calculated, ready to fund
        Funded,          // 5 - Funds transferred to supplier
        Repaid,          // 6 - Buyer has repaid
        Defaulted,       // 7 - Payment overdue
        Rejected         // 8 - Failed verification
    }
    
    // ============ STORAGE ============
    mapping(uint256 => Invoice) public invoices;
    mapping(address => uint256[]) public supplierInvoices;
    mapping(address => uint256[]) public buyerInvoices;
    
    // ============ EVENTS ============
    event InvoiceSubmitted(
        uint256 indexed invoiceId, 
        address indexed supplier, 
        address indexed buyer,
        uint256 amount, 
        uint256 targetFunding,
        string commodity
    );
    event InvoiceVerified(uint256 indexed invoiceId, uint256 aprBasisPoints, uint256 riskScore);
    event InvestmentMade(uint256 indexed invoiceId, address indexed investor, uint256 amount, uint256 newTotal);
    event InvoiceFullyFunded(uint256 indexed invoiceId, uint256 totalAmount, uint256 numInvestors);
    event InvoiceApproved(uint256 indexed invoiceId, uint256 aprBasisPoints);
    event InvoiceFunded(uint256 indexed invoiceId, uint256 fundingAmount);
    event InvoiceRepaid(uint256 indexed invoiceId, uint256 repaymentAmount, uint256 profitDistributed);
    event InvoiceRejected(uint256 indexed invoiceId, string reason);
    event ProtocolPaused(bool paused);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    // ============ MODIFIERS ============
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    modifier validInvoice(uint256 invoiceId) {
        require(invoiceId > 0 && invoiceId <= invoiceCounter, "Invalid invoice");
        _;
    }
    
    modifier notPaused() {
        require(!paused, "Protocol is paused");
        _;
    }
    
    // ============ CONSTRUCTOR ============
    constructor(
        address _invoiceNFT,
        address _usdcToken,
        address _priceManager,
        address _verificationModule,
        address _investmentModule,
        address _ccipSourceMinter
    ) {
        require(_invoiceNFT != address(0), "Invalid NFT address");
        require(_usdcToken != address(0), "Invalid USDC address");
        require(_priceManager != address(0), "Invalid price manager address");
        require(_verificationModule != address(0), "Invalid verification module address");
        require(_investmentModule != address(0), "Invalid investment module address");
        require(_ccipSourceMinter != address(0), "Invalid CCIP source minter address");

        invoiceNFT = EarnXInvoiceNFT(_invoiceNFT);
        usdcToken = MantleUSDC(_usdcToken);
        priceManager = ChainlinkEnhancedPriceManager(_priceManager);
        verificationModule = MantleEarnXVerificationModule(_verificationModule);
        investmentModule = EarnXInvestmentModule(_investmentModule);
        ccipSourceMinter = CCIPSourceMinterMantle(payable(_ccipSourceMinter));
        owner = msg.sender;

        emit OwnershipTransferred(address(0), msg.sender);
    }
    
    function initializeProtocol() external onlyOwner {
        // Set this contract as the core contract for all modules
        verificationModule.setCoreContract(address(this));
        investmentModule.setCoreContract(address(this));
        
        // Initialize NFT protocol  
        invoiceNFT.setProtocolAddress(address(this));
    }
    
    // ============ INVOICE SUBMISSION ============
    function submitInvoice(
        address buyer,
        uint256 amount,
        string memory commodity,
        string memory supplierCountry,
        string memory buyerCountry,
        string memory exporterName,
        string memory buyerName,
        uint256 dueDate,
        string memory documentHash
    ) external notPaused returns (uint256) {
        require(buyer != address(0), "Invalid buyer address");
        require(buyer != msg.sender, "Supplier cannot be buyer");
        require(amount > 0, "Amount must be positive");
        require(dueDate > block.timestamp + 7 days, "Due date must be at least 7 days in future");
        require(bytes(commodity).length > 0, "Commodity required");
        require(bytes(exporterName).length > 0, "Exporter name required");
        require(bytes(buyerName).length > 0, "Buyer name required");
        require(bytes(documentHash).length > 0, "Document hash required");
        require(bytes(supplierCountry).length > 0, "Supplier country required");
        require(bytes(buyerCountry).length > 0, "Buyer country required");
        
        invoiceCounter++;
        uint256 invoiceId = invoiceCounter;
        uint256 targetFunding = (amount * FUNDING_PERCENTAGE) / BASIS_POINTS_DENOMINATOR;
        
        // Create invoice in storage
        Invoice storage newInvoice = invoices[invoiceId];
        newInvoice.id = invoiceId;
        newInvoice.supplier = msg.sender;
        newInvoice.buyer = buyer;
        newInvoice.amount = amount;
        newInvoice.commodity = commodity;
        newInvoice.supplierCountry = supplierCountry;
        newInvoice.buyerCountry = buyerCountry;
        newInvoice.exporterName = exporterName;
        newInvoice.buyerName = buyerName;
        newInvoice.dueDate = dueDate;
        newInvoice.aprBasisPoints = 0;
        newInvoice.status = InvoiceStatus.Submitted;
        newInvoice.createdAt = block.timestamp;
        newInvoice.documentVerified = false;
        newInvoice.targetFunding = targetFunding;
        newInvoice.currentFunding = 0;
        newInvoice.documentHash = documentHash;
        
        supplierInvoices[msg.sender].push(invoiceId);
        buyerInvoices[buyer].push(invoiceId);
        
        emit InvoiceSubmitted(invoiceId, msg.sender, buyer, amount, targetFunding, commodity);
        
        // Start document verification through module
        newInvoice.status = InvoiceStatus.Verifying;
        verificationModule.startDocumentVerification(
            invoiceId,
            documentHash,
            commodity,
            amount,
            supplierCountry,
            buyerCountry,
            exporterName,
            buyerName
        );
        
        return invoiceId;
    }
    
    // ============ VERIFICATION CALLBACK ============
    function onDocumentVerificationComplete(
        uint256 invoiceId,
        bool isValid,
        uint256 riskScore,
        string memory /* creditRating */
    ) external {
        require(msg.sender == address(verificationModule), "Only verification module");
        require(invoiceId > 0 && invoiceId <= invoiceCounter, "Invalid invoice ID");
        
        Invoice storage invoice = invoices[invoiceId];
        require(invoice.status == InvoiceStatus.Verifying, "Invoice not in verifying status");
        
        invoice.documentVerified = isValid;
        
        if (isValid) {
            // Calculate APR based on risk score (8-20% range)
            uint256 baseAPR = 800; // 8% in basis points
            uint256 riskPremium = (riskScore * 1200) / 100; // Up to 12% additional based on risk
            invoice.aprBasisPoints = baseAPR + riskPremium;

            // Cap at 20%
            if (invoice.aprBasisPoints > 2000) {
                invoice.aprBasisPoints = 2000;
            }

            // Set status to verified - now available for investment
            invoice.status = InvoiceStatus.Verified;

            // ============ CROSS-CHAIN NFT MINTING ============
            // Send invoice data to Ethereum Sepolia for NFT minting via CCIP
            _sendInvoiceForCrossChainNFTMinting(invoiceId, riskScore);

            emit InvoiceVerified(invoiceId, invoice.aprBasisPoints, riskScore);
        } else {
            invoice.status = InvoiceStatus.Rejected;
            emit InvoiceRejected(invoiceId, "Failed document verification");
        }
    }
    
    // ============ INVESTMENT SYSTEM ============
    function investInInvoice(uint256 invoiceId, uint256 amount) external validInvoice(invoiceId) notPaused {
        Invoice storage invoice = invoices[invoiceId];
        
        require(invoice.status == InvoiceStatus.Verified, "Invoice must be verified for investment");
        require(amount > 0, "Investment amount must be positive");
        require(invoice.currentFunding + amount <= invoice.targetFunding, "Investment exceeds target funding");
        require(msg.sender != invoice.supplier, "Supplier cannot invest in own invoice");
        require(msg.sender != invoice.buyer, "Buyer cannot invest in own invoice");
        
        // Check USDC allowance and transfer
        uint256 allowance = usdcToken.allowance(msg.sender, address(this));
        require(allowance >= amount, "Insufficient USDC allowance for protocol");
        require(usdcToken.transferFrom(msg.sender, address(investmentModule), amount), "USDC transfer failed");
        
        // Process investment through module
        uint256 newTotalFunding = investmentModule.makeInvestment(
            invoiceId,
            msg.sender,
            amount,
            invoice.targetFunding,
            invoice.currentFunding,
            invoice.supplier
        );
        
        // Update invoice funding
        invoice.currentFunding = newTotalFunding;
        
        emit InvestmentMade(invoiceId, msg.sender, amount, newTotalFunding);
        
        // Check if fully funded
        if (invoice.currentFunding >= invoice.targetFunding) {
            invoice.status = InvoiceStatus.FullyFunded;
            
            (uint256 totalInvestment, uint256 numInvestors,) = investmentModule.getInvestmentInfo(invoiceId);
            emit InvoiceFullyFunded(invoiceId, totalInvestment, numInvestors);
            
            // Auto-approve and fund
            _approveAndFundInvoice(invoiceId);
        }
    }
    
    // ============ FUNDING LOGIC ============
    function _approveAndFundInvoice(uint256 invoiceId) internal {
        Invoice storage invoice = invoices[invoiceId];
        require(invoice.status == InvoiceStatus.FullyFunded, "Invoice not fully funded");
        
        uint256 fundingAmount = invoice.currentFunding;
        
        // Set to approved first
        invoice.status = InvoiceStatus.Approved;
        emit InvoiceApproved(invoiceId, invoice.aprBasisPoints);
        
        // Transfer funds through investment module
        require(
            investmentModule.transferFundsToSupplier(invoiceId, invoice.supplier, fundingAmount),
            "Transfer to supplier failed"
        );
        
        // Mint NFT to supplier
        invoiceNFT.mintToSupplier(
            invoice.supplier,
            invoiceId,
            invoice.commodity,
            invoice.amount,
            invoice.exporterName,
            invoice.buyerName,
            invoice.buyerCountry,
            invoice.dueDate,
            uint8(InvoiceStatus.Funded), // Will be funded after this
            invoice.createdAt,
            0, // Can retrieve risk score from verification module
            invoice.aprBasisPoints
        );
        
        invoice.status = InvoiceStatus.Funded;
        emit InvoiceFunded(invoiceId, fundingAmount);
    }
    
    // ============ REPAYMENT ============
    function repayInvoice(uint256 invoiceId) external validInvoice(invoiceId) notPaused {
        Invoice storage invoice = invoices[invoiceId];
        require(invoice.status == InvoiceStatus.Funded, "Invoice not funded");
        require(msg.sender == invoice.buyer, "Only buyer can repay");
        
        // Calculate repayment amount with interest
        uint256 timeElapsed = block.timestamp > invoice.dueDate ? 
            (invoice.dueDate - invoice.createdAt) : 
            (block.timestamp - invoice.createdAt);
            
        uint256 annualInterest = (invoice.amount * invoice.aprBasisPoints) / BASIS_POINTS_DENOMINATOR;
        uint256 interest = (annualInterest * timeElapsed) / 365 days;
        uint256 repaymentAmount = invoice.amount + interest;
        
        // Check for late payment penalty
        if (block.timestamp > invoice.dueDate) {
            uint256 lateDays = (block.timestamp - invoice.dueDate) / 1 days;
            uint256 latePenalty = (repaymentAmount * lateDays * 50) / BASIS_POINTS_DENOMINATOR; // 0.5% per day
            repaymentAmount += latePenalty;
        }
        
        // Transfer repayment from buyer
        require(
            usdcToken.transferFrom(msg.sender, address(investmentModule), repaymentAmount),
            "Repayment transfer failed"
        );
        
        // Process repayment through investment module
        uint256 totalProfit = investmentModule.processRepayment(
            invoiceId,
            msg.sender,
            repaymentAmount,
            invoice.currentFunding
        );
        
        invoice.status = InvoiceStatus.Repaid;
        emit InvoiceRepaid(invoiceId, repaymentAmount, totalProfit);
    }
    
    // ============ VIEW FUNCTIONS ============
    function getInvoice(uint256 invoiceId) external view validInvoice(invoiceId) returns (
        uint256 id,
        address supplier,
        address buyer,
        uint256 amount,
        string memory commodity,
        string memory supplierCountry,
        string memory buyerCountry,
        string memory exporterName,
        string memory buyerName,
        uint256 dueDate,
        uint256 aprBasisPoints,
        InvoiceStatus status,
        uint256 createdAt,
        bool documentVerified,
        uint256 targetFunding,
        uint256 currentFunding
    ) {
        Invoice memory invoice = invoices[invoiceId];
        return (
            invoice.id,
            invoice.supplier,
            invoice.buyer,
            invoice.amount,
            invoice.commodity,
            invoice.supplierCountry,
            invoice.buyerCountry,
            invoice.exporterName,
            invoice.buyerName,
            invoice.dueDate,
            invoice.aprBasisPoints,
            invoice.status,
            invoice.createdAt,
            invoice.documentVerified,
            invoice.targetFunding,
            invoice.currentFunding
        );
    }
    
    function getInvestmentOpportunities() external view returns (uint256[] memory) {
        uint256[] memory opportunities = new uint256[](invoiceCounter);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= invoiceCounter; i++) {
            Invoice memory invoice = invoices[i];
            if (invoice.status == InvoiceStatus.Verified && 
                invoice.aprBasisPoints > 0 && 
                invoice.currentFunding < invoice.targetFunding) {
                opportunities[count] = i;
                count++;
            }
        }
        
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = opportunities[i];
        }
        
        return result;
    }
    
    function getProtocolStats() external view returns (
        uint256 totalInvoices,
        uint256 totalFundsRaised,
        uint256 pendingInvoices,
        uint256 verifiedInvoices,
        uint256 fundedInvoices,
        uint256 repaidInvoices
    ) {
        uint256 pending = 0;
        uint256 verified = 0;
        uint256 funded = 0;
        uint256 repaid = 0;
        uint256 totalRaised = 0;
        
        for (uint256 i = 1; i <= invoiceCounter; i++) {
            Invoice memory invoice = invoices[i];
            
            if (invoice.status == InvoiceStatus.Submitted || invoice.status == InvoiceStatus.Verifying) {
                pending++;
            } else if (invoice.status == InvoiceStatus.Verified) {
                verified++;
            } else if (invoice.status == InvoiceStatus.Funded) {
                funded++;
                totalRaised += invoice.currentFunding;
            } else if (invoice.status == InvoiceStatus.Repaid) {
                repaid++;
                totalRaised += invoice.currentFunding;
            }
        }
        
        return (invoiceCounter, totalRaised, pending, verified, funded, repaid);
    }
    
    function getSupplierInvoices(address supplier) external view returns (uint256[] memory) {
        return supplierInvoices[supplier];
    }
    
    function getBuyerInvoices(address buyer) external view returns (uint256[] memory) {
        return buyerInvoices[buyer];
    }
    
    function getInvestorInvoices(address investor) external view returns (uint256[] memory) {
        return investmentModule.getInvestorInvoices(investor);
    }
    
    // ============ ADMIN FUNCTIONS ============
    function emergencyRejectInvoice(uint256 invoiceId, string memory reason) external onlyOwner validInvoice(invoiceId) {
        Invoice storage invoice = invoices[invoiceId];
        require(
            invoice.status == InvoiceStatus.Submitted || 
            invoice.status == InvoiceStatus.Verifying ||
            invoice.status == InvoiceStatus.Verified,
            "Cannot reject invoice in current status"
        );
        
        invoice.status = InvoiceStatus.Rejected;
        
        // Refund any investments made
        if (invoice.currentFunding > 0) {
            investmentModule.refundInvestors(invoiceId);
            invoice.currentFunding = 0;
        }
        
        emit InvoiceRejected(invoiceId, reason);
    }
    
    function pause() external onlyOwner {
        paused = true;
        emit ProtocolPaused(true);
    }
    
    function unpause() external onlyOwner {
        paused = false;
        emit ProtocolPaused(false);
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
    
    // ============ CROSS-CHAIN NFT MINTING ============
    /**
     * @notice Send invoice data to Ethereum Sepolia for cross-chain NFT minting
     * @param invoiceId The invoice ID to mint NFT for
     * @param riskScore The calculated risk score from verification
     */
    function _sendInvoiceForCrossChainNFTMinting(uint256 invoiceId, uint256 riskScore) internal {
        Invoice storage invoice = invoices[invoiceId];

        // Create invoice data struct for CCIP
        CCIPSourceMinterMantle.InvoiceData memory invoiceData = CCIPSourceMinterMantle.InvoiceData({
            invoiceId: invoiceId,
            commodity: invoice.commodity,
            amount: invoice.amount,
            supplierCountry: invoice.supplierCountry,
            buyerCountry: invoice.buyerCountry,
            exporterName: invoice.exporterName,
            buyerName: invoice.buyerName,
            supplier: invoice.supplier,
            dueDate: invoice.dueDate,
            documentHash: invoice.documentHash,
            riskScore: riskScore,
            creditRating: _calculateCreditRating(riskScore),
            verified: true,
            timestamp: block.timestamp
        });

        // Send via CCIP (will revert if insufficient LINK balance)
        try ccipSourceMinter.sendInvoiceForNFTMinting(invoiceData) {
            // Success - NFT minting initiated on Ethereum Sepolia
        } catch {
            // Failed to send - continue without cross-chain NFT
            // This ensures the main flow isn't disrupted by CCIP issues
        }
    }

    /**
     * @notice Calculate credit rating based on risk score
     * @param riskScore Risk score from 0-100
     * @return creditRating String representation of credit rating
     */
    function _calculateCreditRating(uint256 riskScore) internal pure returns (string memory) {
        if (riskScore <= 20) return "AAA";
        if (riskScore <= 35) return "AA";
        if (riskScore <= 50) return "A";
        if (riskScore <= 65) return "BBB";
        if (riskScore <= 80) return "BB";
        return "B";
    }

    /**
     * @notice Get enhanced price data from Chainlink price manager
     * @param commodity The commodity to get price for
     * @param currency The currency to convert to
     */
    function getEnhancedPriceData(
        string memory commodity,
        string memory currency
    ) external view returns (
        int256 commodityPrice,
        int256 currencyRate,
        uint256 riskScore,
        uint256 volatility
    ) {
        try priceManager.getCommodityPrice(commodity) returns (int256 price, uint256) {
            commodityPrice = price;
        } catch {
            commodityPrice = 0;
        }

        try priceManager.getCurrencyRate(currency) returns (int256 rate, uint256) {
            currencyRate = rate;
        } catch {
            currencyRate = 100000000; // Default to 1.0 (8 decimals)
        }

        riskScore = priceManager.getCountryRisk(currency); // Using currency as proxy for country
        volatility = priceManager.getCommodityVolatility(commodity);
    }

    // ============ VERSION INFO ============
    function version() external pure returns (string memory) {
        return "MantleEarnXProtocol v2.0.0 - Chainlink Enhanced";
    }

    function getContractInfo() external view returns (
        string memory name,
        string memory version_,
        address owner_,
        bool paused_,
        uint256 totalInvoices,
        uint256 chainId
    ) {
        return (
            "EarnX Protocol - Chainlink Enhanced",
            this.version(),
            owner,
            paused,
            invoiceCounter,
            block.chainid
        );
    }
}