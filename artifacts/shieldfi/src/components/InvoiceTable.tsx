import { Lock, ExternalLink } from "lucide-react";
import { shortenAddress, getInvoiceStatus, type InvoiceMetadata } from "@/lib/contract";

interface InvoiceTableProps {
  invoices: InvoiceMetadata[];
  actions?: (invoice: InvoiceMetadata) => React.ReactNode;
  emptyMessage?: string;
  showBidders?: boolean;
}

function StatusBadge({ status }: { status: "pending" | "approved" | "financed" }) {
  if (status === "financed") return <span className="badge-financed">Financed</span>;
  if (status === "approved") return <span className="badge-approved">Approved</span>;
  return <span className="badge-pending">Pending Approval</span>;
}

export function InvoiceTable({ invoices, actions, emptyMessage }: InvoiceTableProps) {
  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <Lock className="w-10 h-10 mb-3 opacity-40" />
        <p className="text-sm">{emptyMessage ?? "No invoices found"}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/5 text-slate-500 text-xs uppercase tracking-wider">
            <th className="text-left py-3 px-4 font-medium">Invoice ID</th>
            <th className="text-left py-3 px-4 font-medium">Supplier</th>
            <th className="text-left py-3 px-4 font-medium">Buyer</th>
            <th className="text-left py-3 px-4 font-medium">Amount</th>
            <th className="text-left py-3 px-4 font-medium">Due Date</th>
            <th className="text-left py-3 px-4 font-medium">Status</th>
            {actions && <th className="text-left py-3 px-4 font-medium">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {invoices.map((inv) => (
            <tr key={inv.invoiceId.toString()} className="hover:bg-white/2 transition-colors">
              <td className="py-3 px-4">
                <a
                  href={`https://sepolia.etherscan.io/address/${inv.supplier}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  #{inv.invoiceId.toString()}
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </td>
              <td className="py-3 px-4 font-mono text-slate-300 text-xs">
                {shortenAddress(inv.supplier)}
              </td>
              <td className="py-3 px-4 font-mono text-slate-300 text-xs">
                {shortenAddress(inv.buyer)}
              </td>
              <td className="py-3 px-4">
                <span className="badge-encrypted">
                  <Lock className="w-2.5 h-2.5" />
                  Confidential
                </span>
              </td>
              <td className="py-3 px-4">
                <span className="badge-encrypted">
                  <Lock className="w-2.5 h-2.5" />
                  Confidential
                </span>
              </td>
              <td className="py-3 px-4">
                <StatusBadge status={getInvoiceStatus(inv)} />
              </td>
              {actions && (
                <td className="py-3 px-4">
                  {actions(inv)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
