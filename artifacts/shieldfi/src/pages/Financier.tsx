import { useState } from "react";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Landmark, Lock, Loader2 } from "lucide-react";
import { SHIELDFI_ADDRESS, SHIELDFI_ABI, shortenAddress, type InvoiceMetadata } from "@/lib/contract";
import { encryptUint64 } from "@/lib/fhevm";
import { TxStatus } from "@/components/TxStatus";
import { useToast } from "@/hooks/use-toast";

export default function Financier() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const { toast } = useToast();

  const [invoices, setInvoices] = useState<InvoiceMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [rates, setRates] = useState<Record<string, string>>({});
  const [bidStatuses, setBidStatuses] = useState<Record<string, { status: "idle" | "pending" | "success" | "error"; hash?: string; error?: string }>>({});

  async function loadApprovedInvoices() {
    if (!publicClient) return;
    setLoading(true);
    try {
      const counter = await publicClient.readContract({
        address: SHIELDFI_ADDRESS,
        abi: SHIELDFI_ABI,
        functionName: "invoiceCounter",
      }) as bigint;

      const results: InvoiceMetadata[] = [];
      const total = Number(counter);

      for (let i = 1; i <= total; i++) {
        const meta = await publicClient.readContract({
          address: SHIELDFI_ADDRESS,
          abi: SHIELDFI_ABI,
          functionName: "getInvoiceMetadata",
          args: [BigInt(i)],
        }) as readonly [`0x${string}`, `0x${string}`, boolean, boolean, `0x${string}`];

        // Only show buyer-approved, not-yet-financed invoices
        if (meta[2] && !meta[3]) {
          results.push({
            invoiceId: BigInt(i),
            supplier: meta[0],
            buyer: meta[1],
            buyerApproved: meta[2],
            financed: meta[3],
            financier: meta[4],
          });
        }
      }
      setInvoices(results);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitBid(inv: InvoiceMetadata) {
    if (!address || !isConnected) return;
    const key = inv.invoiceId.toString();
    const rateStr = rates[key];
    if (!rateStr) {
      toast({ title: "Enter a rate", description: "Please enter your discount rate percentage before bidding", variant: "destructive" });
      return;
    }

    const rateVal = BigInt(Math.round(parseFloat(rateStr) * 100));
    setBidStatuses(prev => ({ ...prev, [key]: { status: "pending" } }));

    try {
      const encRate = await encryptUint64(rateVal, SHIELDFI_ADDRESS, address);

      const hash = await writeContractAsync({
        address: SHIELDFI_ADDRESS,
        abi: SHIELDFI_ABI,
        functionName: "submitFinancingBid",
        args: [inv.invoiceId, encRate.handle, encRate.inputProof],
      });

      setBidStatuses(prev => ({ ...prev, [key]: { status: "success", hash } }));
      toast({ title: "Bid Submitted", description: `Encrypted bid of ${rateStr}% submitted for invoice #${key}` });
      setRates(prev => ({ ...prev, [key]: "" }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setBidStatuses(prev => ({ ...prev, [key]: { status: "error", error: msg } }));
      toast({ title: "Bid Failed", description: msg, variant: "destructive" });
    }
  }

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col items-center gap-6">
        <Landmark className="w-12 h-12 text-emerald-400" />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Financier Dashboard</h1>
          <p className="text-slate-400 mt-2">Connect your wallet to view approved invoices and submit confidential bids</p>
        </div>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
          <Landmark className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Financier Dashboard</h1>
          <p className="text-xs text-slate-500 font-mono">{address}</p>
        </div>
      </div>

      {/* Privacy notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/8 border border-emerald-500/20 text-sm text-slate-300">
        <Lock className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
        <div>
          <span className="font-medium text-emerald-400">Competitive Privacy: </span>
          Your discount rate bids are encrypted with fhevmjs before submission.
          Other financiers cannot see your bids — only the supplier (and regulator) can decrypt them.
          Invoice amounts are marked "Confidential" as they require explicit FHE access grants to read.
        </div>
      </div>

      {/* Available invoices */}
      <div className="rounded-xl glass border border-white/8 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-white text-sm">Approved Invoices Available for Financing</h2>
            <p className="text-xs text-slate-500 mt-0.5">Buyer-approved invoices not yet financed</p>
          </div>
          <button
            onClick={loadApprovedInvoices}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 className="w-3 h-3 animate-spin" />}
            {loading ? "Loading..." : "Load Invoices"}
          </button>
        </div>

        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Landmark className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">
              {loading ? "Loading..." : "Click 'Load Invoices' to fetch available opportunities"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {invoices.map((inv) => {
              const key = inv.invoiceId.toString();
              const bidSt = bidStatuses[key];

              return (
                <div key={key} className="p-5 hover:bg-white/2 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* Invoice info */}
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Invoice ID</p>
                        <p className="font-mono text-cyan-400 font-medium">#{key}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Supplier</p>
                        <p className="font-mono text-slate-300 text-xs">{shortenAddress(inv.supplier)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Buyer</p>
                        <p className="font-mono text-slate-300 text-xs">{shortenAddress(inv.buyer)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Amount</p>
                        <span className="badge-encrypted">
                          <Lock className="w-2.5 h-2.5" />
                          Confidential
                        </span>
                        <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed max-w-xs">
                          Amount is FHE-encrypted. Submit your bid rate based on buyer/supplier creditworthiness.
                          Amount is revealed to the winning financier after bid acceptance via Zama Gateway decryption.
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Due Date</p>
                        <span className="badge-encrypted">
                          <Lock className="w-2.5 h-2.5" />
                          Confidential
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Status</p>
                        <span className="badge-approved">Approved</span>
                      </div>
                    </div>

                    {/* Bid form */}
                    <div className="lg:w-72 space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-400">
                          Your Discount Rate (%)
                          <span className="ml-1.5 badge-encrypted">
                            <Lock className="w-2 h-2" />
                            encrypted
                          </span>
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="e.g. 4.0"
                            value={rates[key] ?? ""}
                            onChange={e => setRates(prev => ({ ...prev, [key]: e.target.value }))}
                            min="0"
                            max="99"
                            step="0.1"
                            className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
                          />
                          <button
                            onClick={() => handleSubmitBid(inv)}
                            disabled={bidSt?.status === "pending"}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 transition-all text-sm font-medium disabled:opacity-50 whitespace-nowrap"
                          >
                            {bidSt?.status === "pending" ? (
                              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Encrypting</>
                            ) : (
                              <><Lock className="w-3.5 h-3.5" /> Submit Bid</>
                            )}
                          </button>
                        </div>
                      </div>
                      {bidSt && bidSt.status !== "idle" && (
                        <TxStatus
                          status={bidSt.status}
                          txHash={bidSt.hash}
                          error={bidSt.error}
                          successMessage="Encrypted bid submitted"
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
