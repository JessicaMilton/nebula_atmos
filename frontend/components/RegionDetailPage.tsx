"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useFhevm } from "@/fhevm/useFhevm";
import { useNebulaAtmos } from "@/hooks/useNebulaAtmos";

export const RegionDetailPage = ({ regionName }: { regionName: string }) => {
  const router = useRouter();
  const {
    provider,
    chainId,
    isConnected,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  } = useMetaMaskEthersSigner();

  const {
    instance: fhevmInstance,
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

  useEffect(() => {
    if (isConnected && regionName) {
      nebula.refreshRegion(decodeURIComponent(regionName));
    }
  }, [isConnected, regionName]);

  return (
    <div className="min-h-screen nebula-bg relative overflow-hidden text-zinc-200">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-violet-500/25 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => router.push("/explore")} className="nebula-btn">← 返回地图</button>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-cyan-300 to-fuchsia-300 bg-clip-text text-transparent">📍 {decodeURIComponent(regionName)}</h1>
          <div className="w-24"></div>
        </div>

        {!isConnected ? (
          <div className="nebula-card p-12 text-center">
            <p className="text-xl text-zinc-300">请连接钱包查看区域读数</p>
          </div>
        ) : nebula.isRefreshing ? (
          <div className="nebula-card p-12 text-center">
            <p className="text-xl text-zinc-300">🔄 正在加载区域读数...</p>
          </div>
        ) : nebula.regionReadingIds && nebula.regionReadingIds.length > 0 ? (
          <div>
            <div className="nebula-card p-6 mb-6">
              <h3 className="text-2xl font-bold text-zinc-100 mb-4">
                📊 区域统计（{nebula.regionReadingIds.length} 条读数）
              </h3>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nebula.regionReadingIds.map((id) => (
                <div
                  key={id.toString()}
                  onClick={() => router.push(`/report/${id.toString()}`)}
                  className="cursor-pointer nebula-card p-6 hover:translate-y-[-2px] transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xl font-bold text-cyan-300">Reading #{id.toString()}</h4>
                    <span className="text-2xl">🔐</span>
                  </div>
                  <p className="text-sm text-zinc-400 mb-4">
                    点击解密查看详细数据（PM2.5、能见度、气味等）
                  </p>
                  <div className="pt-4 border-t border-zinc-700/40">
                    <p className="text-xs text-center text-cyan-300 font-semibold">
                      使用 FHEVM 链下解密 →
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="nebula-card p-12 text-center">
            <p className="text-xl text-zinc-300 mb-4">该区域暂无读数</p>
            <button onClick={() => router.push("/submit")} className="nebula-btn px-6 py-3">
              ✨ 提交第一条读数
            </button>
          </div>
        )}

        {nebula.message && (
          <div className="mt-6 p-4 nebula-card">
            <p className="font-semibold text-cyan-300">📡 {nebula.message}</p>
          </div>
        )}
      </div>
    </div>
  );
};

