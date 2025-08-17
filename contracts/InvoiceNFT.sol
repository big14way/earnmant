// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title InvoiceNFT
 * @notice NFT contract for tokenized trade finance invoices
 * @dev Each NFT represents a verified trade finance invoice with metadata
 */
contract InvoiceNFT is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    // ============ STATE VARIABLES ============
    Counters.Counter private _tokenIdCounter;
    
    // Mapping from token ID to invoice data
    mapping(uint256 => InvoiceData) public invoiceData;
    
    // Mapping from invoice ID to token ID
    mapping(uint256 => uint256) public invoiceIdToTokenId;
    
    // Mapping from token ID to investment data
    mapping(uint256 => InvestmentData) public investmentData;
    
    // Authorized minters (CCIP destination minter, main protocol)
    mapping(address => bool) public authorizedMinters;
    
    // ============ STRUCTS ============
    struct InvoiceData {
        uint256 invoiceId;
        string commodity;
        uint256 amount;
        string supplierCountry;
        string buyerCountry;
        string exporterName;
        string buyerName;
        address supplier;
        uint256 dueDate;
        string documentHash;
        uint256 riskScore;
        string creditRating;
        bool verified;
        uint256 mintTimestamp;
        InvoiceStatus status;
    }
    
    struct InvestmentData {
        uint256 totalInvested;
        uint256 targetAmount;
        uint256 investorCount;
        uint256 expectedReturn;
        uint256 actualReturn;
        bool fullyFunded;
        bool repaid;
        uint256 repaymentDate;
    }
    
    enum InvoiceStatus {
        PENDING,
        VERIFIED,
        FUNDED,
        SHIPPED,
        DELIVERED,
        PAID,
        DEFAULTED
    }
    
    // ============ EVENTS ============
    event InvoiceNFTMinted(
        uint256 indexed tokenId,
        uint256 indexed invoiceId,
        address indexed supplier,
        string commodity,
        uint256 amount
    );
    
    event InvoiceStatusUpdated(
        uint256 indexed tokenId,
        uint256 indexed invoiceId,
        InvoiceStatus oldStatus,
        InvoiceStatus newStatus
    );
    
    event InvestmentDataUpdated(
        uint256 indexed tokenId,
        uint256 totalInvested,
        uint256 investorCount,
        bool fullyFunded
    );
    
    event AuthorizedMinterUpdated(address indexed minter, bool authorized);
    
    // ============ ERRORS ============
    error UnauthorizedMinter();
    error InvoiceAlreadyExists(uint256 invoiceId);
    error InvalidInvoiceData();
    error TokenDoesNotExist(uint256 tokenId);
    error InvoiceNotFound(uint256 invoiceId);
    
    // ============ MODIFIERS ============
    modifier onlyAuthorizedMinter() {
        if (!authorizedMinters[msg.sender] && msg.sender != owner()) {
            revert UnauthorizedMinter();
        }
        _;
    }
    
    constructor() ERC721("EarnX Invoice NFT", "EINV") {
        // Start token IDs at 1
        _tokenIdCounter.increment();
        
        // Authorize owner as minter
        authorizedMinters[msg.sender] = true;
    }
    
    // ============ MINTING FUNCTIONS ============
    
    /**
     * @notice Mint a new invoice NFT
     * @dev Called by authorized minters (CCIP destination, main protocol)
     */
    function mintInvoiceNFT(
        address to,
        uint256 invoiceId,
        string memory commodity,
        uint256 amount,
        string memory supplierCountry,
        string memory buyerCountry,
        string memory exporterName,
        string memory buyerName,
        uint256 dueDate,
        string memory documentHash,
        uint256 riskScore,
        string memory creditRating
    ) external onlyAuthorizedMinter nonReentrant returns (uint256 tokenId) {
        // Validate input
        if (invoiceId == 0 || bytes(commodity).length == 0 || amount == 0) {
            revert InvalidInvoiceData();
        }
        
        // Check if invoice already exists
        if (invoiceIdToTokenId[invoiceId] != 0) {
            revert InvoiceAlreadyExists(invoiceId);
        }
        
        // Get new token ID
        tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        // Mint NFT
        _safeMint(to, tokenId);
        
        // Store invoice data
        invoiceData[tokenId] = InvoiceData({
            invoiceId: invoiceId,
            commodity: commodity,
            amount: amount,
            supplierCountry: supplierCountry,
            buyerCountry: buyerCountry,
            exporterName: exporterName,
            buyerName: buyerName,
            supplier: to,
            dueDate: dueDate,
            documentHash: documentHash,
            riskScore: riskScore,
            creditRating: creditRating,
            verified: true,
            mintTimestamp: block.timestamp,
            status: InvoiceStatus.VERIFIED
        });
        
        // Map invoice ID to token ID
        invoiceIdToTokenId[invoiceId] = tokenId;
        
        // Initialize investment data
        investmentData[tokenId] = InvestmentData({
            totalInvested: 0,
            targetAmount: (amount * 90) / 100, // 90% funding ratio
            investorCount: 0,
            expectedReturn: 0,
            actualReturn: 0,
            fullyFunded: false,
            repaid: false,
            repaymentDate: 0
        });
        
        emit InvoiceNFTMinted(tokenId, invoiceId, to, commodity, amount);
        
        return tokenId;
    }
    
    // ============ UPDATE FUNCTIONS ============
    
    /**
     * @notice Update invoice status
     */
    function updateInvoiceStatus(
        uint256 tokenId,
        InvoiceStatus newStatus
    ) external onlyAuthorizedMinter {
        if (!_exists(tokenId)) {
            revert TokenDoesNotExist(tokenId);
        }
        
        InvoiceStatus oldStatus = invoiceData[tokenId].status;
        invoiceData[tokenId].status = newStatus;
        
        emit InvoiceStatusUpdated(tokenId, invoiceData[tokenId].invoiceId, oldStatus, newStatus);
    }
    
    /**
     * @notice Update investment data
     */
    function updateInvestmentData(
        uint256 tokenId,
        uint256 totalInvested,
        uint256 investorCount,
        uint256 expectedReturn,
        bool fullyFunded
    ) external onlyAuthorizedMinter {
        if (!_exists(tokenId)) {
            revert TokenDoesNotExist(tokenId);
        }
        
        InvestmentData storage investment = investmentData[tokenId];
        investment.totalInvested = totalInvested;
        investment.investorCount = investorCount;
        investment.expectedReturn = expectedReturn;
        investment.fullyFunded = fullyFunded;
        
        // Update invoice status if fully funded
        if (fullyFunded && invoiceData[tokenId].status == InvoiceStatus.VERIFIED) {
            invoiceData[tokenId].status = InvoiceStatus.FUNDED;
        }
        
        emit InvestmentDataUpdated(tokenId, totalInvested, investorCount, fullyFunded);
    }
    
    /**
     * @notice Record repayment
     */
    function recordRepayment(
        uint256 tokenId,
        uint256 actualReturn
    ) external onlyAuthorizedMinter {
        if (!_exists(tokenId)) {
            revert TokenDoesNotExist(tokenId);
        }
        
        InvestmentData storage investment = investmentData[tokenId];
        investment.actualReturn = actualReturn;
        investment.repaid = true;
        investment.repaymentDate = block.timestamp;
        
        // Update invoice status
        invoiceData[tokenId].status = InvoiceStatus.PAID;
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @notice Get invoice data by token ID
     */
    function getInvoiceData(uint256 tokenId) external view returns (InvoiceData memory) {
        if (!_exists(tokenId)) {
            revert TokenDoesNotExist(tokenId);
        }
        return invoiceData[tokenId];
    }
    
    /**
     * @notice Get investment data by token ID
     */
    function getInvestmentData(uint256 tokenId) external view returns (InvestmentData memory) {
        if (!_exists(tokenId)) {
            revert TokenDoesNotExist(tokenId);
        }
        return investmentData[tokenId];
    }
    
    /**
     * @notice Get token ID by invoice ID
     */
    function getTokenIdByInvoiceId(uint256 invoiceId) external view returns (uint256) {
        uint256 tokenId = invoiceIdToTokenId[invoiceId];
        if (tokenId == 0) {
            revert InvoiceNotFound(invoiceId);
        }
        return tokenId;
    }
    
    /**
     * @notice Get total supply of NFTs
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter.current() - 1;
    }
    
    /**
     * @notice Check if invoice exists
     */
    function invoiceExists(uint256 invoiceId) external view returns (bool) {
        return invoiceIdToTokenId[invoiceId] != 0;
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @notice Set authorized minter
     */
    function setAuthorizedMinter(address minter, bool authorized) external onlyOwner {
        authorizedMinters[minter] = authorized;
        emit AuthorizedMinterUpdated(minter, authorized);
    }
    
    /**
     * @notice Set token URI
     */
    function setTokenURI(uint256 tokenId, string memory uri) external onlyOwner {
        if (!_exists(tokenId)) {
            revert TokenDoesNotExist(tokenId);
        }
        _setTokenURI(tokenId, uri);
    }
    
    // ============ OVERRIDES ============
    
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
