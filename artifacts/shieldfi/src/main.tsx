import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { getFhevmInstance } from "./lib/fhevm";

// Eagerly warm the FHE instance on page load so WASM is ready before
// any wallet interaction. Errors are non-fatal — the app still works,
// encryption will retry on demand.
getFhevmInstance().catch((err) => {
  console.log("[ShieldFi] FHE pre-init failed (will retry on first encrypt):", String(err));
});

createRoot(document.getElementById("root")!).render(<App />);
