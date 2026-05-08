import { useState } from "react";
import { useAccount, useWriteContract, usePublicClient, useSignTypedData } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { UserCheck, Eye, EyeOff, Loader2, ShieldCheck, Lock } from "lucide-react";
import { SHIELDFI_ADDRESS, SHIELDFI_ABI, getInvoiceStatus, type InvoiceMetadata } from "@/lib/contract";
import { getFhevmInstance } from "@/lib/fhevm";
import { InvoiceTable } from "@/components/InvoiceTable";
import { TxStatus } from "@/components/TxStatus";
import { useToast } from "@/hooks/use-toast";

type AmountViewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; valueUsd: string }
  | { status: "error"; error: string };

function formatCents(val: bigint): string {
  const dollars = Number(val) / 100;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(dollars);
}

export default function Buyer() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { signTypedDataAsync } = useSignTypedData();
  const publicClient = usePublicClient();
  const { toast } = useToast();

  const [invoices, setInvoices] = useState<InvoiceMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);
  const [txStatuses, setTxStatuses] = useState<Record<string, { status: "idle" | "pending" | "success" | "error"; hash?: string; error?: string }>>({});
  const [amountViews, setAmountViews] = useState<Record<string, AmountViewState>>({});

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

  async function handleViewAmount(invoiceId: bigint) {
    if (!address || !publicClient) return;
    const key = invoiceId.toString();
    setAmountViews(prev => ({ ...prev, [key]: { status: "loading" } }));

    try {
      const handle = await publicClient.readContract({
        address: SHIELDFI_ADDRESS,
        abi: SHIELDFI_ABI,
        functionName: "getMyInvoiceAmount",
        args: [invoiceId],
      }) as `0x${string}`;

      const instance = await getFhevmInstance();
      const { publicKey, privateKey } = instance.generateKeypair();
      const startTimestamp = Math.floor(Date.now() / 1000);
      const durationDays = 1;
      const eip712 = instance.createEIP712(publicKey, [SHIELDFI_ADDRESS], startTimestamp, durationDays);

      const signature = await signTypedDataAsync({
        domain: eip712.domain as Parameters<typeof signTypedDataAsync>[0]["domain"],
        types: {
          UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
        } as Parameters<typeof signTypedDataAsync>[0]["types"],
        primaryType: eip712.primaryType,
        message: eip712.message as Record<string, unknown>,
      });

      const results = await instance.userDecrypt(
        [{ handle, contractAddress: SHIELDFI_ADDRESS }],
        privateKey,
        publicKey,
        signature,
        [SHIELDFI_ADDRESS],
        address,
        startTimestamp,
        durationDays,
      );

      const decryptedVal = Object.values(results)[0] as bigint;
      const formatted = formatCents(decryptedVal);

      setAmountViews(prev => ({ ...prev, [key]: { status: "done", valueUsd: formatted } }));
      toast({ title: "Amount Decrypted", description: `Invoice #${key}: ${formatted}` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setAmountViews(prev => ({ ...prev, [key]: { status: "error", error: msg } }));
      toast({ title: "Decryption Failed", description: msg, variant: "destructive" });
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
        <UserCheck className="w-12 h-12 text-yellow-400" />
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
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center">
          <UserCheck className="w-5 h-5 text-black" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Buyer Dashboard</h1>
          <p className="text-xs text-slate-500 font-mono">{address}</p>
        </div>
      </div>

      {/* Privacy + decrypt info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-400/8 border border-yellow-400/20 text-sm text-slate-300">
        <ShieldCheck className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <span className="font-medium text-yellow-400">Your Invoice Privacy: </span>
          The invoice amount is encrypted on-chain using Zama FHE.
          <strong className="text-slate-200"> Only you and the regulator can view it</strong> — competitors, other financiers, and the public cannot.
          Use the <em>"View Amount"</em> button to decrypt your specific invoice amount via the Zama Gateway before approving.
        </div>
      </div>

      {/* Invoice list */}
      <div className="rounded-xl glass border border-white/8 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="font-semibold text-white text-sm">Invoices Addressed to You</h2>
          <button
            onClick={loadBuyerInvoices}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-yellow-400 hover:text-yellow-300 transition-colors disabled:opacity-50"
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
            const av = amountViews[key] ?? { status: "idle" };

            if (status === "financed") {
              return <span className="text-xs text-slate-500">Financed</span>;
            }

            return (
              <div className="space-y-2 min-w-[180px]">
                {/* View Amount button */}
                <div className="space-y-1.5">
                  {av.status === "done" ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-400/10 border border-yellow-400/20">
                      <EyeOff className="w-3 h-3 text-yellow-400 shrink-0" />
                      <span className="text-xs font-mono font-semibold text-yellow-300">{av.valueUsd}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleViewAmount(inv.invoiceId)}
                      disabled={av.status === "loading"}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 border border-white/10 hover:bg-yellow-400/8 hover:border-yellow-400/30 transition-all text-xs font-medium disabled:opacity-50 w-full"
                    >
                      {av.status === "loading" ? (
                        <><Loader2 className="w-3 h-3 animate-spin" /> Decrypting...</>
                      ) : (
                        <><Eye className="w-3 h-3 text-yellow-400" /> View My Invoice Amount</>
                      )}
                    </button>
                  )}
                  {av.status === "error" && (
                    <p className="text-[10px] text-red-400 leading-snug">{av.error.slice(0, 80)}</p>
                  )}
                </div>

                {/* Approve / approved state */}
                {inv.buyerApproved ? (
                  <span className="badge-approved">Approved</span>
                ) : (
                  <>
                    <div className="flex items-start gap-1.5 text-[10px] text-slate-500 leading-snug max-w-[200px]">
                      <Lock className="w-2.5 h-2.5 text-slate-600 mt-0.5 shrink-0" />
                      Amount is FHE-encrypted. Only you &amp; the regulator can view it — competitors &amp; the public cannot.
                    </div>
                    <button
                      onClick={() => handleApprove(inv.invoiceId)}
                      disabled={approving === key}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-400/15 text-yellow-400 border border-yellow-400/25 hover:bg-yellow-400/25 transition-all text-xs font-medium disabled:opacity-50"
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
                  </>
                )}
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}
