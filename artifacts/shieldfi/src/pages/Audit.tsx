import { useState } from "react";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Search, Lock, ExternalLink, ShieldCheck, Loader2, AlertTriangle } from "lucide-react";
import { SHIELDFI_ADDRESS, SHIELDFI_ABI, getInvoiceStatus, shortenAddress, type InvoiceMetadata } from "@/lib/contract";
import { TxStatus } from "@/components/TxStatus";
import { useToast } from "@/hooks/use-toast";

export default function Audit() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const { toast } = useToast();

  const [invoiceId, setInvoiceId] = useState("");
  const [meta, setMeta] = useState<InvoiceMetadata | null>(null);
  const [bidders, setBidders] = useState<`0x${string}`[]>([]);
  const [amountHandle, setAmountHandle] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [regulatorStatus, setRegulatorStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [regulatorError, setRegulatorError] = useState<string>();
  const [regulatorTx, setRegulatorTx] = useState<string>();

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!publicClient) return;
    setLoading(true);
    setMeta(null);
    setBidders([]);
    setAmountHandle(null);
    setNotFound(false);

    try {
      const id = BigInt(invoiceId);

      const [metaResult, biddersResult, handleResult] = await Promise.all([
        publicClient.readContract({
          address: SHIELDFI_ADDRESS,
          abi: SHIELDFI_ABI,
          functionName: "getInvoiceMetadata",
          args: [id],
        }),
        publicClient.readContract({
          address: SHIELDFI_ADDRESS,
          abi: SHIELDFI_ABI,
          functionName: "getBidders",
          args: [id],
        }),
        publicClient.readContract({
          address: SHIELDFI_ADDRESS,
          abi: SHIELDFI_ABI,
          functionName: "getMyInvoiceAmount",
          args: [id],
        }).catch(() => null),
      ]) as [
        readonly [`0x${string}`, `0x${string}`, boolean, boolean, `0x${string}`],
        `0x${string}`[],
        string | null,
      ];

      if (metaResult[0] === "0x0000000000000000000000000000000000000000") {
        setNotFound(true);
        return;
      }

      setMeta({
        invoiceId: id,
        supplier: metaResult[0],
        buyer: metaResult[1],
        buyerApproved: metaResult[2],
        financed: metaResult[3],
        financier: metaResult[4],
      });
      setBidders(biddersResult);
      if (handleResult) setAmountHandle(handleResult.toString());
    } catch (err) {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegulatorDecrypt() {
    if (!address) return;
    setRegulatorStatus("pending");
    setRegulatorError(undefined);
    try {
      const hash = await writeContractAsync({
        address: SHIELDFI_ADDRESS,
        abi: SHIELDFI_ABI,
        functionName: "regulatorDecrypt",
        args: [BigInt(invoiceId)],
      });
      setRegulatorTx(hash);
      setRegulatorStatus("success");
      toast({ title: "Regulator Decrypt Triggered", description: "The encrypted handle has been returned. Use Zama Gateway to complete decryption." });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setRegulatorStatus("error");
      setRegulatorError(msg);
    }
  }

  const status = meta ? getInvoiceStatus(meta) : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
          <Search className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Audit / Regulator View</h1>
          <p className="text-xs text-slate-500">Inspect public metadata and trigger authorized decryption</p>
        </div>
      </div>

      {/* Lookup form */}
      <div className="rounded-xl glass border border-white/8 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="font-semibold text-white text-sm">Invoice Lookup</h2>
        </div>
        <form onSubmit={handleLookup} className="p-5">
          <div className="flex gap-3">
            <input
              type="number"
              placeholder="Enter Invoice ID (e.g. 1)"
              value={invoiceId}
              onChange={e => setInvoiceId(e.target.value)}
              min="1"
              required
              className="flex-1 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30"
            />
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/25 hover:bg-amber-500/25 transition-all text-sm font-medium disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? "Looking up..." : "Look Up"}
            </button>
          </div>
        </form>
      </div>

      {notFound && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-500/8 border border-yellow-500/20 text-yellow-400 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Invoice #{invoiceId} not found on ShieldFi. Either it doesn't exist or the contract address needs to be updated after deployment.
        </div>
      )}

      {meta && (
        <>
          {/* Public metadata */}
          <div className="rounded-xl glass border border-white/8 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="font-semibold text-white text-sm">Public Metadata — Invoice #{invoiceId}</h2>
              <a
                href={`https://sepolia.etherscan.io/address/${SHIELDFI_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300"
              >
                View on Etherscan <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Invoice ID" value={`#${meta.invoiceId.toString()}`} mono />
              <Field label="Status">
                {status === "financed" ? <span className="badge-financed">Financed</span> :
                  status === "approved" ? <span className="badge-approved">Buyer Approved</span> :
                  <span className="badge-pending">Pending Approval</span>}
              </Field>
              <Field label="Supplier" value={meta.supplier} mono etherscan />
              <Field label="Buyer" value={meta.buyer} mono etherscan />
              <Field label="Buyer Approved" value={meta.buyerApproved ? "Yes" : "No"} />
              <Field label="Financed" value={meta.financed ? "Yes" : "No"} />
              {meta.financed && (
                <Field label="Financier" value={meta.financier} mono etherscan />
              )}
              <Field label="Invoice Amount">
                <span className="badge-encrypted">
                  <Lock className="w-2.5 h-2.5" />
                  Encrypted (FHE-protected)
                </span>
              </Field>
              <Field label="Due Date">
                <span className="badge-encrypted">
                  <Lock className="w-2.5 h-2.5" />
                  Encrypted (FHE-protected)
                </span>
              </Field>
            </div>
          </div>

          {/* Encrypted handles */}
          <div className="rounded-xl glass border border-white/8 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h2 className="font-semibold text-white text-sm">Encrypted Ciphertext Handles</h2>
              <p className="text-xs text-slate-500 mt-0.5">These handles reference the on-chain encrypted values. They are publicly visible but computationally unreadable without the private key.</p>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <p className="text-xs text-slate-500 mb-1.5">Amount Handle (euint64 ciphertext reference)</p>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/3 border border-white/8">
                  <Lock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <code className="text-xs text-cyan-300 break-all font-mono">
                    {amountHandle ?? "Encrypted — access not granted to this address"}
                  </code>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1.5">Financing Bids ({bidders.length} bid{bidders.length !== 1 ? "s" : ""} on record)</p>
                {bidders.length > 0 ? (
                  <div className="space-y-1.5">
                    {bidders.map((b, i) => (
                      <div key={b} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/3 border border-white/8">
                        <span className="text-xs text-slate-500">Bidder {i + 1}:</span>
                        <code className="text-xs font-mono text-slate-300">{b}</code>
                        <span className="badge-encrypted ml-auto">
                          <Lock className="w-2 h-2" />
                          Rate encrypted
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 px-3 py-2 rounded-lg bg-white/3 border border-white/8">No bids submitted yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Regulator decrypt */}
          <div className="rounded-xl glass border border-amber-500/15 overflow-hidden">
            <div className="px-5 py-4 border-b border-amber-500/15 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <h2 className="font-semibold text-white text-sm">Regulatory Decryption</h2>
              <span className="ml-auto text-xs text-amber-400/70 font-medium">Owner only</span>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-400">
                Full decryption of encrypted amounts is available only to the contract owner (regulator) for compliance audits.
                This calls <code className="text-amber-400 text-xs bg-white/5 px-1.5 py-0.5 rounded">regulatorDecrypt(invoiceId)</code> on-chain,
                returning the encrypted handle which can then be decrypted via the Zama Gateway.
              </p>

              {!isConnected ? (
                <div className="flex items-center gap-3">
                  <ConnectButton />
                  <span className="text-xs text-slate-500">Connect as the contract owner to proceed</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>Connected as:</span>
                    <code className="font-mono text-slate-300">{address}</code>
                  </div>
                  <button
                    onClick={handleRegulatorDecrypt}
                    disabled={regulatorStatus === "pending"}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/25 hover:bg-amber-500/25 transition-all text-sm font-medium disabled:opacity-50"
                  >
                    {regulatorStatus === "pending" ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                    ) : (
                      <><ShieldCheck className="w-4 h-4" /> Trigger Regulator Decrypt</>
                    )}
                  </button>
                  <TxStatus
                    status={regulatorStatus}
                    txHash={regulatorTx}
                    error={regulatorError}
                    successMessage="Decrypt triggered — use Zama Gateway to read the plaintext"
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Contract info */}
      <div className="p-4 rounded-xl bg-white/2 border border-white/5 space-y-2">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Contract Information</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">ShieldFi contract:</span>
          <code className="text-xs font-mono text-slate-300">{SHIELDFI_ADDRESS}</code>
          <a
            href={`https://sepolia.etherscan.io/address/${SHIELDFI_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400/70 hover:text-amber-400 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <p className="text-xs text-slate-600">
          Network: Sepolia Testnet (chainId: 11155111) — Zama FHEVM enabled
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
  etherscan,
  children,
}: {
  label: string;
  value?: string;
  mono?: boolean;
  etherscan?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      {children ?? (
        <div className="flex items-center gap-1.5">
          <span className={`text-sm text-slate-200 ${mono ? "font-mono text-xs" : ""} break-all`}>
            {value}
          </span>
          {etherscan && value && value !== "—" && (
            <a
              href={`https://sepolia.etherscan.io/address/${value}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-slate-300 transition-colors shrink-0"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
