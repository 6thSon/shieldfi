import type { Abi } from "viem";

// Contract address — update after deploying to Sepolia with: pnpm --filter @shieldfi/hardhat deploy:sepolia
export const SHIELDFI_ADDRESS = "0x0000000000000000000000000000000000000000" as `0x${string}`;

export const CHAIN_ID = 11155111; // Sepolia

export const SHIELDFI_ABI = [
  {
    type: "constructor",
    inputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "createInvoice",
    inputs: [
      { name: "buyer", type: "address" },
      { name: "inputAmount", type: "bytes32" },
      { name: "inputProof", type: "bytes" },
      { name: "inputDueDate", type: "bytes32" },
      { name: "dueDateProof", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "approveInvoice",
    inputs: [{ name: "invoiceId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "submitFinancingBid",
    inputs: [
      { name: "invoiceId", type: "uint256" },
      { name: "inputRate", type: "bytes32" },
      { name: "inputProof", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "acceptBid",
    inputs: [
      { name: "invoiceId", type: "uint256" },
      { name: "financier", type: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getMyInvoiceAmount",
    inputs: [{ name: "invoiceId", type: "uint256" }],
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "regulatorDecrypt",
    inputs: [{ name: "invoiceId", type: "uint256" }],
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getBidders",
    inputs: [{ name: "invoiceId", type: "uint256" }],
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getInvoiceMetadata",
    inputs: [{ name: "invoiceId", type: "uint256" }],
    outputs: [
      { name: "supplier", type: "address" },
      { name: "buyer", type: "address" },
      { name: "buyerApproved", type: "bool" },
      { name: "financed", type: "bool" },
      { name: "financier", type: "address" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "invoiceCounter",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "InvoiceCreated",
    inputs: [
      { name: "invoiceId", type: "uint256", indexed: true },
      { name: "supplier", type: "address", indexed: true },
      { name: "buyer", type: "address", indexed: true },
    ],
  },
  {
    type: "event",
    name: "InvoiceApproved",
    inputs: [
      { name: "invoiceId", type: "uint256", indexed: true },
      { name: "buyer", type: "address", indexed: true },
    ],
  },
  {
    type: "event",
    name: "BidSubmitted",
    inputs: [
      { name: "invoiceId", type: "uint256", indexed: true },
      { name: "financier", type: "address", indexed: true },
    ],
  },
  {
    type: "event",
    name: "InvoiceFinanced",
    inputs: [
      { name: "invoiceId", type: "uint256", indexed: true },
      { name: "financier", type: "address", indexed: true },
    ],
  },
  {
    type: "error",
    name: "OnlyBuyer",
    inputs: [],
  },
  {
    type: "error",
    name: "AlreadyApproved",
    inputs: [],
  },
  {
    type: "error",
    name: "InvoiceNotApproved",
    inputs: [],
  },
  {
    type: "error",
    name: "AlreadyFinanced",
    inputs: [],
  },
  {
    type: "error",
    name: "OnlySupplier",
    inputs: [],
  },
] as const satisfies Abi;

export type InvoiceStatus = "pending" | "approved" | "financed";

export interface InvoiceMetadata {
  invoiceId: bigint;
  supplier: `0x${string}`;
  buyer: `0x${string}`;
  buyerApproved: boolean;
  financed: boolean;
  financier: `0x${string}`;
}

export function getInvoiceStatus(meta: InvoiceMetadata): InvoiceStatus {
  if (meta.financed) return "financed";
  if (meta.buyerApproved) return "approved";
  return "pending";
}

export function shortenAddress(addr: string): string {
  if (!addr || addr === "0x0000000000000000000000000000000000000000") return "—";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
