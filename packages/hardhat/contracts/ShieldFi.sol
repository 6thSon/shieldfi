// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint64, externalEuint64, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ShieldFi
 * @notice Confidential Supply Chain Finance platform using Zama FHEVM
 * @dev Invoice amounts, due dates, and financing rates remain encrypted on-chain
 *      Only authorized parties (supplier, buyer, financier, regulator) can decrypt values
 */
contract ShieldFi is ZamaEthereumConfig, Ownable {

    struct Invoice {
        uint256 invoiceId;
        address supplier;
        address buyer;
        euint64 encryptedAmount;
        euint64 encryptedDueDate;
        bool buyerApproved;
        bool financed;
        address financier;
        euint64 encryptedFinancingRate;
    }

    uint256 public invoiceCounter;
    mapping(uint256 => Invoice) public invoices;
    mapping(uint256 => mapping(address => euint64)) public financingBids;
    mapping(uint256 => address[]) private bidders;

    event InvoiceCreated(uint256 indexed invoiceId, address indexed supplier, address indexed buyer);
    event InvoiceApproved(uint256 indexed invoiceId, address indexed buyer);
    event BidSubmitted(uint256 indexed invoiceId, address indexed financier);
    event InvoiceFinanced(uint256 indexed invoiceId, address indexed financier);

    error OnlyBuyer();
    error AlreadyApproved();
    error InvoiceNotApproved();
    error AlreadyFinanced();
    error OnlySupplier();
    error InvoiceNotFound();

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Supplier creates a new confidential invoice
     * @param buyer The buyer's address who owes the invoice amount
     * @param inputAmount Encrypted invoice amount (encrypted client-side with fhevmjs)
     * @param inputProof Zero-knowledge proof for the encrypted amount
     * @param inputDueDate Encrypted days until payment is due
     * @param dueDateProof Zero-knowledge proof for the encrypted due date
     */
    function createInvoice(
        address buyer,
        externalEuint64 inputAmount,
        bytes calldata inputProof,
        externalEuint64 inputDueDate,
        bytes calldata dueDateProof
    ) external {
        uint256 invoiceId = ++invoiceCounter;

        euint64 encryptedAmount = FHE.fromExternal(inputAmount, inputProof);
        euint64 encryptedDueDate = FHE.fromExternal(inputDueDate, dueDateProof);

        FHE.allowThis(encryptedAmount);
        FHE.allow(encryptedAmount, msg.sender);
        FHE.allow(encryptedAmount, buyer);
        FHE.allow(encryptedAmount, owner());

        FHE.allowThis(encryptedDueDate);
        FHE.allow(encryptedDueDate, msg.sender);
        FHE.allow(encryptedDueDate, buyer);
        FHE.allow(encryptedDueDate, owner());

        euint64 zeroRate = FHE.asEuint64(0);
        FHE.allowThis(zeroRate);

        invoices[invoiceId] = Invoice({
            invoiceId: invoiceId,
            supplier: msg.sender,
            buyer: buyer,
            encryptedAmount: encryptedAmount,
            encryptedDueDate: encryptedDueDate,
            buyerApproved: false,
            financed: false,
            financier: address(0),
            encryptedFinancingRate: zeroRate
        });

        emit InvoiceCreated(invoiceId, msg.sender, buyer);
    }

    /**
     * @notice Buyer confirms they owe the invoice amount, enabling financing
     * @param invoiceId The invoice to approve
     */
    function approveInvoice(uint256 invoiceId) external {
        Invoice storage invoice = invoices[invoiceId];
        if (invoice.buyer != msg.sender) revert OnlyBuyer();
        if (invoice.buyerApproved) revert AlreadyApproved();

        invoice.buyerApproved = true;
        emit InvoiceApproved(invoiceId, msg.sender);
    }

    /**
     * @notice Financier submits an encrypted discount rate bid for an approved invoice
     * @param invoiceId The invoice to bid on (must be buyer-approved, not yet financed)
     * @param inputRate Encrypted discount rate (e.g., 4 = 4%) — encrypted client-side
     * @param inputProof Zero-knowledge proof for the encrypted rate
     */
    function submitFinancingBid(
        uint256 invoiceId,
        externalEuint64 inputRate,
        bytes calldata inputProof
    ) external {
        Invoice storage invoice = invoices[invoiceId];
        if (!invoice.buyerApproved) revert InvoiceNotApproved();
        if (invoice.financed) revert AlreadyFinanced();

        euint64 encryptedRate = FHE.fromExternal(inputRate, inputProof);

        FHE.allowThis(encryptedRate);
        FHE.allow(encryptedRate, msg.sender);
        FHE.allow(encryptedRate, invoice.supplier);
        FHE.allow(encryptedRate, owner());

        financingBids[invoiceId][msg.sender] = encryptedRate;
        bidders[invoiceId].push(msg.sender);

        emit BidSubmitted(invoiceId, msg.sender);
    }

    /**
     * @notice Supplier accepts a specific financier's bid, marking the invoice as financed
     * @param invoiceId The invoice to finance
     * @param financier The address of the chosen financier
     */
    function acceptBid(uint256 invoiceId, address financier) external {
        Invoice storage invoice = invoices[invoiceId];
        if (invoice.supplier != msg.sender) revert OnlySupplier();
        if (!invoice.buyerApproved) revert InvoiceNotApproved();
        if (invoice.financed) revert AlreadyFinanced();

        invoice.financed = true;
        invoice.financier = financier;
        invoice.encryptedFinancingRate = financingBids[invoiceId][financier];

        FHE.allowThis(invoice.encryptedFinancingRate);
        FHE.allow(invoice.encryptedFinancingRate, msg.sender);
        FHE.allow(invoice.encryptedFinancingRate, financier);
        FHE.allow(invoice.encryptedFinancingRate, owner());

        emit InvoiceFinanced(invoiceId, financier);
    }

    /**
     * @notice Returns the encrypted invoice amount — caller must have been granted access
     * @param invoiceId The invoice to query
     * @return The encrypted amount handle (only decryptable by authorized parties)
     */
    function getMyInvoiceAmount(uint256 invoiceId) external view returns (euint64) {
        return invoices[invoiceId].encryptedAmount;
    }

    /**
     * @notice Regulator/owner decrypts an invoice for compliance audit
     * @param invoiceId The invoice to decrypt
     * @return The encrypted amount handle (owner has been pre-authorized)
     */
    function regulatorDecrypt(uint256 invoiceId) external onlyOwner returns (euint64) {
        return invoices[invoiceId].encryptedAmount;
    }

    /**
     * @notice Returns all financiers who have submitted bids on an invoice
     * @param invoiceId The invoice to query
     */
    function getBidders(uint256 invoiceId) external view returns (address[] memory) {
        return bidders[invoiceId];
    }

    /**
     * @notice Returns public metadata for an invoice (no encrypted values)
     */
    function getInvoiceMetadata(uint256 invoiceId) external view returns (
        address supplier,
        address buyer,
        bool buyerApproved,
        bool financed,
        address financier
    ) {
        Invoice storage invoice = invoices[invoiceId];
        return (
            invoice.supplier,
            invoice.buyer,
            invoice.buyerApproved,
            invoice.financed,
            invoice.financier
        );
    }
}
