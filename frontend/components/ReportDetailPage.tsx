"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useFhevm } from "@/fhevm/useFhevm";
import { useNebulaAtmos } from "@/hooks/useNebulaAtmos";

export const ReportDetailPage = ({ reportId }: { reportId: string }) => {
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

  const handleDecrypt = () => {
    if (reportId) {
      nebula.loadAndDecrypt(Number(reportId));
    }
  };

  const getAQILevel = (pm25: number) => {
    if (pm25 <= 35) return { level: "Excellent", score: 95, gradient: "from-emerald-400 to-green-500" };
    if (pm25 <= 75) return { level: "Moderate", score: 70, gradient: "from-amber-400 to-yellow-500" };
    if (pm25 <= 150) return { level: "Unhealthy", score: 45, gradient: "from-orange-400 to-red-500" };
    return { level: "Hazardous", score: 20, gradient: "from-rose-500 to-red-600" };
  };

  return (
    <div className="min-h-screen atmos-bg">
      {/* 顶部栏 */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 hover:bg-slate-100 rounded-lg text-sm font-semibold text-slate-700 transition-colors flex items-center gap-2"
          >
            ← Back
          </button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">Reading</span>
            <div className="px-4 py-2 bg-violet-100 rounded-lg">
              <p className="font-mono font-bold text-violet-700">#{reportId}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {!isConnected ? (
          <div className="atmos-card p-12 rounded-2xl text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
              🔗
            </div>
            <p className="text-xl font-semibold text-slate-800 mb-4">Connect wallet to access data</p>
            <button onClick={connect} className="atmos-btn px-8 py-3 rounded-xl font-semibold">
              Connect Wallet
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 解密提示 */}
            {!nebula.clear && (
              <div className="atmos-card p-8 rounded-2xl">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-purple-100 rounded-3xl flex items-center justify-center text-4xl animate-pulse">
                    🔐
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Data Locked</h2>
                    <p className="text-slate-600 mb-4">Measurements are FHE-encrypted. Authorize decryption to view.</p>
                    <button
                      onClick={handleDecrypt}
                      disabled={nebula.isDecrypting || fhevmStatus !== "ready"}
                      className="atmos-btn px-6 py-3 rounded-xl font-semibold disabled:opacity-50"
                    >
                      {nebula.isDecrypting ? "⏳ Processing..." : "🔓 Decrypt Reading"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 解密后 - 全新设计 */}
            {nebula.clear && (
              <div className="space-y-6 animate-slide-up">
                {/* AQI 大屏展示 - 仪表盘风格 */}
                <div className="atmos-card p-10 rounded-3xl bg-gradient-to-br from-white via-slate-50 to-violet-50">
                  <h2 className="text-2xl font-bold text-slate-800 mb-8 text-center">Air Quality Metrics</h2>
                  
                  {/* 主要指标横排 */}
                  <div className="grid grid-cols-2 gap-8 mb-8">
                    {/* PM2.5 仪表盘 */}
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-600 mb-4">PM2.5 Level</p>
                      <div className="relative inline-block">
                        {/* 圆形背景 */}
                        <svg className="w-48 h-48" viewBox="0 0 200 200">
                          <circle cx="100" cy="100" r="80" fill="none" stroke="#e2e8f0" strokeWidth="20"/>
                          <circle 
                            cx="100" cy="100" r="80" fill="none" 
                            stroke="url(#pm25-gradient)" 
                            strokeWidth="20"
                            strokeDasharray={`${(Number(nebula.clear.pm25) / 500) * 502} 502`}
                            strokeLinecap="round"
                            transform="rotate(-90 100 100)"
                            className="transition-all duration-1000"
                          />
                          <defs>
                            <linearGradient id="pm25-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#10b981"/>
                              <stop offset="50%" stopColor="#f59e0b"/>
                              <stop offset="100%" stopColor="#ef4444"/>
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <p className="text-5xl font-bold text-slate-800 stat-label">{String(nebula.clear.pm25)}</p>
                          <p className="text-xs text-slate-500 mt-1">μg/m³</p>
                        </div>
                      </div>
                      <p className={`mt-4 text-lg font-bold ${getAQILevel(Number(nebula.clear.pm25)).gradient.replace('from-', 'text-').replace(' to-', '-').split(' ')[0]}`}>
                        {getAQILevel(Number(nebula.clear.pm25)).level}
                      </p>
                    </div>

                    {/* PM10 仪表盘 */}
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-600 mb-4">PM10 Level</p>
                      <div className="relative inline-block">
                        <svg className="w-48 h-48" viewBox="0 0 200 200">
                          <circle cx="100" cy="100" r="80" fill="none" stroke="#e2e8f0" strokeWidth="20"/>
                          <circle 
                            cx="100" cy="100" r="80" fill="none" 
                            stroke="url(#pm10-gradient)" 
                            strokeWidth="20"
                            strokeDasharray={`${(Number(nebula.clear.pm10) / 600) * 502} 502`}
                            strokeLinecap="round"
                            transform="rotate(-90 100 100)"
                            className="transition-all duration-1000"
                          />
                          <defs>
                            <linearGradient id="pm10-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#06b6d4"/>
                              <stop offset="100%" stopColor="#3b82f6"/>
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <p className="text-5xl font-bold text-slate-800 stat-label">{String(nebula.clear.pm10)}</p>
                          <p className="text-xs text-slate-500 mt-1">μg/m³</p>
                        </div>
                      </div>
                      <p className="mt-4 text-lg font-bold text-cyan-600">Coarse Particles</p>
                    </div>
                  </div>

                  {/* 次要指标 - 横向条形图风格 */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* 能见度 */}
                    <div className="atmos-card p-6 rounded-2xl">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">👁️</span>
                        <div>
                          <p className="text-xs text-slate-600">Visibility</p>
                          <p className="text-2xl font-bold text-slate-800 stat-label">{String(nebula.clear.visibility)}<span className="text-sm text-slate-500">/5</span></p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div key={level} className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 w-8">{level}</span>
                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500 ${
                                  level <= Number(nebula.clear?.visibility ?? 0) ? 'w-full' : 'w-0'
                                }`}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 气味 */}
                    <div className="atmos-card p-6 rounded-2xl">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">👃</span>
                        <div>
                          <p className="text-xs text-slate-600">Odor Intensity</p>
                          <p className="text-2xl font-bold text-slate-800 stat-label">{String(nebula.clear.smell)}<span className="text-sm text-slate-500">/5</span></p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {[0, 1, 2, 3, 4, 5].map((level) => (
                          <div 
                            key={level}
                            className={`flex-1 h-12 rounded-lg transition-all duration-300 ${
                              level <= Number(nebula.clear?.smell ?? 0)
                                ? 'bg-gradient-to-t from-rose-400 to-rose-600 shadow-lg'
                                : 'bg-slate-200'
                            }`}
                            style={{ height: `${20 + level * 8}px` }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 元数据 */}
                {nebula.lastReading && (
                  <div className="atmos-card p-6 rounded-2xl">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <span>📋</span> Metadata
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center text-lg">📍</div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Region</p>
                          <p className="font-semibold text-slate-800">{nebula.lastReading.regionCode}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center text-lg">🗂️</div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">IPFS CID</p>
                          <p className="font-mono text-xs text-slate-700 break-all">{nebula.lastReading.metadataCID}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 状态 */}
            {nebula.message && (
              <div className="atmos-card p-4 rounded-xl">
                <p className="text-sm font-semibold text-cyan-700">📡 {nebula.message}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
