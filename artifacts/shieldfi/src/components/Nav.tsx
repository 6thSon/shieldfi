import { Link, useRoute } from "wouter";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ShieldCheck, Building2, UserCheck, Landmark, Search } from "lucide-react";

const navItems = [
  { href: "/supplier", label: "Supplier", icon: Building2 },
  { href: "/buyer", label: "Buyer", icon: UserCheck },
  { href: "/financier", label: "Financier", icon: Landmark },
  { href: "/audit", label: "Audit", icon: Search },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 shrink-0 mr-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white tracking-tight">ShieldFi</span>
        </Link>

        <nav className="flex items-center gap-1 flex-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const [isActive] = useRoute(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  isActive
                    ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/25"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0">
          <ConnectButton
            chainStatus="icon"
            showBalance={false}
            accountStatus="address"
          />
        </div>
      </div>
    </header>
  );
}
