// src/main.tsx
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// ─── FIX: Handle wallet extension conflicts ──────────────────────────
if (typeof window !== 'undefined') {
  // Store the original ethereum provider
  const originalEthereum = (window as any).ethereum;
  
  // If there are multiple providers, use MetaMask
  if (originalEthereum && originalEthereum.providers) {
    const providers = originalEthereum.providers;
    // Find MetaMask provider
    const metamaskProvider = providers.find(
      (p: any) => p.isMetaMask === true
    );
    // Use MetaMask if found, otherwise use first provider
    if (metamaskProvider) {
      // Create a new proxy to handle provider access
      const handler = {
        get: function(target: any, prop: string) {
          if (prop === 'providers') {
            return providers;
          }
          // Delegate to MetaMask provider
          return metamaskProvider[prop];
        },
        set: function(target: any, prop: string, value: any) {
          return Reflect.set(metamaskProvider, prop, value);
        }
      };
      
      // Replace ethereum with a proxy that uses MetaMask
      Object.defineProperty(window, 'ethereum', {
        value: new Proxy(metamaskProvider, handler),
        writable: false,
        configurable: false,
      });
    }
  }
}

createRoot(document.getElementById("root")!).render(<App />);
