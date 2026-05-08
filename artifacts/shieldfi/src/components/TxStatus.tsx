import { Loader2, CheckCircle2, XCircle, ExternalLink } from "lucide-react";

type Status = "idle" | "pending" | "success" | "error";

interface TxStatusProps {
  status: Status;
  txHash?: string;
  error?: string;
  successMessage?: string;
}

export function TxStatus({ status, txHash, error, successMessage }: TxStatusProps) {
  if (status === "idle") return null;

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg text-sm border ${
      status === "pending" ? "bg-yellow-400/10 border-yellow-400/25 text-yellow-300" :
      status === "success" ? "bg-green-500/10 border-green-500/25 text-green-300" :
      "bg-red-500/10 border-red-500/25 text-red-300"
    }`}>
      {status === "pending" && <Loader2 className="w-4 h-4 mt-0.5 animate-spin shrink-0" />}
      {status === "success" && <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />}
      {status === "error" && <XCircle className="w-4 h-4 mt-0.5 shrink-0" />}
      <div className="flex-1 min-w-0">
        {status === "pending" && <span>Transaction submitted — waiting for confirmation...</span>}
        {status === "success" && (
          <div className="flex items-center gap-2">
            <span>{successMessage ?? "Transaction confirmed"}</span>
            {txHash && (
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 underline underline-offset-2 opacity-80 hover:opacity-100"
              >
                View <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}
        {status === "error" && <span className="break-all">{error ?? "Transaction failed"}</span>}
      </div>
    </div>
  );
}
