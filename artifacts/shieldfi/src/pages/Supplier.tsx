import { useState } from "react";
import { useAccount, useWriteContract, useReadContract, usePublicClient } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Building2, Plus, Lock, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { SHIELDFI_ADDRESS, SHIELDFI_ABI, getInvoiceStatus, shortenAddress, type InvoiceMetadata } from "@/lib/contract";
import { encryptUint64 } from "@/lib/fhevm";
import { InvoiceTable } from "@/components/InvoiceTable";
import { TxStatus } from "@/components/TxStatus";
import { useToast } from "@/hooks/use-toast";

interface Bid {
  financier: `0x${string}`;
  invoiceId: bigint;
}

export default function Supplier() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const { toast } = useToast();

  // Form state
  const [buyer, setBuyer] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [createStatus, setCreateStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [createTxHash, setCreateTxHash] = useState<string>();
  const [createError, setCreateError] = useState<string>();

  // Invoice list
  const [myInvoices, setMyInvoices] = useState<InvoiceMetadata[]>([]);
  const [expandedBids, setExpandedBids] = useState<Set<string>>(new Set());
  const [bidders, setBidders] = useState<Record<string, `0x${string}`[]>>({});
  const [acceptingBid, setAcceptingBid] = useState<string | null>(null);

  // Fetch total invoice count to build list
  const { data: counter, refetch: refetchCounter } = useReadContract({
    address: SHIELDFI_ADDRESS,
    abi: SHIELDFI_ABI,
    functionName: "invoiceCounter",
  });

  async function loadMyInvoices() {
    if (!address || !counter || !publicClient) return;
    const total = Number(counter);
    const results: InvoiceMetadata[] = [];
    for (let i = 1; i <= total; i++) {
      const meta = await publicClient.readContract({
        address: SHIELDFI_ADDRESS,
        abi: SHIELDFI_ABI,
        functionName: "getInvoiceMetadata",
        args: [BigInt(i)],
      }) as readonly [`0x${string}`, `0x${string}`, boolean, boolean, `0x${string}`];
      if (meta[0].toLowerCase() === address.toLowerCase()) {
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
    setMyInvoices(results);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!address || !isConnected) return;
    setCreateStatus("pending");
    setCreateError(undefined);

    try {
      const amountVal = BigInt(Math.round(parseFloat(amount) * 100));
      const dueDateVal = BigInt(parseInt(dueDate));

      const encAmount = await encryptUint64(amountVal, SHIELDFI_ADDRESS, address);
      const encDueDate = await encryptUint64(dueDateVal, SHIELDFI_ADDRESS, address);

      const hash = await writeContractAsync({
        address: SHIELDFI_ADDRESS,
        abi: SHIELDFI_ABI,
        functionName: "createInvoice",
        args: [
          buyer as `0x${string}`,
          encAmount.handle,
          encAmount.inputProof,
          encDueDate.handle,
          encDueDate.inputProof,
        ],
      });

      setCreateTxHash(hash);
      setCreateStatus("success");
      setBuyer("");
      setAmount("");
      setDueDate("");
      await refetchCounter();
      loadMyInvoices();
      toast({ title: "Invoice Created", description: "Confidential invoice submitted to ShieldFi" });
    } catch (err: unknown) {
      setCreateStatus("error");
      setCreateError(err instanceof Error ? err.message : String(err));
    }
  }

  async function loadBidders(invoiceId: bigint) {
    if (!publicClient) return;
    const key = invoiceId.toString();
    try {
      const bids = await publicClient.readContract({
        address: SHIELDFI_ADDRESS,
        abi: SHIELDFI_ABI,
        functionName: "getBidders",
        args: [invoiceId],
      }) as `0x${string}`[];
      setBidders(prev => ({ ...prev, [key]: bids }));
    } catch {}
  }

  function toggleBids(invoiceId: bigint) {
    const key = invoiceId.toString();
    setExpandedBids(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
        loadBidders(invoiceId);
      }
      return next;
    });
  }

  async function handleAcceptBid(invoiceId: bigint, financier: `0x${string}`) {
    const key = `${invoiceId}-${financier}`;
    setAcceptingBid(key);
    try {
      await writeContractAsync({
        address: SHIELDFI_ADDRESS,
        abi: SHIELDFI_ABI,
        functionName: "acceptBid",
        args: [invoiceId, financier],
      });
      toast({ title: "Bid Accepted", description: `Invoice #${invoiceId} is now financed by ${shortenAddress(financier)}` });
      loadMyInvoices();
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to accept bid", variant: "destructive" });
    } finally {
      setAcceptingBid(null);
    }
  }

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col items-center gap-6">
        <Building2 className="w-12 h-12 text-cyan-400" />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Supplier Dashboard</h1>
          <p className="text-slate-400 mt-2">Connect your wallet to create and manage confidential invoices</p>
        </div>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Supplier Dashboard</h1>
          <p className="text-xs text-slate-500 font-mono">{address}</p>
        </div>
      </div>

      {/* Create Invoice Form */}
      <div className="rounded-xl glass border border-white/8 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
          <Plus className="w-4 h-4 text-cyan-400" />
          <h2 className="font-semibold text-white text-sm">Create Confidential Invoice</h2>
          <span className="badge-encrypted ml-auto">
            <Lock className="w-2.5 h-2.5" />
            FHE Encrypted
          </span>
        </div>
        <form onSubmit={handleCreate} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Buyer Wallet Address</label>
              <input
                type="text"
                placeholder="0x..."
                value={buyer}
                onChange={e => setBuyer(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">
                Invoice Amount (USDC)
                <span className="ml-1.5 badge-encrypted">
                  <Lock className="w-2 h-2" />
                  encrypted
                </span>
              </label>
              <input
                type="number"
                placeholder="500000.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">
                Days Until Due
                <span className="ml-1.5 badge-encrypted">
                  <Lock className="w-2 h-2" />
                  encrypted
                </span>
              </label>
              <input
                type="number"
                placeholder="90"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                required
                min="1"
                max="365"
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
              />
            </div>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="text-xs text-slate-500 max-w-md">
              Amount and due date will be encrypted client-side using fhevmjs before being sent to the ShieldFi contract.
              Only you, the buyer, and authorized regulators can decrypt these values.
            </div>
            <button
              type="submit"
              disabled={createStatus === "pending"}
              className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-semibold text-sm transition-all"
            >
              {createStatus === "pending" ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Encrypting...</>
              ) : (
                <><Lock className="w-4 h-4" /> Create Confidential Invoice</>
              )}
            </button>
          </div>

          <TxStatus
            status={createStatus}
            txHash={createTxHash}
            error={createError}
            successMessage="Invoice created and encrypted on-chain"
          />
        </form>
      </div>

      {/* My Invoices */}
      <div className="rounded-xl glass border border-white/8 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="font-semibold text-white text-sm">My Invoices</h2>
          <button
            onClick={loadMyInvoices}
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Refresh
          </button>
        </div>

        <InvoiceTable
          invoices={myInvoices}
          emptyMessage="No invoices yet — create one above"
          actions={(inv) => {
            const status = getInvoiceStatus(inv);
            const key = inv.invoiceId.toString();
            const isExpanded = expandedBids.has(key);
            const bids = bidders[key] ?? [];

            if (status === "financed") {
              return <span className="text-xs text-slate-500">Financed by {shortenAddress(inv.financier)}</span>;
            }
            if (status === "approved") {
              return (
                <div className="space-y-2">
                  <button
                    onClick={() => toggleBids(inv.invoiceId)}
                    className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {bids.length > 0 ? `${bids.length} bid(s)` : "View bids"}
                  </button>
                  {isExpanded && bids.length > 0 && (
                    <div className="space-y-1.5">
                      {bids.map(financier => (
                        <div key={financier} className="flex items-center gap-2">
                          <span className="font-mono text-xs text-slate-400">{shortenAddress(financier)}</span>
                          <span className="badge-encrypted text-xs">
                            <Lock className="w-2 h-2" /> Rate encrypted
                          </span>
                          <button
                            onClick={() => handleAcceptBid(inv.invoiceId, financier)}
                            disabled={acceptingBid === `${inv.invoiceId}-${financier}`}
                            className="text-xs px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 transition-all disabled:opacity-50"
                          >
                            {acceptingBid === `${inv.invoiceId}-${financier}` ? <Loader2 className="w-3 h-3 animate-spin inline" /> : "Accept Bid"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {isExpanded && bids.length === 0 && (
                    <span className="text-xs text-slate-500">No bids yet</span>
                  )}
                </div>
              );
            }
            return <span className="text-xs text-slate-500">Awaiting buyer approval</span>;
          }}
        />
      </div>
    </div>
  );
}
