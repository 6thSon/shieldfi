import { Link } from "wouter";
import { ShieldCheck } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
        <ShieldCheck className="w-8 h-8 text-white" />
      </div>
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">404</h1>
        <p className="text-slate-400">This page doesn't exist on ShieldFi</p>
      </div>
      <Link href="/" className="px-4 py-2 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 hover:bg-cyan-500/25 transition-all text-sm font-medium">
        Back to Home
      </Link>
    </div>
  );
}
