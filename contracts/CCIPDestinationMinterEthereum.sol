// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {CCIPReceiver} from "@chainlink/contracts-ccip/contracts/applications/CCIPReceiver.sol";
import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/contracts/interfaces/IRouterClient.sol";
import {OwnerIsCreator} from "@chainlink/contracts/src/v0.8/shared/access/OwnerIsCreator.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IInvoiceNFT {
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
    ) external returns (uint256 tokenId);
}

/**
 * @title CCIPDestinationMinterEthereum
 * @notice Destination contract on Ethereum Sepolia for receiving invoice data and minting NFTs
 * @dev Receives invoice data from Mantle Sepolia via CCIP and mints NFTs
 */
contract CCIPDestinationMinterEthereum is CCIPReceiver, OwnerIsCreator {
    using SafeERC20 for IERC20;

    // ============ CCIP CONFIGURATION ============
    IRouterClient private immutable i_router;
    IERC20 private immutable i_linkToken;
    
    // Mantle Sepolia chain selector
    uint64 private constant MANTLE_SEPOLIA_CHAIN_SELECTOR = 5224473277236331295;
    
    // ============ STATE VARIABLES ============
    IInvoiceNFT public invoiceNFT;
    address public sourceMinter; // Address on Mantle Sepolia
    mapping(uint64 => bool) public allowlistedSourceChains;
    mapping(address => bool) public allowlistedSenders;
    
    // ============ TRACKING ============
    mapping(bytes32 => MintingRecord) public mintingRecords;
    mapping(uint256 => bytes32) public invoiceToMessageId;
    uint256 public totalNFTsMinted;
    
    // ============ STRUCTS ============
    struct MintingRecord {
        uint256 invoiceId;
        uint256 tokenId;
        address recipient;
        uint256 timestamp;
        bytes32 sourceMessageId;
        bool confirmed;
    }
    
    // ============ EVENTS ============
    event InvoiceNFTMinted(
        bytes32 indexed messageId,
        uint256 indexed invoiceId,
        uint256 indexed tokenId,
        address recipient,
        string commodity,
        uint256 amount
    );
    
    event ConfirmationSent(
        bytes32 indexed originalMessageId,
        bytes32 indexed confirmationMessageId,
        uint64 indexed destinationChain
    );
    
    event InvoiceNFTContractUpdated(address indexed oldContract, address indexed newContract);
    event SourceMinterUpdated(address indexed oldMinter, address indexed newMinter);
    
    // ============ ERRORS ============
    error SourceChainNotAllowlisted(uint64 sourceChainSelector);
    error SenderNotAllowlisted(address sender);
    error InvalidInvoiceNFTContract();
    error MintingFailed();
    error NotEnoughBalance(uint256 currentBalance, uint256 calculatedFees);
    error NothingToWithdraw();
    error FailedToWithdrawEth(address owner, address target, uint256 value);
    
    constructor(
        address _router,
        address _link,
        address _invoiceNFT
    ) CCIPReceiver(_router) {
        i_router = IRouterClient(_router);
        i_linkToken = IERC20(_link);
        invoiceNFT = IInvoiceNFT(_invoiceNFT);
        
        // Allowlist Mantle Sepolia
        allowlistedSourceChains[MANTLE_SEPOLIA_CHAIN_SELECTOR] = true;
    }
    
    // ============ MAIN FUNCTIONS ============
    
    /**
     * @notice Handle incoming CCIP messages from Mantle Sepolia
     */
    function _ccipReceive(
        Client.Any2EVMMessage memory any2EvmMessage
    ) internal override {
        // Validate source chain
        if (!allowlistedSourceChains[any2EvmMessage.sourceChainSelector]) {
            revert SourceChainNotAllowlisted(any2EvmMessage.sourceChainSelector);
        }
        
        // Validate sender
        address sender = abi.decode(any2EvmMessage.sender, (address));
        if (!allowlistedSenders[sender] && sender != sourceMinter) {
            revert SenderNotAllowlisted(sender);
        }
        
        // Decode invoice data
        (
            uint256 invoiceId,
            string memory commodity,
            uint256 amount,
            string memory supplierCountry,
            string memory buyerCountry,
            string memory exporterName,
            string memory buyerName,
            address supplier,
            uint256 dueDate,
            string memory documentHash,
            uint256 riskScore,
            string memory creditRating,
            bool verified
        ) = abi.decode(
            any2EvmMessage.data,
            (uint256, string, uint256, string, string, string, string, address, uint256, string, uint256, string, bool)
        );
        
        // Only mint if verified
        if (!verified) {
            return; // Skip unverified invoices
        }
        
        // Mint NFT
        uint256 tokenId = _mintInvoiceNFT(
            supplier,
            invoiceId,
            commodity,
            amount,
            supplierCountry,
            buyerCountry,
            exporterName,
            buyerName,
            dueDate,
            documentHash,
            riskScore,
            creditRating
        );
        
        // Record minting
        bytes32 messageId = any2EvmMessage.messageId;
        mintingRecords[messageId] = MintingRecord({
            invoiceId: invoiceId,
            tokenId: tokenId,
            recipient: supplier,
            timestamp: block.timestamp,
            sourceMessageId: messageId,
            confirmed: false
        });
        
        invoiceToMessageId[invoiceId] = messageId;
        totalNFTsMinted++;
        
        emit InvoiceNFTMinted(
            messageId,
            invoiceId,
            tokenId,
            supplier,
            commodity,
            amount
        );
        
        // Send confirmation back to source chain
        _sendConfirmation(messageId, tokenId, address(invoiceNFT));
    }
    
    /**
     * @notice Mint invoice NFT
     */
    function _mintInvoiceNFT(
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
    ) private returns (uint256 tokenId) {
        if (address(invoiceNFT) == address(0)) {
            revert InvalidInvoiceNFTContract();
        }
        
        try invoiceNFT.mintInvoiceNFT(
            to,
            invoiceId,
            commodity,
            amount,
            supplierCountry,
            buyerCountry,
            exporterName,
            buyerName,
            dueDate,
            documentHash,
            riskScore,
            creditRating
        ) returns (uint256 _tokenId) {
            return _tokenId;
        } catch {
            revert MintingFailed();
        }
    }
    
    /**
     * @notice Send confirmation back to source chain
     */
    function _sendConfirmation(
        bytes32 originalMessageId,
        uint256 tokenId,
        address nftContract
    ) private {
        if (sourceMinter == address(0)) {
            return; // Skip if source minter not set
        }
        
        // Encode confirmation data
        bytes memory data = abi.encode(originalMessageId, tokenId, nftContract);
        
        // Create CCIP message
        Client.EVM2AnyMessage memory evm2AnyMessage = Client.EVM2AnyMessage({
            receiver: abi.encode(sourceMinter),
            data: data,
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: 200_000})
            ),
            feeToken: address(i_linkToken)
        });
        
        // Calculate fees
        uint256 fees = i_router.getFee(MANTLE_SEPOLIA_CHAIN_SELECTOR, evm2AnyMessage);
        
        // Check LINK balance and send if sufficient
        if (fees <= i_linkToken.balanceOf(address(this))) {
            i_linkToken.approve(address(i_router), fees);
            
            bytes32 confirmationMessageId = i_router.ccipSend(
                MANTLE_SEPOLIA_CHAIN_SELECTOR,
                evm2AnyMessage
            );
            
            // Mark as confirmed
            mintingRecords[originalMessageId].confirmed = true;
            
            emit ConfirmationSent(
                originalMessageId,
                confirmationMessageId,
                MANTLE_SEPOLIA_CHAIN_SELECTOR
            );
        }
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @notice Get minting record by message ID
     */
    function getMintingRecord(bytes32 messageId) external view returns (MintingRecord memory) {
        return mintingRecords[messageId];
    }
    
    /**
     * @notice Get message ID by invoice ID
     */
    function getMessageIdByInvoice(uint256 invoiceId) external view returns (bytes32) {
        return invoiceToMessageId[invoiceId];
    }
    
    /**
     * @notice Check if source chain is allowlisted
     */
    function isSourceChainAllowlisted(uint64 chainSelector) external view returns (bool) {
        return allowlistedSourceChains[chainSelector];
    }
    
    /**
     * @notice Check if sender is allowlisted
     */
    function isSenderAllowlisted(address sender) external view returns (bool) {
        return allowlistedSenders[sender];
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @notice Set invoice NFT contract
     */
    function setInvoiceNFTContract(address _invoiceNFT) external onlyOwner {
        address oldContract = address(invoiceNFT);
        invoiceNFT = IInvoiceNFT(_invoiceNFT);
        emit InvoiceNFTContractUpdated(oldContract, _invoiceNFT);
    }
    
    /**
     * @notice Set source minter address
     */
    function setSourceMinter(address _sourceMinter) external onlyOwner {
        address oldMinter = sourceMinter;
        sourceMinter = _sourceMinter;
        allowlistedSenders[_sourceMinter] = true;
        emit SourceMinterUpdated(oldMinter, _sourceMinter);
    }
    
    /**
     * @notice Allowlist source chain
     */
    function allowlistSourceChain(uint64 _sourceChainSelector, bool allowed) external onlyOwner {
        allowlistedSourceChains[_sourceChainSelector] = allowed;
    }
    
    /**
     * @notice Allowlist sender
     */
    function allowlistSender(address _sender, bool allowed) external onlyOwner {
        allowlistedSenders[_sender] = allowed;
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
    
    // ============ RECEIVE FUNCTION ============
    receive() external payable {}
}
