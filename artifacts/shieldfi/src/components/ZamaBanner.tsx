import { ShieldCheck, Lock } from "lucide-react";

export function ZamaBanner() {
  return (
    <div className="w-full py-2 px-4 flex items-center justify-center gap-3 text-xs font-medium"
      style={{
        background: "linear-gradient(90deg, rgba(14,165,233,0.12) 0%, rgba(99,102,241,0.12) 50%, rgba(14,165,233,0.12) 100%)",
        borderBottom: "1px solid rgba(14,165,233,0.2)",
      }}
    >
      <Lock className="w-3.5 h-3.5 text-cyan-400" />
      <span className="text-slate-300">
        Built on{" "}
        <span className="text-cyan-400 font-semibold">Zama Protocol</span>
        {" "}— All financial amounts are{" "}
        <span className="text-violet-400 font-semibold">FHE-encrypted</span>
        {" "}on-chain. Sepolia Testnet.
      </span>
      <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
    </div>
  );
}
