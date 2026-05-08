import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { RainbowKitProvider, getDefaultConfig, darkTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { Toaster } from "@/components/ui/toaster";
import { Nav } from "@/components/Nav";
import { ZamaBanner } from "@/components/ZamaBanner";
import Home from "@/pages/Home";
import Supplier from "@/pages/Supplier";
import Buyer from "@/pages/Buyer";
import Financier from "@/pages/Financier";
import Audit from "@/pages/Audit";
import NotFound from "@/pages/not-found";

const wagmiConfig = getDefaultConfig({
  appName: "ShieldFi",
  projectId: "shieldfi-hackathon-2024",
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(
      `https://sepolia.infura.io/v3/${import.meta.env.VITE_INFURA_API_KEY || ""}`,
    ),
  },
});

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/supplier" component={Supplier} />
      <Route path="/buyer" component={Buyer} />
      <Route path="/financier" component={Financier} />
      <Route path="/audit" component={Audit} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#FBBF24",
            accentColorForeground: "#0a0a0a",
            borderRadius: "medium",
            fontStack: "system",
          })}
        >
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <div className="min-h-screen flex flex-col">
              <ZamaBanner />
              <Nav />
              <main className="flex-1">
                <Router />
              </main>
            </div>
          </WouterRouter>
          <Toaster />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
