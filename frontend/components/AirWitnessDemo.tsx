"use client";

import { useFhevm } from "@/fhevm/useFhevm";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useAirWitness } from "@/hooks/useAirWitness";
import { useState } from "react";

export function AirWitnessDemo() {
  const {
    provider,
    chainId,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains
  } = useMetaMaskEthersSigner();

  const { instance, status } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true
  });

  const air = useAirWitness({
    instance,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner
  });

  const [region, setRegion] = useState("Beijing-Haidian");
  const [cid, setCid] = useState("");
  const [pm25, setPm25] = useState(35);
  const [pm10, setPm10] = useState(50);
  const [visibility, setVisibility] = useState(4);
  const [smell, setSmell] = useState(1);
  const [queryId, setQueryId] = useState<number | undefined>(undefined);

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="air-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">钱包</div>
          <button className="air-btn" onClick={connect} disabled={isConnected}>
            {isConnected ? "Connected" : "Connect Wallet"}
          </button>
        </div>
        <div className="text-sm text-white/80">ChainId: {chainId ?? "-"}</div>
        <div className="text-sm text-white/80">FHEVM: {status}</div>
      </div>

      <div className="air-card p-6 space-y-4">
        <div className="text-lg font-semibold">提交加密报告</div>
        <div className="grid grid-cols-2 gap-3">
          <input className="air-input col-span-2" placeholder="Region Code (e.g., Beijing-Haidian)" value={region} onChange={(e) => setRegion(e.target.value)} />
          <input className="air-input col-span-2" placeholder="Metadata CID (IPFS)" value={cid} onChange={(e) => setCid(e.target.value)} />
          <input className="air-input" type="number" placeholder="PM2.5" value={pm25} onChange={(e) => setPm25(parseInt(e.target.value))} />
          <input className="air-input" type="number" placeholder="PM10" value={pm10} onChange={(e) => setPm10(parseInt(e.target.value))} />
          <input className="air-input" type="number" placeholder="Visibility (1-5)" value={visibility} onChange={(e) => setVisibility(parseInt(e.target.value))} />
          <input className="air-input" type="number" placeholder="Smell (0-3)" value={smell} onChange={(e) => setSmell(parseInt(e.target.value))} />
        </div>
        <button className="air-btn" onClick={() => air.submitEncryptedReport({ pm25, pm10, visibility, smell, regionCode: region, metadataCID: cid })} disabled={!air.canSubmit}>
          {air.isSubmitting ? "Submitting..." : "Submit Encrypted Report"}
        </button>
        <div className="text-sm text-white/70">Status: {air.message}</div>
      </div>

      <div className="air-card p-6 space-y-4">
        <div className="text-lg font-semibold">查询区域报告</div>
        <div className="flex gap-3">
          <input className="air-input" placeholder="Region Code" value={region} onChange={(e) => setRegion(e.target.value)} />
          <button className="air-btn" onClick={() => air.refreshRegion(region)} disabled={!air.canRefreshRegion}>
            {air.isRefreshing ? "Loading..." : "Fetch Reports"}
          </button>
        </div>
        <div className="text-sm text-white/70">Found IDs: {air.reportIds?.join(", ") || "-"}</div>
      </div>

      <div className="air-card p-6 space-y-4">
        <div className="text-lg font-semibold">读取并解密报告</div>
        <div className="flex gap-3">
          <input className="air-input" type="number" placeholder="Report ID" value={queryId ?? ""} onChange={(e) => setQueryId(e.target.value ? parseInt(e.target.value) : undefined)} />
          <button className="air-btn" onClick={() => (queryId ? air.loadAndDecrypt(queryId) : undefined)} disabled={!air.canDecrypt}>
            {air.isDecrypting ? "Decrypting..." : "Load & Decrypt"}
          </button>
        </div>
        <div className="text-sm text-white/80 space-y-1">
          <div>Report: {air.lastReport ? `#${air.lastReport.id} @ ${air.lastReport.regionCode}` : "-"}</div>
          <div>Decrypted PM2.5: {air.clear?.pm25 ?? "-"}</div>
          <div>Decrypted PM10: {air.clear?.pm10 ?? "-"}</div>
          <div>Decrypted Visibility: {air.clear?.visibility ?? "-"}</div>
          <div>Decrypted Smell: {air.clear?.smell ?? "-"}</div>
        </div>
      </div>
    </div>
  );
}


