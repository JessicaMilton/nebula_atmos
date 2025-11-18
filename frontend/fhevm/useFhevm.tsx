import { useCallback, useEffect, useRef, useState } from "react";
import { ethers } from "ethers";
import type { FhevmInstance } from "./fhevmTypes";
import { createFhevmInstance, FhevmAbortError } from "./internal/fhevm";

export type FhevmGoState = "idle" | "loading" | "ready" | "error";

export function useFhevm(parameters: {
  provider: string | ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  enabled?: boolean;
  initialMockChains?: Readonly<Record<number, string>>;
}): {
  instance: FhevmInstance | undefined;
  refresh: () => void;
  error: Error | undefined;
  status: FhevmGoState;
} {
  const { provider, chainId, initialMockChains, enabled = true } = parameters;
  const [instance, setInstance] = useState<FhevmInstance | undefined>(undefined);
  const [status, setStatus] = useState<FhevmGoState>("idle");
  const [error, setError] = useState<Error | undefined>(undefined);
  const [isRunning, setIsRunning] = useState<boolean>(enabled);
  const [providerChanged, setProviderChanged] = useState<number>(0);
  const abortRef = useRef<AbortController | null>(null);
  const providerRef = useRef<string | ethers.Eip1193Provider | undefined>(provider);
  const chainIdRef = useRef<number | undefined>(chainId);
  const mockChainsRef = useRef<Record<number, string> | undefined>(initialMockChains);

  // Keep isRunning in sync with external 'enabled' flag
  useEffect(() => {
    setIsRunning(enabled);
  }, [enabled]);

  const refresh = useCallback(() => {
    if (abortRef.current) {
      providerRef.current = undefined;
      chainIdRef.current = undefined;
      abortRef.current.abort();
      abortRef.current = null;
    }
    providerRef.current = provider;
    chainIdRef.current = chainId;
    setInstance(undefined);
    setError(undefined);
    setStatus("idle");
    if (provider !== undefined) {
      setProviderChanged((prev) => prev + 1);
    }
  }, [provider, chainId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isRunning) return;
    if (!providerRef.current || !chainIdRef.current) return;
    const thisAbort = new AbortController();
    abortRef.current = thisAbort;
    setStatus("loading");
    setError(undefined);
    const run = async () => {
      try {
        console.log("[useFhevm] Starting FHEVM initialization...");
        const instance = await createFhevmInstance({
          signal: thisAbort.signal,
          provider: providerRef.current!,
          mockChains: mockChainsRef.current,
          onStatusChange: (s) => console.log(`[useFhevm] status=${s}`)
        });
        if (thisAbort.signal.aborted) return;
        console.log("[useFhevm] FHEVM instance ready!");
        setInstance(instance);
        setStatus("ready");
      } catch (e) {
        if (thisAbort.signal.aborted || e instanceof FhevmAbortError) return;
        console.error("[useFhevm] FHEVM initialization failed:", e);
        setInstance(undefined);
        setError(e as Error);
        setStatus("error");
      }
    };
    run();
    return () => {
      thisAbort.abort();
    };
  }, [isRunning, providerChanged]);

  return { instance, refresh, error, status };
}


