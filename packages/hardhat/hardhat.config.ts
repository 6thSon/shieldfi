import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const INFURA_API_KEY = process.env.INFURA_API_KEY || "";
const MNEMONIC = (process.env.MNEMONIC || "").trim();

// Detect if the secret is a raw private key (64 hex chars without 0x prefix,
// or 66 chars with 0x prefix) vs a BIP-39 mnemonic phrase (multiple words).
function getAccounts(): { mnemonic: string } | string[] {
  if (!MNEMONIC) {
    // Fallback: hardhat default test mnemonic
    return { mnemonic: "test test test test test test test test test test test junk" };
  }
  const wordCount = MNEMONIC.split(/\s+/).length;
  if (wordCount >= 12) {
    // BIP-39 mnemonic phrase
    return { mnemonic: MNEMONIC };
  }
  // Raw private key (with or without 0x prefix)
  const key = MNEMONIC.startsWith("0x") ? MNEMONIC : `0x${MNEMONIC}`;
  return [key];
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "cancun",
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      chainId: 11155111,
      accounts: getAccounts(),
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
