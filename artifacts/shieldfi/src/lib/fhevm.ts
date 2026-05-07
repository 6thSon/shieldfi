/**
 * FHEVM Client-Side Encryption — powered by @zama-fhe/relayer-sdk
 *
 * Uses the Zama relayer to perform real FHE encryption on Sepolia before
 * submitting any transaction. The relayer generates a ZK proof alongside the
 * ciphertext handle, which the ShieldFi contract validates via FHE.fromExternal().
 *
 * Docs: https://docs.zama.ai/protocol/getting-started/frontend
 */

import { createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk/web";

export interface EncryptedInput {
  handle: `0x${string}`;
  inputProof: `0x${string}`;
}

// Singleton instance promise — initialised once and reused across all calls
let instancePromise: ReturnType<typeof createInstance> | null = null;

function getNetworkUrl(): string {
  const key = import.meta.env.VITE_INFURA_API_KEY ?? "";
  return `https://sepolia.infura.io/v3/${key}`;
}

/**
 * Returns (and lazily initialises) the fhevm instance.
 * SepoliaConfig supplies all pre-configured contract addresses and the relayer URL
 * (https://relayer.testnet.zama.org) — we only need to add the RPC endpoint.
 */
export function getFhevmInstance(): ReturnType<typeof createInstance> {
  if (!instancePromise) {
    instancePromise = createInstance({
      ...SepoliaConfig,
      network: getNetworkUrl(),
    });
  }
  return instancePromise;
}

/**
 * Encrypts a uint64 value (invoice amount in USDC cents, or discount rate × 100)
 * using the Zama relayer SDK.  Returns the 32-byte ciphertext handle and the
 * associated ZK input-proof that the ShieldFi contract will verify on-chain.
 */
export async function encryptUint64(
  value: bigint,
  contractAddress: string,
  userAddress: string,
): Promise<EncryptedInput> {
  const instance = await getFhevmInstance();

  const input = instance.createEncryptedInput(contractAddress, userAddress);
  input.add64(value);

  // encrypt() is async in the relayer SDK — it contacts the relayer to get
  // the ZK proof signed by the Zama coprocessors
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
