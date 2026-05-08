import { ShieldCheck, Lock } from "lucide-react";

export function ZamaBanner() {
  return (
    <div className="w-full py-2 px-4 flex items-center justify-center gap-3 text-xs font-medium"
      style={{
        background: "linear-gradient(90deg, rgba(251,191,36,0.10) 0%, rgba(252,211,77,0.06) 50%, rgba(251,191,36,0.10) 100%)",
        borderBottom: "1px solid rgba(251,191,36,0.18)",
      }}
    >
      <Lock className="w-3.5 h-3.5 text-yellow-400" />
      <span className="text-slate-300">
        Built on{" "}
        <span className="text-yellow-400 font-semibold">Zama Protocol</span>
        {" "}— All financial amounts are{" "}
        <span className="text-yellow-300 font-semibold">FHE-encrypted</span>
        {" "}on-chain. Sepolia Testnet.
      </span>
      <ShieldCheck className="w-3.5 h-3.5 text-yellow-400" />
    </div>
  );
}
