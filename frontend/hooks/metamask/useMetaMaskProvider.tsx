"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";

type MetaMaskState = {
  provider: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  accounts: string[] | undefined;
  isConnected: boolean;
  error: Error | undefined;
  connect: () => void;
};

const MetaMaskContext = createContext<MetaMaskState | undefined>(undefined);

const AUTO_CONNECT_STORAGE_KEY = "airwitness:autoConnect";

export const MetaMaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [provider, setProvider] = useState<ethers.Eip1193Provider | undefined>(undefined);
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const [accounts, setAccounts] = useState<string[] | undefined>(undefined);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);

  // Initialize provider and restore connection state on refresh
  useEffect(() => {
    const w = window as any;
    if (!w?.ethereum) {
      return;
    }
    const eth = w.ethereum as ethers.Eip1193Provider;
    setProvider(eth);

    // chain id
    eth.request({ method: "eth_chainId" })
      .then((cid: string) => setChainId(parseInt(cid, 16)))
      .catch(() => undefined);

    // try restore accounts without prompting user
    eth.request({ method: "eth_accounts" })
      .then((accs: unknown) => {
        const a = Array.isArray(accs) ? (accs as string[]) : [];
        if (a.length > 0) {
          setAccounts(a);
          setIsConnected(true);
        } else {
          // If user previously approved, proactively request to rehydrate silently (MetaMask resolves without extra prompt)
          if (localStorage.getItem(AUTO_CONNECT_STORAGE_KEY) === "1") {
            (eth as any).request({ method: "eth_requestAccounts" })
              .then((reqAccs: string[]) => {
                setAccounts(reqAccs);
                setIsConnected(reqAccs && reqAccs.length > 0);
              })
              .catch(() => {
                // fallback: remain disconnected
              });
          }
        }
      })
      .catch(() => undefined);

    // listeners
    const onChainChanged = (cid: string) => {
      setChainId(parseInt(cid, 16));
    };
    const onAccountsChanged = (accs: string[]) => {
      setAccounts(accs);
      const connected = accs && accs.length > 0;
      setIsConnected(connected);
      if (!connected) {
        localStorage.removeItem(AUTO_CONNECT_STORAGE_KEY);
      }
    };
    // Some wallets emit connect/disconnect
    const onConnect = () => {
      // query accounts again
      eth.request({ method: "eth_accounts" }).then((accs: any) => {
        if (Array.isArray(accs) && accs.length > 0) {
          setAccounts(accs);
          setIsConnected(true);
        }
      });
    };
    const onDisconnect = () => {
      setIsConnected(false);
      setAccounts([]);
      localStorage.removeItem(AUTO_CONNECT_STORAGE_KEY);
    };

    (eth as any).on?.("chainChanged", onChainChanged);
    (eth as any).on?.("accountsChanged", onAccountsChanged);
    (eth as any).on?.("connect", onConnect);
    (eth as any).on?.("disconnect", onDisconnect);

    return () => {
      (eth as any).removeListener?.("chainChanged", onChainChanged);
      (eth as any).removeListener?.("accountsChanged", onAccountsChanged);
      (eth as any).removeListener?.("connect", onConnect);
      (eth as any).removeListener?.("disconnect", onDisconnect);
    };
  }, []);

  const connect = useCallback(async () => {
    if (!provider) return;
    try {
      const accs = (await (provider as any).request({ method: "eth_requestAccounts" })) as string[];
      setAccounts(accs);
      const ok = accs && accs.length > 0;
      setIsConnected(ok);
      if (ok) {
        localStorage.setItem(AUTO_CONNECT_STORAGE_KEY, "1");
      }
    } catch (e) {
      setError(e as Error);
    }
  }, [provider]);

  const value = useMemo<MetaMaskState>(
    () => ({ provider, chainId, accounts, isConnected, error, connect }),
    [provider, chainId, accounts, isConnected, error, connect]
  );

  return <MetaMaskContext.Provider value={value}>{children}</MetaMaskContext.Provider>;
};

export function useMetaMask() {
  const ctx = useContext(MetaMaskContext);
  if (!ctx) throw new Error("useMetaMask must be used within MetaMaskProvider");
  return ctx;
}


