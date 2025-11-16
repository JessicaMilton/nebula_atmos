"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useFhevm } from "@/fhevm/useFhevm";
import { useNebulaAtmos } from "@/hooks/useNebulaAtmos";

export const ProfilePage = () => {
  const router = useRouter();
  const {
    provider,
    chainId,
    accounts,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  } = useMetaMaskEthersSigner();

  const { instance: fhevmInstance } = useFhevm({
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
    if (isConnected && accounts?.[0]) {
      nebula.refreshUserReadingCount(accounts[0]);
    }
  }, [isConnected, accounts, nebula.refreshUserReadingCount]);

  const readingCount = nebula.userReadingCount || 0;

  const medals = [
    { id: 1, name: "Bronze", requirement: 2, icon: "🥉", color: "from-amber-600 to-orange-700" },
    { id: 2, name: "Silver", requirement: 50, icon: "🥈", color: "from-slate-400 to-slate-600" },
    { id: 3, name: "Gold", requirement: 200, icon: "🥇", color: "from-yellow-400 to-amber-600" },
    { id: 4, name: "Expert", requirement: 500, icon: "🏆", color: "from-purple-500 to-violet-700" },
  ];

  const handleRedeemMedal = async (medalId: number) => {
    if (!nebula.canSubmit || !isConnected) return;
    await nebula.redeemMedal(medalId);
  };

  const getTierName = (count: number) => {
    if (count >= 500) return "Expert Contributor";
    if (count >= 200) return "Gold Contributor";
    if (count >= 50) return "Silver Contributor";
    if (count >= 2) return "Bronze Contributor";
    return "New Contributor";
  };

  return (
    <div className="min-h-screen atmos-bg p-8">
      <div className="max-w-6xl mx-auto">
        {/* 头部 */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/")}
            className="mb-4 px-4 py-2 atmos-card rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            ← Dashboard
          </button>
          <h1 className="text-4xl font-bold text-slate-800 mb-2">My Profile</h1>
          <p className="text-slate-600">View your contribution statistics and redeem achievement medals</p>
        </div>

        {!isConnected ? (
          <div className="atmos-card p-12 rounded-2xl text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
              🔗
            </div>
            <p className="text-xl font-semibold text-slate-800 mb-4">Connect wallet to view your profile</p>
            <button onClick={connect} className="atmos-btn px-8 py-3 rounded-xl font-semibold">
              Connect Wallet
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 顶部用户卡片 */}
            <div className="atmos-card p-8 rounded-3xl bg-gradient-to-br from-white to-violet-50 border-2 border-violet-100">
              <div className="flex items-center gap-8">
                {/* 头像 */}
                <div className="relative">
                  <div className="w-32 h-32 bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl flex items-center justify-center text-5xl shadow-2xl">
                    👤
                  </div>
                  <div className="absolute -bottom-2 -right-2 px-3 py-1 bg-white rounded-full shadow-lg border-2 border-violet-200">
                    <span className="text-xs font-bold text-violet-600">Level {Math.floor(readingCount / 10)}</span>
                  </div>
                </div>

                {/* 用户信息 */}
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-slate-800 mb-2">{getTierName(readingCount)}</h2>
                  <p className="font-mono text-sm text-slate-600 mb-4 break-all">{accounts?.[0]}</p>

                  {/* 快速统计 */}
                  <div className="flex gap-6">
                    <div>
                      <p className="text-3xl font-bold text-violet-600 stat-label">{readingCount}</p>
                      <p className="text-xs text-slate-600 font-semibold">Total Readings</p>
                    </div>
                    <div className="border-l border-slate-200 pl-6">
                      <p className="text-3xl font-bold text-cyan-600 stat-label">
                        {medals.filter(m => nebula.claimedMedals?.[m.id]).length}/4
                      </p>
                      <p className="text-xs text-slate-600 font-semibold">Medals Collected</p>
                    </div>
                    <div className="border-l border-slate-200 pl-6">
                      <p className="text-3xl font-bold text-emerald-600 stat-label">
                        {Math.round((readingCount / 500) * 100)}%
                      </p>
                      <p className="text-xs text-slate-600 font-semibold">To Expert</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 进度追踪 */}
            <div className="atmos-card p-8 rounded-2xl">
              <h3 className="text-2xl font-bold text-slate-800 mb-6">Achievement Progress</h3>
              <div className="space-y-6">
                {medals.map((medal) => {
                  const progress = Math.min((readingCount / medal.requirement) * 100, 100);
                  const achieved = readingCount >= medal.requirement;
                  const claimed = nebula.claimedMedals?.[medal.id] || false;

                  return (
                    <div key={medal.id} className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{medal.icon}</span>
                          <div>
                            <p className="font-bold text-slate-800">{medal.name} Medal</p>
                            <p className="text-xs text-slate-600">Required: {medal.requirement} readings</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="font-mono text-sm text-slate-600">
                            {readingCount}/{medal.requirement}
                          </span>

                          {achieved && !claimed && (
                            <button
                              onClick={() => handleRedeemMedal(medal.id)}
                              className="atmos-btn px-4 py-2 rounded-lg text-sm font-semibold"
                            >
                              🎁 Redeem
                            </button>
                          )}

                          {claimed && (
                            <div className="px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-bold flex items-center gap-2">
                              ✓ Collected
                            </div>
                          )}

                          {!achieved && (
                            <div className="px-4 py-2 rounded-lg bg-slate-100 text-slate-500 text-sm font-semibold">
                              Locked
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 进度条 */}
                      <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${medal.color} transition-all duration-1000 ${
                            achieved ? "badge-glow" : ""
                          }`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 成就墙 */}
            <div className="atmos-card p-8 rounded-2xl">
              <h3 className="text-2xl font-bold text-slate-800 mb-6">Medal Collection</h3>
              <div className="grid grid-cols-4 gap-6">
                {medals.map((medal) => {
                  const unlocked = readingCount >= medal.requirement;
                  const claimed = nebula.claimedMedals?.[medal.id] || false;

                  return (
                    <div
                      key={medal.id}
                      className={`relative rounded-3xl p-6 text-center transition-all duration-500 ${
                        claimed
                          ? `bg-gradient-to-br ${medal.color} shadow-2xl scale-105 animate-float`
                          : unlocked
                          ? `bg-gradient-to-br ${medal.color} opacity-60 shadow-lg`
                          : "bg-slate-200 opacity-40 grayscale"
                      }`}
                    >
                      <div className="text-7xl mb-4">{medal.icon}</div>
                      <p className={`font-bold text-lg ${claimed || unlocked ? "text-white" : "text-slate-500"}`}>
                        {medal.name}
                      </p>

                      {claimed && (
                        <div className="absolute -top-3 -right-3 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                          ✓
                        </div>
                      )}

                      {!unlocked && (
                        <div className="absolute inset-0 bg-slate-900/20 rounded-3xl flex items-center justify-center">
                          <div className="text-white text-4xl">🔒</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 激励卡片 */}
            {readingCount < 500 && (
              <div className="atmos-card p-8 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-200">
                <div className="flex items-center gap-6">
                  <div className="text-6xl animate-float">🚀</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Keep Contributing!</h3>
                    <p className="text-slate-700 mb-4">
                      You're {medals.find(m => m.requirement > readingCount)?.requirement! - readingCount} readings away from the next medal.
                    </p>
                    <button
                      onClick={() => router.push("/submit")}
                      className="atmos-btn px-6 py-3 rounded-xl font-semibold"
                    >
                      Lodge New Reading →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 状态消息 */}
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
