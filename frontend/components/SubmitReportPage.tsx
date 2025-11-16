"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useFhevm } from "@/fhevm/useFhevm";
import { useNebulaAtmos } from "@/hooks/useNebulaAtmos";

export const SubmitReportPage = () => {
  const router = useRouter();
  const {
    provider,
    chainId,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  } = useMetaMaskEthersSigner();

  const {
    instance: fhevmInstance,
    status: fhevmStatus,
  } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: isConnected,
  });

  const nebula = useNebulaAtmos({
    instance: fhevmInstance,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  const [step, setStep] = useState(1);
  const [regionCode, setRegionCode] = useState("");
  const [metadataCID, setMetadataCID] = useState("");
  const [pm25, setPm25] = useState(35);
  const [pm10, setPm10] = useState(50);
  const [visibility, setVisibility] = useState(4);
  const [smell, setSmell] = useState(1);

  const handleSubmit = () => {
    if (!regionCode || !metadataCID) {
      alert("Please complete all required fields");
      return;
    }
    nebula.lodgeEncryptedReading({
      regionCode: regionCode.trim(),
      metadataCID: metadataCID.trim(),
      pm25,
      pm10,
      visibility,
      smell
    });
  };

  const getPM25Quality = (val: number) => {
    if (val < 35) return { label: "Excellent", color: "text-emerald-600", bg: "bg-emerald-100" };
    if (val < 75) return { label: "Moderate", color: "text-amber-600", bg: "bg-amber-100" };
    if (val < 150) return { label: "Unhealthy", color: "text-orange-600", bg: "bg-orange-100" };
    return { label: "Hazardous", color: "text-rose-600", bg: "bg-rose-100" };
  };

  const quality = getPM25Quality(pm25);

  return (
    <div className="min-h-screen atmos-bg flex">
      {/* 左侧表单 */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          {/* 返回按钮 */}
          <button
            onClick={() => router.push("/")}
            className="mb-6 px-4 py-2 atmos-card rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>

          {/* 标题 */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Lodge New Reading</h1>
            <p className="text-slate-600">Submit encrypted air quality measurements to the blockchain</p>
          </div>

          {/* 步骤指示器 */}
          <div className="flex items-center gap-4 mb-8">
            {[
              { num: 1, label: "Location" },
              { num: 2, label: "Measurements" },
              { num: 3, label: "Submit" }
            ].map((s) => (
              <div key={s.num} className="flex items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    step >= s.num
                      ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {s.num}
                </div>
                <span className={`text-sm font-semibold ${step >= s.num ? "text-slate-800" : "text-slate-400"}`}>
                  {s.label}
                </span>
                {s.num < 3 && <div className="w-12 h-1 bg-slate-200 rounded"></div>}
              </div>
            ))}
          </div>

          {!isConnected ? (
            <div className="atmos-card p-12 rounded-2xl text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                🔗
              </div>
              <p className="text-xl font-semibold text-slate-800 mb-4">Connect your wallet to continue</p>
              <button onClick={connect} className="atmos-btn px-8 py-3 rounded-xl">
                Connect Wallet
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Step 1: 位置信息 */}
              {step === 1 && (
                <div className="atmos-card p-8 rounded-2xl space-y-6 animate-scale-in">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      📍 Region Code
                    </label>
                    <input
                      type="text"
                      value={regionCode}
                      onChange={(e) => setRegionCode(e.target.value)}
                      placeholder="e.g., Shanghai-Pudong"
                      className="atmos-input w-full px-4 py-3 rounded-xl text-lg"
                    />
                    <p className="text-xs text-slate-500 mt-2">Format: City-District (no precise location)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      🗂️ Metadata CID (IPFS)
                    </label>
                    <input
                      type="text"
                      value={metadataCID}
                      onChange={(e) => setMetadataCID(e.target.value)}
                      placeholder="QmXxx..."
                      className="atmos-input w-full px-4 py-3 rounded-xl text-lg"
                    />
                    <p className="text-xs text-slate-500 mt-2">Upload photos to IPFS first to get CID</p>
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    disabled={!regionCode || !metadataCID}
                    className="atmos-btn w-full py-4 rounded-xl text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue to Measurements →
                  </button>
                </div>
              )}

              {/* Step 2: 测量数据 */}
              {step === 2 && (
                <div className="atmos-card p-8 rounded-2xl space-y-8 animate-scale-in">
                  {/* PM2.5 */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-semibold text-slate-700">💨 PM2.5 (μg/m³)</label>
                      <div className={`px-3 py-1 rounded-lg ${quality.bg}`}>
                        <span className={`text-sm font-bold ${quality.color}`}>{pm25}</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="500"
                      value={pm25}
                      onChange={(e) => setPm25(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-2">
                      <span>0 (Excellent)</span>
                      <span className={quality.color}>{quality.label}</span>
                      <span>500 (Hazardous)</span>
                    </div>
                  </div>

                  {/* PM10 */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-semibold text-slate-700">💨 PM10 (μg/m³)</label>
                      <span className="text-lg font-bold text-cyan-600 stat-label">{pm10}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="600"
                      value={pm10}
                      onChange={(e) => setPm10(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* 能见度 */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-semibold text-slate-700">👁️ Visibility Level (1-5)</label>
                      <span className="text-lg font-bold text-blue-600 stat-label">{visibility}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={visibility}
                      onChange={(e) => setVisibility(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex gap-2 mt-3">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <div
                          key={v}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                            visibility >= v ? "bg-blue-500 text-white shadow-lg" : "bg-slate-200 text-slate-400"
                          }`}
                        >
                          {v}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 气味 */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-semibold text-slate-700">👃 Odor Intensity (0-5)</label>
                      <span className="text-lg font-bold text-rose-600 stat-label">{smell}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      value={smell}
                      onChange={(e) => setSmell(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex gap-2 mt-3">
                      {[0, 1, 2, 3, 4, 5].map((s) => (
                        <div
                          key={s}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                            smell >= s ? "bg-rose-500 text-white shadow-lg" : "bg-slate-200 text-slate-400"
                          }`}
                        >
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 py-4 rounded-xl text-lg font-semibold border-2 border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      className="flex-1 atmos-btn py-4 rounded-xl text-lg font-semibold"
                    >
                      Review & Submit →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: 确认提交 */}
              {step === 3 && (
                <div className="atmos-card p-8 rounded-2xl space-y-6 animate-scale-in">
                  <h3 className="text-2xl font-bold text-slate-800 mb-4">Review Your Submission</h3>

                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-50">
                      <p className="text-xs text-slate-600 mb-1">Region</p>
                      <p className="font-semibold text-slate-800">{regionCode}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-emerald-50">
                        <p className="text-xs text-emerald-700 mb-1">PM2.5</p>
                        <p className="text-2xl font-bold text-emerald-800 stat-label">{pm25}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-cyan-50">
                        <p className="text-xs text-cyan-700 mb-1">PM10</p>
                        <p className="text-2xl font-bold text-cyan-800 stat-label">{pm10}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-blue-50">
                        <p className="text-xs text-blue-700 mb-1">Visibility</p>
                        <p className="text-2xl font-bold text-blue-800 stat-label">{visibility}/5</p>
                      </div>
                      <div className="p-4 rounded-xl bg-rose-50">
                        <p className="text-xs text-rose-700 mb-1">Odor</p>
                        <p className="text-2xl font-bold text-rose-800 stat-label">{smell}/5</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-violet-50 border border-violet-200">
                      <p className="text-sm text-violet-700 mb-2 font-semibold">🔐 Encryption Notice</p>
                      <p className="text-xs text-violet-600">
                        All measurements will be encrypted using FHEVM before submission. Only authorized parties can decrypt this data.
                      </p>
                    </div>
                  </div>

                  {nebula.message && (
                    <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-200">
                      <p className="text-sm text-cyan-700 font-semibold">📡 {nebula.message}</p>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button
                      onClick={() => setStep(2)}
                      className="flex-1 py-4 rounded-xl text-lg font-semibold border-2 border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      ← Edit
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={nebula.isSubmitting || fhevmStatus !== "ready"}
                      className="flex-1 atmos-btn py-4 rounded-xl text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {nebula.isSubmitting ? "🔐 Encrypting & Submitting..." : "🚀 Submit to Blockchain"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 右侧实时预览 */}
      <div className="w-96 bg-white border-l border-slate-200 p-8">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Live Preview</h3>

        <div className="space-y-4">
          {/* 空气质量指数预览 */}
          <div className="atmos-card p-6 rounded-2xl text-center">
            <div className={`w-24 h-24 mx-auto mb-4 rounded-full ${quality.bg} flex items-center justify-center`}>
              <span className={`text-3xl font-bold ${quality.color} stat-label`}>{pm25}</span>
            </div>
            <p className={`text-lg font-semibold ${quality.color} mb-1`}>{quality.label}</p>
            <p className="text-xs text-slate-500">Based on PM2.5 level</p>
          </div>

          {/* 数据概览 */}
          <div className="atmos-card p-4 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">PM10</span>
              <span className="font-bold text-slate-800 stat-label">{pm10}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Visibility</span>
              <span className="font-bold text-slate-800 stat-label">{visibility}/5</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Odor</span>
              <span className="font-bold text-slate-800 stat-label">{smell}/5</span>
            </div>
          </div>

          {/* FHEVM 状态 */}
          <div className="atmos-card p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${fhevmStatus === 'ready' ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`}></div>
              <span className="text-xs font-semibold text-slate-600">FHEVM Status</span>
            </div>
            <p className={`text-sm font-bold ${fhevmStatus === 'ready' ? 'text-emerald-600' : 'text-amber-600'}`}>
              {fhevmStatus}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
