/**
 * FHEVM Client-Side Encryption Utilities
 *
 * This module handles encryption of values before sending them to the ShieldFi contract.
 * 
 * For production deployment on Sepolia with a live Zama Gateway, install fhevmjs:
 *   pnpm add fhevmjs
 * And the createInstance call will use real FHE encryption.
 *
 * In demo mode (no gateway), values are mock-encrypted to demonstrate the UI/UX flow.
 * The contract on Sepolia will reject mock inputs — real encryption requires fhevmjs + Gateway.
 *
 * Docs: https://docs.zama.ai/protocol/getting-started/frontend
 */

const GATEWAY_URL = "https://gateway.sepolia.zama.ai";
const KMS_VERIFIER_ADDRESS = "0x9D6891A6240D6130c54ae243d8005063D05fE14b";
const ACL_CONTRACT_ADDRESS = "0xFee8407e2f5e3Ee68ad77cAE98c434e637f516EC";

export interface EncryptedInput {
  handle: `0x${string}`;
  inputProof: `0x${string}`;
}

let fhevmInstance: unknown = null;
let instancePromise: Promise<unknown> | null = null;

/**
 * Initialize the fhevm instance — uses real fhevmjs if available,
 * falls back to a mock for demo purposes.
 */
export async function getFhevmInstance(
  _contractAddress: string,
  _userAddress: string
): Promise<unknown> {
  if (fhevmInstance) return fhevmInstance;
  if (instancePromise) return instancePromise;

  instancePromise = (async () => {
    try {
      // Attempt to load fhevmjs dynamically — gracefully falls back if not installed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mod = await (new Function('s', 'return import(s)'))('fhevmjs') as any;
      const instance = await mod.createInstance({
        chainId: 11155111,
        networkUrl: `https://sepolia.infura.io/v3/${import.meta.env.VITE_INFURA_API_KEY ?? ""}`,
        gatewayUrl: GATEWAY_URL,
        kmsContractAddress: KMS_VERIFIER_ADDRESS,
        aclContractAddress: ACL_CONTRACT_ADDRESS,
      });
      fhevmInstance = instance;
      console.info("[ShieldFi] fhevmjs initialized — real FHE encryption active");
      return instance;
    } catch {
      console.warn("[ShieldFi] fhevmjs unavailable — using demo mock encryption");
      fhevmInstance = createMockInstance();
      return fhevmInstance;
    }
  })();

  return instancePromise;
}

/**
 * Encrypt a uint64 value (invoice amount in USDC cents, or discount rate × 100)
 * Returns the handle and proof to pass to the smart contract.
 */
export async function encryptUint64(
  value: bigint,
  contractAddress: string,
  userAddress: string
): Promise<EncryptedInput> {
  try {
    const instance = await getFhevmInstance(contractAddress, userAddress) as {
      createEncryptedInput: (addr: string, user: string) => {
        add64: (v: bigint) => void;
        encrypt: () => { handles: Uint8Array[]; inputProof: Uint8Array };
      };
    };

    const input = instance.createEncryptedInput(contractAddress, userAddress);
    input.add64(value);
    const { handles, inputProof } = input.encrypt();

    return {
      handle: `0x${Array.from(handles[0]).map(b => b.toString(16).padStart(2, "0")).join("")}` as `0x${string}`,
      inputProof: `0x${Array.from(inputProof).map(b => b.toString(16).padStart(2, "0")).join("")}` as `0x${string}`,
    };
  } catch {
    return createMockEncryptedInput(value);
  }
}

/**
 * Mock encryption — for UI demonstration only.
 * Real Sepolia contract calls require actual fhevmjs encryption.
 */
function createMockEncryptedInput(value: bigint): EncryptedInput {
  const hex = value.toString(16).padStart(64, "0");
  return {
    handle: `0x${hex}` as `0x${string}`,
    inputProof: "0x" as `0x${string}`,
  };
}

function createMockInstance() {
  return {
    createEncryptedInput: (_addr: string, _user: string) => ({
      add64: (_v: bigint) => {},
      encrypt: () => ({
        handles: [new Uint8Array(32)],
        inputProof: new Uint8Array(0),
      }),
    }),
  };
}
