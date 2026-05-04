import { useState } from "react";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { UserCheck, Loader2 } from "lucide-react";
import { SHIELDFI_ADDRESS, SHIELDFI_ABI, getInvoiceStatus, type InvoiceMetadata } from "@/lib/contract";
import { InvoiceTable } from "@/components/InvoiceTable";
import { TxStatus } from "@/components/TxStatus";
import { useToast } from "@/hooks/use-toast";

export default function Buyer() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const { toast } = useToast();

  const [invoices, setInvoices] = useState<InvoiceMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);
  const [txStatuses, setTxStatuses] = useState<Record<string, { status: "idle" | "pending" | "success" | "error"; hash?: string; error?: string }>>({});

  async function loadBuyerInvoices() {
    if (!address || !publicClient) return;
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

        if (meta[1].toLowerCase() === address.toLowerCase()) {
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

  async function handleApprove(invoiceId: bigint) {
    const key = invoiceId.toString();
    setApproving(key);
    setTxStatuses(prev => ({ ...prev, [key]: { status: "pending" } }));
    try {
      const hash = await writeContractAsync({
        address: SHIELDFI_ADDRESS,
        abi: SHIELDFI_ABI,
        functionName: "approveInvoice",
        args: [invoiceId],
      });
      setTxStatuses(prev => ({ ...prev, [key]: { status: "success", hash } }));
      toast({ title: "Invoice Approved", description: `Invoice #${key} confirmed — financiers can now bid` });
      loadBuyerInvoices();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTxStatuses(prev => ({ ...prev, [key]: { status: "error", error: msg } }));
      toast({ title: "Approval Failed", description: msg, variant: "destructive" });
    } finally {
      setApproving(null);
    }
  }

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col items-center gap-6">
        <UserCheck className="w-12 h-12 text-violet-400" />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Buyer Dashboard</h1>
          <p className="text-slate-400 mt-2">Connect your wallet to view and approve invoices addressed to you</p>
        </div>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <UserCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Buyer Dashboard</h1>
          <p className="text-xs text-slate-500 font-mono">{address}</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-violet-500/8 border border-violet-500/20 text-sm text-slate-300">
        <UserCheck className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
        <div>
          <span className="font-medium text-violet-400">Buyer Privacy Guarantee: </span>
          The invoice amounts are encrypted and not visible to you or anyone else on-chain.
          By approving, you confirm you have a legal obligation to pay the supplier — without revealing the amount publicly.
        </div>
      </div>

      {/* Invoice list */}
      <div className="rounded-xl glass border border-white/8 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="font-semibold text-white text-sm">Invoices Addressed to You</h2>
          <button
            onClick={loadBuyerInvoices}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 className="w-3 h-3 animate-spin" />}
            {loading ? "Loading..." : "Load Invoices"}
          </button>
        </div>

        <InvoiceTable
          invoices={invoices}
          emptyMessage="Click 'Load Invoices' to fetch invoices addressed to your wallet"
          actions={(inv) => {
            const key = inv.invoiceId.toString();
            const status = getInvoiceStatus(inv);
            const txSt = txStatuses[key];

            if (status === "financed") {
              return <span className="text-xs text-slate-500">Financed</span>;
            }
            if (inv.buyerApproved) {
              return <span className="badge-approved">Approved</span>;
            }
            return (
              <div className="space-y-2">
                <button
                  onClick={() => handleApprove(inv.invoiceId)}
                  disabled={approving === key}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/15 text-violet-400 border border-violet-500/25 hover:bg-violet-500/25 transition-all text-xs font-medium disabled:opacity-50"
                >
                  {approving === key ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> Approving...</>
                  ) : (
                    <><UserCheck className="w-3 h-3" /> Approve Invoice</>
                  )}
                </button>
                {txSt && (
                  <TxStatus
                    status={txSt.status}
                    txHash={txSt.hash}
                    error={txSt.error}
                    successMessage="Invoice approved"
                  />
                )}
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}
