"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useFhevm } from "@/fhevm/useFhevm";
import { useNebulaAtmos } from "@/hooks/useNebulaAtmos";

export const ExplorePage = () => {
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

  const [searchRegion, setSearchRegion] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [sortBy, setSortBy] = useState<"time" | "id">("time");

  const handleSearch = () => {
    const region = searchRegion.trim();
    if (region) {
      nebula.refreshRegion(region);
    }
  };

  const lastUpdatedText = useMemo(() => {
    if (!nebula.regionLastTimestamp) return undefined;
    const now = Math.floor(Date.now() / 1000);
    const diff = Math.max(0, now - nebula.regionLastTimestamp);
    const minutes = Math.floor(diff / 60);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }, [nebula.regionLastTimestamp]);

  return (
    <div className="min-h-screen atmos-bg p-8">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push("/")}
              className="mb-4 px-4 py-2 atmos-card rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              ← Dashboard
            </button>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Explore Data Network</h1>
            <p className="text-slate-600">Search and filter encrypted air quality readings across all regions</p>
          </div>

          {/* 视图切换 */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("table")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                viewMode === "table" ? "bg-violet-600 text-white shadow-lg" : "atmos-card text-slate-700"
              }`}
            >
              📊 Table
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                viewMode === "grid" ? "bg-violet-600 text-white shadow-lg" : "atmos-card text-slate-700"
              }`}
            >
              🎴 Grid
            </button>
          </div>
        </div>

        {/* 搜索与筛选 */}
        <div className="atmos-card p-6 rounded-2xl mb-8">
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchRegion}
                onChange={(e) => setSearchRegion(e.target.value)}
                placeholder="Search by region (e.g., Shanghai-Pudong)"
                className="atmos-input w-full px-4 py-3 rounded-xl"
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={nebula.isRefreshing}
              className="atmos-btn px-8 py-3 rounded-xl font-semibold disabled:opacity-50"
            >
              {nebula.isRefreshing ? "⏳ Searching..." : "🔍 Search"}
            </button>
          </div>

          {/* 高级筛选 */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-slate-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "time" | "id")}
              className="atmos-input px-3 py-2 rounded-lg text-sm"
            >
              <option value="time">Latest First</option>
              <option value="id">ID (Desc)</option>
            </select>

            {nebula.regionReadingIds && (
              <span className="ml-auto text-sm text-slate-600">
                Found <span className="font-bold text-violet-600">{nebula.regionReadingIds.length}</span> readings
              </span>
            )}
          </div>
        </div>

        {/* 统计摘要 */}
        {nebula.regionReadingIds && nebula.regionReadingIds.length > 0 && (
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="atmos-card p-6 rounded-2xl">
              <p className="text-sm text-slate-600 mb-2">Current Region</p>
              <p className="text-2xl font-bold text-slate-800">{searchRegion || "—"}</p>
            </div>
            <div className="atmos-card p-6 rounded-2xl">
              <p className="text-sm text-slate-600 mb-2">Total Readings</p>
              <p className="text-2xl font-bold text-violet-600 stat-label">{nebula.regionReadingIds.length}</p>
            </div>
            <div className="atmos-card p-6 rounded-2xl">
              <p className="text-sm text-slate-600 mb-2">Last Updated</p>
              <p className="text-2xl font-bold text-cyan-600">{lastUpdatedText || "—"}</p>
            </div>
          </div>
        )}

        {/* 数据展示 */}
        {!nebula.regionReadingIds && (
          <div className="atmos-card p-12 rounded-2xl text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
              🔍
            </div>
            <p className="text-lg text-slate-600 mb-2">Start exploring by entering a region code</p>
            <p className="text-sm text-slate-500">e.g., Shanghai-Pudong, London-Camden</p>
          </div>
        )}

        {nebula.regionReadingIds && nebula.regionReadingIds.length === 0 && (
          <div className="atmos-card p-12 rounded-2xl text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
              📭
            </div>
            <p className="text-lg text-slate-700 font-semibold mb-2">No readings found for this region</p>
            <p className="text-sm text-slate-600 mb-6">Be the first to contribute data!</p>
            <button
              onClick={() => router.push("/submit")}
              className="atmos-btn px-6 py-3 rounded-xl font-semibold"
            >
              Lodge First Reading →
            </button>
          </div>
        )}

        {/* 表格视图 */}
        {viewMode === "table" && nebula.regionReadingIds && nebula.regionReadingIds.length > 0 && (
          <div className="atmos-card rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">Reading ID</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">Region</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">Status</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {nebula.regionReadingIds.map((id: number, idx: number) => (
                  <tr
                    key={id.toString()}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    onClick={() => router.push(`/report/${id.toString()}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center text-sm font-bold text-violet-700">
                          #{id.toString()}
                        </div>
                        <span className="font-mono text-sm font-semibold text-slate-800">Reading {id.toString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-700">{searchRegion}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                        🔐 Encrypted
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="atmos-btn px-4 py-2 rounded-lg text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        Decrypt & View →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 网格视图 */}
        {viewMode === "grid" && nebula.regionReadingIds && nebula.regionReadingIds.length > 0 && (
          <div className="grid grid-cols-3 gap-6">
            {nebula.regionReadingIds.map((id: number, idx: number) => (
              <div
                key={id.toString()}
                onClick={() => router.push(`/report/${id.toString()}`)}
                className="atmos-card p-6 rounded-2xl cursor-pointer group"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xl shadow-lg">
                    📊
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                    🔐 Encrypted
                  </span>
                </div>

                <h3 className="font-mono text-lg font-bold text-slate-800 mb-1 group-hover:text-violet-600 transition-colors">
                  Reading #{id.toString()}
                </h3>
                <p className="text-sm text-slate-600 mb-4">{searchRegion}</p>

                <div className="pt-4 border-t border-slate-100">
                  <span className="text-sm font-semibold text-violet-600 flex items-center gap-2">
                    Decrypt & View <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 状态消息 */}
        {nebula.message && (
          <div className="mt-6 atmos-card p-4 rounded-xl">
            <p className="text-sm font-semibold text-cyan-700">📡 {nebula.message}</p>
          </div>
        )}
      </div>
    </div>
  );
};
