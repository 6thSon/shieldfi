# ShieldFi — Confidential Supply Chain Finance dApp

## Overview

ShieldFi is a hackathon submission for the Zama FHEVM protocol. It enables confidential invoice financing on Ethereum Sepolia — invoice amounts, buyer identities, and financier bids are all FHE-encrypted on-chain using Zama's Fully Homomorphic Encryption.

## Project Structure

```
├── artifacts/
│   ├── shieldfi/          # React + Vite frontend (dark-themed DeFi app)
│   └── api-server/        # Express API server (health endpoint)
├── packages/
│   └── hardhat/           # Solidity smart contracts + deployment
│       ├── contracts/ShieldFi.sol   # Main FHEVM contract
│       ├── deploy/01_deploy_shieldfi.ts
│       └── test/ShieldFi.test.ts
├── lib/                   # Shared TypeScript libraries
└── .env.example           # Environment variables template
```

## Tech Stack

- **Smart Contracts**: Solidity 0.8.24 + Zama FHEVM (`euint64`, `externalEuint64`, TFHE ops)
- **Frontend**: React + Vite + Tailwind CSS v4
- **Wallet**: Wagmi v2 + RainbowKit (Sepolia testnet)
- **FHE Encryption**: fhevmjs (client-side encryption before tx submission)
- **Network**: Ethereum Sepolia (chainId: 11155111)
- **Deployment**: Hardhat + hardhat-deploy

## Key Commands

### Frontend
- `pnpm --filter @workspace/shieldfi run dev` — run frontend dev server
- `pnpm --filter @workspace/shieldfi run build` — build for production

### Smart Contracts
```bash
cd packages/hardhat
pnpm install
pnpm compile                    # compile contracts
pnpm test                       # run test suite
pnpm deploy:sepolia              # deploy to Sepolia testnet
```

### Database / API (monorepo)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-server run dev` — run API server
- `pnpm --filter @workspace/db run push` — push DB schema (dev only)

## ShieldFi Contract (ShieldFi.sol)

### Roles
- **Supplier**: creates encrypted invoices
- **Buyer**: approves invoices (confirms debt privately)
- **Financier**: submits encrypted discount rate bids
- **Regulator/Owner**: can decrypt any value for compliance

### Key Functions
| Function | Role | Description |
|----------|------|-------------|
| `createInvoice()` | Supplier | Creates invoice with FHE-encrypted amount + due date |
| `approveInvoice()` | Buyer | Confirms debt obligation privately |
| `submitFinancingBid()` | Financier | Submits encrypted discount rate bid |
| `acceptBid()` | Supplier | Accepts a specific financier's offer |
| `getMyInvoiceAmount()` | Authorized parties | Returns encrypted handle (decryptable by authorized) |
| `regulatorDecrypt()` | Owner only | Returns encrypted handle for full compliance decryption |

## Environment Variables

Required secrets (add in Replit Secrets panel):
- `MNEMONIC` — wallet mnemonic for Sepolia deployment
- `INFURA_API_KEY` — Infura API key for Sepolia RPC

## Deployment Steps

1. Add secrets: `MNEMONIC` and `INFURA_API_KEY` in Replit Secrets
2. Install Hardhat dependencies: `cd packages/hardhat && pnpm install`
3. Compile contract: `pnpm compile`
4. Deploy to Sepolia: `pnpm deploy:sepolia`
5. The deploy script auto-updates `artifacts/shieldfi/src/constants.ts` with the deployed address

## Frontend Pages

| Route | Role | Description |
|-------|------|-------------|
| `/` | All | Landing page with SCF explainer and role cards |
| `/supplier` | Supplier | Create invoices, view bids, accept financing |
| `/buyer` | Buyer | View and approve invoices addressed to you |
| `/financier` | Financier | Browse approved invoices, submit encrypted bids |
| `/audit` | Regulator | Inspect metadata, view encrypted handles, trigger decrypt |

## FHEVM Rules Applied

- `FHE.fromExternal()` — converts user inputs (never stores `externalEuint64` directly)
- `FHE.allowThis()` — grants contract access to encrypted values
- `FHE.allow(value, address)` — grants specific parties read access
- No direct `euint64` in `if/require` — uses boolean checks on public state only
- `euint64` used for financial amounts (supports up to ~18 quintillion)
- Contract extends `ZamaEthereumConfig` for Sepolia configuration
