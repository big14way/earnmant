// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IRouterClient} from "@chainlink/contracts-ccip/contracts/interfaces/IRouterClient.sol";
import {OwnerIsCreator} from "@chainlink/contracts/src/v0.8/shared/access/OwnerIsCreator.sol";
import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/contracts/applications/CCIPReceiver.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title CCIPSourceMinterMantle
 * @notice Source contract on Mantle Sepolia for cross-chain invoice NFT minting
 * @dev Sends invoice data to Ethereum Sepolia for NFT minting via CCIP
 */
contract CCIPSourceMinterMantle is CCIPReceiver, OwnerIsCreator {
    using SafeERC20 for IERC20;

    // ============ CCIP CONFIGURATION ============
    IRouterClient private immutable i_router;
    IERC20 private immutable i_linkToken;
    
    // Ethereum Sepolia chain selector
    uint64 private constant ETHEREUM_SEPOLIA_CHAIN_SELECTOR = 16015286601757825753;
    
    // ============ STATE VARIABLES ============
    address public destinationMinter; // Address on Ethereum Sepolia
    mapping(bytes32 => InvoiceData) public pendingInvoices;
    mapping(address => bool) public authorizedCallers;
    
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
        uint256 timestamp;
    }
    
    // ============ EVENTS ============
    event InvoiceDataSent(
        bytes32 indexed messageId,
        uint64 indexed destinationChainSelector,
        address indexed receiver,
        InvoiceData invoiceData,
        uint256 fees
    );
    
    event NFTMintConfirmed(
        bytes32 indexed messageId,
        uint256 indexed invoiceId,
        uint256 indexed tokenId,
        address nftContract
    );
    
    event DestinationMinterUpdated(address indexed oldMinter, address indexed newMinter);
    event AuthorizedCallerUpdated(address indexed caller, bool authorized);
    
    // ============ ERRORS ============
    error NotEnoughBalance(uint256 currentBalance, uint256 calculatedFees);
    error NothingToWithdraw();
    error FailedToWithdrawEth(address owner, address target, uint256 value);
    error DestinationChainNotAllowlisted(uint64 destinationChainSelector);
    error SourceChainNotAllowlisted(uint64 sourceChainSelector);
    error SenderNotAllowlisted(address sender);
    error UnauthorizedCaller();
    error InvalidInvoiceData();
    
    // ============ MODIFIERS ============
    modifier onlyAuthorizedCaller() {
        if (!authorizedCallers[msg.sender] && msg.sender != owner()) {
            revert UnauthorizedCaller();
        }
        _;
    }
    
    constructor(address _router, address _link) CCIPReceiver(_router) {
        i_router = IRouterClient(_router);
        i_linkToken = IERC20(_link);
        
        // Authorize owner by default
        authorizedCallers[msg.sender] = true;
    }
    
    // ============ MAIN FUNCTIONS ============
    
    /**
     * @notice Send invoice data to Ethereum Sepolia for NFT minting
     * @param invoiceData The invoice data to send
     * @return messageId The CCIP message ID
     */
    function sendInvoiceForNFTMinting(
        InvoiceData memory invoiceData
    ) external onlyAuthorizedCaller returns (bytes32 messageId) {
        // Validate invoice data
        if (invoiceData.invoiceId == 0 || bytes(invoiceData.commodity).length == 0) {
            revert InvalidInvoiceData();
        }
        
        // Create CCIP message
        Client.EVM2AnyMessage memory evm2AnyMessage = _buildCCIPMessage(
            destinationMinter,
            invoiceData
        );
        
        // Calculate fees
        uint256 fees = i_router.getFee(ETHEREUM_SEPOLIA_CHAIN_SELECTOR, evm2AnyMessage);
        
        // Check LINK balance
        if (fees > i_linkToken.balanceOf(address(this))) {
            revert NotEnoughBalance(i_linkToken.balanceOf(address(this)), fees);
        }
        
        // Approve router to spend LINK
        i_linkToken.approve(address(i_router), fees);
        
        // Send message
        messageId = i_router.ccipSend(ETHEREUM_SEPOLIA_CHAIN_SELECTOR, evm2AnyMessage);
        
        // Store pending invoice
        pendingInvoices[messageId] = invoiceData;
        
        emit InvoiceDataSent(
            messageId,
            ETHEREUM_SEPOLIA_CHAIN_SELECTOR,
            destinationMinter,
            invoiceData,
            fees
        );
        
        return messageId;
    }
    
    /**
     * @notice Build CCIP message for invoice data
     */
    function _buildCCIPMessage(
        address _receiver,
        InvoiceData memory _invoiceData
    ) private view returns (Client.EVM2AnyMessage memory) {
        // Encode invoice data
        bytes memory data = abi.encode(
            _invoiceData.invoiceId,
            _invoiceData.commodity,
            _invoiceData.amount,
            _invoiceData.supplierCountry,
            _invoiceData.buyerCountry,
            _invoiceData.exporterName,
            _invoiceData.buyerName,
            _invoiceData.supplier,
            _invoiceData.dueDate,
            _invoiceData.documentHash,
            _invoiceData.riskScore,
            _invoiceData.creditRating,
            _invoiceData.verified,
            _invoiceData.timestamp
        );
        
        return Client.EVM2AnyMessage({
            receiver: abi.encode(_receiver),
            data: data,
            tokenAmounts: new Client.EVMTokenAmount[](0), // No tokens being sent
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: 500_000}) // Gas limit for destination
            ),
            feeToken: address(i_linkToken)
        });
    }
    
    /**
     * @notice Handle incoming CCIP messages (confirmations from destination)
     */
    function _ccipReceive(
        Client.Any2EVMMessage memory any2EvmMessage
    ) internal override {
        // Decode confirmation data
        (bytes32 originalMessageId, uint256 tokenId, address nftContract) = abi.decode(
            any2EvmMessage.data,
            (bytes32, uint256, address)
        );
        
        // Get original invoice data
        InvoiceData memory invoiceData = pendingInvoices[originalMessageId];
        
        emit NFTMintConfirmed(
            originalMessageId,
            invoiceData.invoiceId,
            tokenId,
            nftContract
        );
        
        // Clean up pending invoice
        delete pendingInvoices[originalMessageId];
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @notice Get fee estimate for sending invoice data
     */
    function getFeeEstimate(InvoiceData memory invoiceData) external view returns (uint256) {
        Client.EVM2AnyMessage memory evm2AnyMessage = _buildCCIPMessage(
            destinationMinter,
            invoiceData
        );
        
        return i_router.getFee(ETHEREUM_SEPOLIA_CHAIN_SELECTOR, evm2AnyMessage);
    }
    
    /**
     * @notice Get pending invoice data by message ID
     */
    function getPendingInvoice(bytes32 messageId) external view returns (InvoiceData memory) {
        return pendingInvoices[messageId];
    }
    
    /**
     * @notice Check if caller is authorized
     */
    function isAuthorizedCaller(address caller) external view returns (bool) {
        return authorizedCallers[caller] || caller == owner();
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @notice Set destination minter address on Ethereum Sepolia
     */
    function setDestinationMinter(address _destinationMinter) external onlyOwner {
        address oldMinter = destinationMinter;
        destinationMinter = _destinationMinter;
        emit DestinationMinterUpdated(oldMinter, _destinationMinter);
    }
    
    /**
     * @notice Authorize/deauthorize caller
     */
    function setAuthorizedCaller(address caller, bool authorized) external onlyOwner {
        authorizedCallers[caller] = authorized;
        emit AuthorizedCallerUpdated(caller, authorized);
    }
    
    /**
     * @notice Withdraw LINK tokens
     */
    function withdrawToken(address _beneficiary, address _token) public onlyOwner {
        uint256 amount = IERC20(_token).balanceOf(address(this));
        
        if (amount == 0) revert NothingToWithdraw();
        
        IERC20(_token).safeTransfer(_beneficiary, amount);
    }
    
    /**
     * @notice Withdraw native tokens
     */
    function withdraw(address _beneficiary) public onlyOwner {
        uint256 amount = address(this).balance;
        
        if (amount == 0) revert NothingToWithdraw();
        
        (bool sent, ) = _beneficiary.call{value: amount}("");
        if (!sent) revert FailedToWithdrawEth(msg.sender, _beneficiary, amount);
    }
    
    // ============ EMERGENCY FUNCTIONS ============
    
    /**
     * @notice Emergency function to manually trigger NFT minting confirmation
     */
    function emergencyConfirmNFTMinting(
        bytes32 messageId,
        uint256 tokenId,
        address nftContract
    ) external onlyOwner {
        InvoiceData memory invoiceData = pendingInvoices[messageId];
        require(invoiceData.invoiceId != 0, "Invalid message ID");
        
        emit NFTMintConfirmed(messageId, invoiceData.invoiceId, tokenId, nftContract);
        delete pendingInvoices[messageId];
    }
    
    // ============ RECEIVE FUNCTION ============
    receive() external payable {}
}
