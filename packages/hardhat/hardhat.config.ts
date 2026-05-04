import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const INFURA_API_KEY = process.env.INFURA_API_KEY || "";
// Single API key string — required for Etherscan API v2
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const MNEMONIC = (process.env.MNEMONIC || "").trim();

function getAccounts(): { mnemonic: string } | string[] {
  if (!MNEMONIC) {
    return { mnemonic: "test test test test test test test test test test test junk" };
  }
  const wordCount = MNEMONIC.split(/\s+/).length;
  if (wordCount >= 12) return { mnemonic: MNEMONIC };
  const key = MNEMONIC.startsWith("0x") ? MNEMONIC : `0x${MNEMONIC}`;
  return [key];
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "cancun",
    },
  },
  networks: {
    hardhat: { chainId: 31337 },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      chainId: 11155111,
      accounts: getAccounts(),
    },
  },
  // Single key string = Etherscan API v2 (works across all chains)
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  sourcify: { enabled: false },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
