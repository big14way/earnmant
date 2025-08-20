// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SimpleInvoiceProtocol
 * @dev A simple, working invoice submission contract for EarnX
 */
contract SimpleInvoiceProtocol {
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
        string documentHash;
        bool verified;
        uint256 createdAt;
    }
    
    uint256 public invoiceCounter;
    mapping(uint256 => Invoice) public invoices;
    mapping(address => uint256[]) public supplierInvoices;
    
    event InvoiceSubmitted(
        uint256 indexed invoiceId,
        address indexed supplier,
        address indexed buyer,
        uint256 amount,
        string commodity
    );
    
    constructor() {
        invoiceCounter = 0;
    }
    
    /**
     * @dev Submit a new invoice
     */
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
    ) external returns (uint256) {
        require(buyer != address(0), "Invalid buyer address");
        require(amount > 0, "Amount must be greater than 0");
        require(dueDate > block.timestamp, "Due date must be in the future");
        
        invoiceCounter++;
        uint256 invoiceId = invoiceCounter;
        
        invoices[invoiceId] = Invoice({
            id: invoiceId,
            supplier: msg.sender,
            buyer: buyer,
            amount: amount,
            commodity: commodity,
            supplierCountry: supplierCountry,
            buyerCountry: buyerCountry,
            exporterName: exporterName,
            buyerName: buyerName,
            dueDate: dueDate,
            documentHash: documentHash,
            verified: true, // Auto-verify for simplicity
            createdAt: block.timestamp
        });
        
        supplierInvoices[msg.sender].push(invoiceId);
        
        emit InvoiceSubmitted(invoiceId, msg.sender, buyer, amount, commodity);
        
        return invoiceId;
    }
    
    /**
     * @dev Get invoice details
     */
    function getInvoice(uint256 invoiceId) external view returns (Invoice memory) {
        require(invoiceId > 0 && invoiceId <= invoiceCounter, "Invalid invoice ID");
        return invoices[invoiceId];
    }
    
    /**
     * @dev Get total number of invoices
     */
    function getTotalInvoices() external view returns (uint256) {
        return invoiceCounter;
    }
    
    /**
     * @dev Get supplier's invoices
     */
    function getSupplierInvoices(address supplier) external view returns (uint256[] memory) {
        return supplierInvoices[supplier];
    }
}