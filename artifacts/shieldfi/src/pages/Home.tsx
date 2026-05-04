import { Link } from "wouter";
import { ShieldCheck, Lock, Eye, Zap, ArrowRight, Building2, UserCheck, Landmark, Search } from "lucide-react";

const roles = [
  {
    href: "/supplier",
    icon: Building2,
    title: "Supplier",
    color: "from-cyan-500 to-blue-500",
    glow: "rgba(14,165,233,0.3)",
    border: "border-cyan-500/20 hover:border-cyan-500/40",
    desc: "Issue confidential invoices and receive encrypted financing bids from competing financiers.",
  },
  {
    href: "/buyer",
    icon: UserCheck,
    title: "Buyer",
    color: "from-violet-500 to-purple-600",
    glow: "rgba(139,92,246,0.3)",
    border: "border-violet-500/20 hover:border-violet-500/40",
    desc: "Privately approve invoices you owe without revealing amounts to third parties.",
  },
  {
    href: "/financier",
    icon: Landmark,
    title: "Financier",
    color: "from-emerald-500 to-teal-500",
    glow: "rgba(16,185,129,0.3)",
    border: "border-emerald-500/20 hover:border-emerald-500/40",
    desc: "Browse approved invoices and submit encrypted discount rate bids for confidential financing.",
  },
  {
    href: "/audit",
    icon: Search,
    title: "Regulator / Audit",
    color: "from-amber-500 to-orange-500",
    glow: "rgba(245,158,11,0.3)",
    border: "border-amber-500/20 hover:border-amber-500/40",
    desc: "Inspect public invoice metadata and trigger authorized regulatory decryption.",
  },
];

const features = [
  {
    icon: Lock,
    title: "FHE-Encrypted Amounts",
    desc: "Invoice values are encrypted using Zama's FHEVM before hitting the blockchain. No one can see amounts without explicit permission.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    icon: Eye,
    title: "Need-to-Know Access",
    desc: "Suppliers, buyers, and financiers each see only what they're authorized for. FHE.allow() enforces access at the cryptographic level.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    icon: Zap,
    title: "Competitive Bidding",
    desc: "Multiple financiers bid with encrypted rates. The supplier picks the best offer — without revealing any rates to competitors.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: ShieldCheck,
    title: "Regulatory Compliance",
    desc: "The regulator (contract owner) retains the ability to decrypt any value for compliance audits — maintaining oversight without sacrificing privacy.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
];

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-medium text-cyan-400 border border-cyan-500/25 bg-cyan-500/8">
          <ShieldCheck className="w-3.5 h-3.5" />
          Hackathon Submission — Zama FHEVM × Sepolia Testnet
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-5">
          <span className="text-white">Confidential</span>
          <br />
          <span className="text-gradient">Supply Chain Finance</span>
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          ShieldFi brings institutional-grade privacy to on-chain invoice financing.
          Invoice amounts, buyer identities, and financier bids remain{" "}
          <span className="text-white font-medium">fully encrypted</span>{" "}
          using Fully Homomorphic Encryption — only authorized parties can decrypt.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <Link
            href="/supplier"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold text-sm transition-all glow-cyan"
          >
            Launch as Supplier <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="https://docs.zama.ai/protocol"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-white/10 text-slate-300 hover:text-white hover:border-white/20 text-sm transition-all"
          >
            Zama FHEVM Docs
          </a>
        </div>
      </div>

      {/* Role Cards */}
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-5 text-center">Choose Your Role</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
        {roles.map(({ href, icon: Icon, title, color, glow, border, desc }) => (
          <Link
            key={href}
            href={href}
            className={`group block p-5 rounded-xl glass border ${border} transition-all duration-200 hover:-translate-y-0.5`}
            style={{ "--glow": glow } as React.CSSProperties}
          >
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mb-4`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-white mb-2">{title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
            <div className="flex items-center gap-1 mt-4 text-xs font-medium text-slate-500 group-hover:text-slate-300 transition-colors">
              Enter dashboard <ArrowRight className="w-3 h-3" />
            </div>
          </Link>
        ))}
      </div>

      {/* Features */}
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-5 text-center">How FHE Protects You</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-16">
        {features.map(({ icon: Icon, title, desc, color, bg }) => (
          <div key={title} className="flex gap-4 p-5 rounded-xl glass border border-white/5">
            <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm mb-1">{title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Flow diagram */}
      <div className="p-6 rounded-xl glass border border-white/5">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-6 text-center">SCF Flow on ShieldFi</h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-0">
          {[
            { label: "1. Supplier", sub: "Creates encrypted invoice", color: "border-cyan-500/40 text-cyan-400" },
            { label: "2. Buyer", sub: "Approves privately", color: "border-violet-500/40 text-violet-400" },
            { label: "3. Financiers", sub: "Submit encrypted bids", color: "border-emerald-500/40 text-emerald-400" },
            { label: "4. Supplier", sub: "Accepts best bid", color: "border-amber-500/40 text-amber-400" },
            { label: "5. Settlement", sub: "Buyer repays financier", color: "border-rose-500/40 text-rose-400" },
          ].map((step, i, arr) => (
            <div key={step.label} className="flex items-center">
              <div className={`flex flex-col items-center px-4 py-3 rounded-lg border ${step.color} bg-white/2 min-w-[110px] text-center`}>
                <span className={`font-semibold text-sm ${step.color.split(" ")[1]}`}>{step.label}</span>
                <span className="text-slate-500 text-xs mt-0.5">{step.sub}</span>
              </div>
              {i < arr.length - 1 && (
                <div className="text-slate-600 mx-1 hidden sm:block">→</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
