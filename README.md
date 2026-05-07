# ShieldFi — Institutional-Grade Confidential Supply Chain Finance on Ethereum

## The $3 Trillion Problem Nobody Has Solved Onchain

Supply chain finance (SCF) is one of the largest financial markets in the world  
estimated at over $3 trillion annually. The mechanics are simple: a supplier ships 
goods to a large buyer and issues an invoice payable in 60–90 days. Rather than 
wait, the supplier sells that invoice to a financier at a small discount, receiving 
cash immediately. The financier collects the full amount from the buyer at maturity.

Industry titans like **Taulia** (acquired by SAP), **C2FO** (the world's largest 
working capital marketplace), and **Greensill Capital** (which collapsed in 2021 
managing $143B in SCF assets) have proven both the scale and the systemic risk of 
this market. Blockchain promises to fix the systemic risk through transparency and 
programmability but transparency is precisely what makes SCF impossible on public 
chains. Every invoice amount, every counterparty relationship, every discount rate 
is commercially sensitive data. A manufacturer's competitor should never see their 
contract terms with a major retailer. A financier's pricing model should never be 
visible to rivals. Today's onchain attempts, Goldfinch, Centrifuge, either retreat 
to private chains, trust centralized intermediaries to hide data, or require 
suppliers to expose their full financial relationships publicly. None of this is 
acceptable to institutions.

**ShieldFi is the first full-lifecycle confidential SCF protocol on a public 
blockchain.** Built on Zama's FHEVM, it runs the complete four-party supply chain 
finance workflow, invoice creation, buyer approval, competitive financier bidding, 
and deal acceptance with every sensitive value encrypted end-to-end. The EVM never 
processes a plaintext number. Institutions get programmable settlement on a public 
ledger without sacrificing the commercial confidentiality their compliance and 
competitive requirements demand.

## How ShieldFi Advances the State of the Art

Prior confidential finance dApps built on Zama FHEVM established the foundation:

- **BlindPay** (Zama Developer Program Season 1 winner) : confidential merchant 
  invoicing and payment. Stops at invoice → pay. No financing step, no multi-party 
  workflow.
- **Owrent** (ETHRome 2025 Zama track) : sealed-bid auction miniapp for invoice 
  and payroll factoring via group chat. Proof-of-concept for auctions and quick 
  settlement. Single-hop, no buyer approval layer, no regulator access architecture.

ShieldFi builds where they stopped:

| Feature | BlindPay | Owrent | **ShieldFi** |
|---|---|---|---|
| Encrypted invoice amounts | ✅ | ✅ | ✅ |
| Buyer approval workflow | ❌ | ❌ | ✅ |
| Competitive encrypted financing bids | ❌ | Partial | ✅ |
| Multi-party access control (4 roles) | ❌ | ❌ | ✅ |
| Regulator compliance key | ❌ | ❌ | ✅ |
| Verified source on Etherscan | ❌ | ❌ | ✅ |
| Full institutional SCF lifecycle | ❌ | ❌ | ✅ |

## Why FHE Is Not Optional Here

Zero-knowledge proofs can verify that a computation happened correctly, but they 
cannot compute *on* the encrypted data itself. A ZK system could prove "this invoice 
is valid" but cannot run competitive bid matching across encrypted amounts from 
multiple financiers without revealing those amounts first. FHE is the only 
cryptographic primitive that allows the contract to process, compare, and settle 
on encrypted values without decryption — making confidential multi-party SCF 
mathematically possible for the first time.

## Live Deployment
- **Network:** Ethereum Sepolia Testnet
- **Contract Address:** `0xa9315B4331e8bbB385EfB1b9606cE6dD25F3fB7C`
- **Verified Source:** https://sepolia.etherscan.io/address/0xa9315B4331e8bbB385EfB1b9606cE6dD25F3fB7C#code
- **Deploy Tx:** https://sepolia.etherscan.io/tx/0xbe015733a6339cc516f3d9fe2e8534387c917efbb3438effbd35d0343e7161c0
- **Live App:** https://secure-chain-finance--jonahjosemaria.replit.app/

## Tech Stack
- Smart Contracts: Solidity + Zama FHEVM (`@fhevm/solidity` v0.11.1)
- Frontend: React + Vite + Tailwind CSS + RainbowKit + wagmi v2
- Client Encryption: `fhevmjs` — amounts encrypted before leaving the browser
- Network: Ethereum Sepolia (chainId: 11155111)

## User Roles
- **Supplier** — creates confidential invoices (amount + due date FHE-encrypted)
- **Buyer** — approves invoices onchain confirming the debt obligation  
- **Financier** — browses approved invoices, submits encrypted discount rate bids
- **Regulator** — contract owner can trigger authorized decryption for compliance audit

## How to Run Locally
1. Clone this repository
2. `cd packages/hardhat && npm install`
3. Add `MNEMONIC` and `INFURA_API_KEY` to `packages/hardhat/.env`
4. `npm run compile && npm run deploy:sepolia`
5. `cd packages/nextjs && npm install`
6. Add `VITE_INFURA_API_KEY=your_key` to `packages/nextjs/.env`
7. `npm run dev` → open http://localhost:5173
8. Connect MetaMask to Sepolia (chainId: 11155111)

## Built With
- [Zama FHEVM Protocol](https://docs.zama.org/protocol)
- [fhevm-react-template](https://github.com/zama-ai/fhevm-react-template)
- [OpenZeppelin Confidential Contracts](https://github.com/OpenZeppelin/openzeppelin-confidential-contracts)
