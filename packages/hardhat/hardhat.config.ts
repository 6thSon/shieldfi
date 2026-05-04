import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const INFURA_API_KEY = process.env.INFURA_API_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const MNEMONIC = (process.env.MNEMONIC || "").trim();

// Detect if the secret is a raw private key (64 hex chars without 0x prefix,
// or 66 chars with 0x prefix) vs a BIP-39 mnemonic phrase (multiple words).
function getAccounts(): { mnemonic: string } | string[] {
  if (!MNEMONIC) {
    return { mnemonic: "test test test test test test test test test test test junk" };
  }
  const wordCount = MNEMONIC.split(/\s+/).length;
  if (wordCount >= 12) {
    return { mnemonic: MNEMONIC };
  }
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
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY,
    },
  },
  sourcify: {
    enabled: false,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
