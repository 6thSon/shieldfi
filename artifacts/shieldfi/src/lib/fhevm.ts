/**
 * FHEVM Client-Side Encryption — @zama-fhe/relayer-sdk v0.4.3
 *
 * Correct initialization sequence for Sepolia browser environment:
 *  1. initSDK({ thread: 0 }) — loads WASM without SharedArrayBuffer/workers
 *  2. createInstance({ explicit addresses, relayerUrl, relayerRouteVersion: 2, network })
 *
 * Import from /web (lib/web.js) which is the real ES module.
 * /bundle is only a 3-line window.relayerSDK proxy for <script> tag usage.
 */

import { initSDK, createInstance } from "@zama-fhe/relayer-sdk/web";

export interface EncryptedInput {
  handle: `0x${string}`;
  inputProof: `0x${string}`;
}

// Singleton — initialised once on first use, reused for all subsequent encryptions
let instancePromise: ReturnType<typeof createInstance> | null = null;

// All Sepolia contract addresses pinned explicitly (sourced from SepoliaConfig)
// plus relayer settings that work in browser context.
const SEPOLIA_CONFIG = {
  chainId: 11155111,
  gatewayChainId: 10901,
  relayerUrl: "https://relayer.testnet.zama.org",
  relayerRouteVersion: 2 as const,
  kmsContractAddress:                       "0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A",
  aclContractAddress:                       "0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D",
  inputVerifierContractAddress:             "0xBBC1fFCdc7C316aAAd72E807D9b0272BE8F84DA0",
  verifyingContractAddressDecryption:       "0x5D8BD78e2ea6bbE41f26dFe9fdaEAa349e077478",
  verifyingContractAddressInputVerification:"0x483b9dE06E4E4C7D35CCf5837A1668487406D955",
  // Public Sepolia RPC — no API key needed, avoids Infura key dependency at WASM init time
  network: "https://ethereum-sepolia-rpc.publicnode.com",
};

export function getFhevmInstance(): ReturnType<typeof createInstance> {
  if (!instancePromise) {
    instancePromise = (async () => {
      console.log("[ShieldFi] FHE init: calling initSDK({ thread: 0 })...");
      // Must call initSDK first — loads the WASM modules (tfhe, tkms)
      // thread: 0 disables multi-threading (no SharedArrayBuffer required in browser)
      await initSDK({ thread: 0 });
      console.log("[ShieldFi] FHE init: initSDK done, calling createInstance...");

      const instance = await createInstance(SEPOLIA_CONFIG);

      console.log("[ShieldFi] FHE instance created successfully via Zama relayer");
      return instance;
    })();
  }
  return instancePromise;
}

/**
 * Encrypts a uint64 value using the Zama relayer SDK.
 * Returns the 32-byte ciphertext handle and the ZK input-proof that
 * ShieldFi.sol validates on-chain via FHE.fromExternal().
 */
export async function encryptUint64(
  value: bigint,
  contractAddress: string,
  userAddress: string,
): Promise<EncryptedInput> {
  const instance = await getFhevmInstance();

  const input = instance.createEncryptedInput(contractAddress, userAddress);
  input.add64(value);

  // encrypt() contacts the Zama relayer — gets ZK proof co-signed by coprocessors
  const { handles, inputProof } = await input.encrypt();

  const toHex = (bytes: Uint8Array): `0x${string}` =>
    `0x${Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")}` as `0x${string}`;

  return {
    handle: toHex(handles[0]),
    inputProof: toHex(inputProof),
  };
}
