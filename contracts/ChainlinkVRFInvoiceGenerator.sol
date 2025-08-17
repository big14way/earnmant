// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";

/**
 * @title ChainlinkVRFInvoiceGenerator
 * @notice Generates secure random invoice IDs using Chainlink VRF
 * @dev Provides cryptographically secure randomness for invoice ID generation
 */
contract ChainlinkVRFInvoiceGenerator is VRFConsumerBaseV2, ConfirmedOwner {
    
    // ============ VRF CONFIGURATION ============
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;
    
    // ============ STATE VARIABLES ============
    mapping(uint256 => address) public requestIdToSender;
    mapping(uint256 => uint256) public requestIdToInvoiceCounter;
    mapping(address => uint256) public lastRequestId;
    mapping(address => uint256) public generatedInvoiceId;
    
    // Authorized callers (main protocol contract)
    mapping(address => bool) public authorizedCallers;
    
    // ============ EVENTS ============
    event InvoiceIdRequested(uint256 indexed requestId, address indexed requester, uint256 invoiceCounter);
    event InvoiceIdGenerated(uint256 indexed requestId, address indexed requester, uint256 invoiceId);
    event AuthorizedCallerUpdated(address indexed caller, bool authorized);
    
    // ============ ERRORS ============
    error UnauthorizedCaller();
    error RequestNotFound();
    error InsufficientLinkBalance();
    
    // ============ MODIFIERS ============
    modifier onlyAuthorizedCaller() {
        if (!authorizedCallers[msg.sender] && msg.sender != owner()) {
            revert UnauthorizedCaller();
        }
        _;
    }
    
    constructor(
        uint64 subscriptionId,
        address vrfCoordinator,
        bytes32 gasLane,
        uint32 callbackGasLimit
    ) VRFConsumerBaseV2(vrfCoordinator) ConfirmedOwner(msg.sender) {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinator);
        i_subscriptionId = subscriptionId;
        i_gasLane = gasLane;
        i_callbackGasLimit = callbackGasLimit;
        
        // Authorize owner by default
        authorizedCallers[msg.sender] = true;
    }
    
    // ============ MAIN FUNCTIONS ============
    
    /**
     * @notice Request a secure random invoice ID
     * @param invoiceCounter The current invoice counter for entropy
     * @return requestId The VRF request ID
     */
    function requestInvoiceId(uint256 invoiceCounter) external onlyAuthorizedCaller returns (uint256 requestId) {
        // Request randomness from Chainlink VRF
        requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        
        // Store request data
        requestIdToSender[requestId] = msg.sender;
        requestIdToInvoiceCounter[requestId] = invoiceCounter;
        lastRequestId[msg.sender] = requestId;
        
        emit InvoiceIdRequested(requestId, msg.sender, invoiceCounter);
        
        return requestId;
    }
    
    /**
     * @notice Callback function used by VRF Coordinator
     * @param requestId The request ID
     * @param randomWords Array of random values
     */
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        address requester = requestIdToSender[requestId];
        uint256 invoiceCounter = requestIdToInvoiceCounter[requestId];
        
        if (requester == address(0)) {
            revert RequestNotFound();
        }
        
        // Generate invoice ID using randomness and counter
        // Ensure it's a reasonable range (e.g., 100000 to 999999999)
        uint256 randomValue = randomWords[0];
        uint256 invoiceId = 100000 + (randomValue % 899900000) + invoiceCounter;
        
        // Store generated invoice ID
        generatedInvoiceId[requester] = invoiceId;
        
        emit InvoiceIdGenerated(requestId, requester, invoiceId);
        
        // Clean up request data
        delete requestIdToSender[requestId];
        delete requestIdToInvoiceCounter[requestId];
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @notice Get the last generated invoice ID for a caller
     * @param caller The address that requested the invoice ID
     * @return invoiceId The generated invoice ID (0 if not ready)
     */
    function getGeneratedInvoiceId(address caller) external view returns (uint256) {
        return generatedInvoiceId[caller];
    }
    
    /**
     * @notice Check if an invoice ID is ready for a caller
     * @param caller The address that requested the invoice ID
     * @return ready True if invoice ID is ready
     */
    function isInvoiceIdReady(address caller) external view returns (bool) {
        return generatedInvoiceId[caller] != 0;
    }
    
    /**
     * @notice Get the last request ID for a caller
     * @param caller The address that made the request
     * @return requestId The last request ID
     */
    function getLastRequestId(address caller) external view returns (uint256) {
        return lastRequestId[caller];
    }
    
    /**
     * @notice Check if caller is authorized
     * @param caller The address to check
     * @return authorized True if caller is authorized
     */
    function isAuthorizedCaller(address caller) external view returns (bool) {
        return authorizedCallers[caller] || caller == owner();
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @notice Set authorized caller
     * @param caller The address to authorize/deauthorize
     * @param authorized True to authorize, false to deauthorize
     */
    function setAuthorizedCaller(address caller, bool authorized) external onlyOwner {
        authorizedCallers[caller] = authorized;
        emit AuthorizedCallerUpdated(caller, authorized);
    }
    
    /**
     * @notice Consume generated invoice ID (called by authorized caller)
     * @param caller The caller whose invoice ID to consume
     * @return invoiceId The consumed invoice ID
     */
    function consumeInvoiceId(address caller) external onlyAuthorizedCaller returns (uint256 invoiceId) {
        invoiceId = generatedInvoiceId[caller];
        require(invoiceId != 0, "No invoice ID ready");
        
        // Clear the generated ID
        delete generatedInvoiceId[caller];
        
        return invoiceId;
    }
    
    /**
     * @notice Emergency function to manually set invoice ID (owner only)
     * @param caller The caller to set invoice ID for
     * @param invoiceId The invoice ID to set
     */
    function emergencySetInvoiceId(address caller, uint256 invoiceId) external onlyOwner {
        generatedInvoiceId[caller] = invoiceId;
        emit InvoiceIdGenerated(0, caller, invoiceId);
    }
    
    // ============ UTILITY FUNCTIONS ============
    
    /**
     * @notice Generate a deterministic invoice ID as fallback
     * @param invoiceCounter The current invoice counter
     * @param supplier The supplier address
     * @return invoiceId A deterministic invoice ID
     */
    function generateFallbackInvoiceId(
        uint256 invoiceCounter,
        address supplier
    ) external view returns (uint256 invoiceId) {
        // Use block hash and supplier address for deterministic randomness
        bytes32 hash = keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            supplier,
            invoiceCounter
        ));
        
        uint256 randomValue = uint256(hash);
        invoiceId = 100000 + (randomValue % 899900000) + invoiceCounter;
        
        return invoiceId;
    }
    
    /**
     * @notice Get VRF configuration
     */
    function getVRFConfig() external view returns (
        uint64 subscriptionId,
        bytes32 gasLane,
        uint32 callbackGasLimit,
        uint16 requestConfirmations
    ) {
        return (
            i_subscriptionId,
            i_gasLane,
            i_callbackGasLimit,
            REQUEST_CONFIRMATIONS
        );
    }
}
