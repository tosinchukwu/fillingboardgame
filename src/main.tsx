// src/main.tsx
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// ─── FIX: Handle wallet extension conflicts BEFORE app loads ──────────
if (typeof window !== 'undefined') {
  try {
    // Check if there are multiple providers
    const ethereum = (window as any).ethereum;
    
    if (ethereum && ethereum.providers && ethereum.providers.length > 1) {
      console.log('Multiple wallet providers detected. Using MetaMask.');
      
      // Find and use MetaMask provider
      const metamask = ethereum.providers.find((p: any) => p.isMetaMask === true);
      const coinbase = ethereum.providers.find((p: any) => p.isCoinbaseWallet === true);
      
      // Prefer MetaMask over others
      const provider = metamask || coinbase || ethereum.providers[0];
      
      // Replace window.ethereum with the chosen provider
      Object.defineProperty(window, 'ethereum', {
        value: provider,
        writable: false,
        configurable: false,
        enumerable: true,
      });
    }
  } catch (e) {
    console.warn('Could not resolve ethereum provider:', e);
  }
}

createRoot(document.getElementById("root")!).render(<App />);
