"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useFhevm } from "@/fhevm/useFhevm";

export const HomePage = () => {
  const router = useRouter();
  const {
    provider,
    chainId,
    accounts,
    isConnected,
    connect,
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

  const [activeNav, setActiveNav] = useState("dashboard");
  const [liveData, setLiveData] = useState({ readings: 1247, regions: 89, activeUsers: 342 });

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveData(prev => ({
        readings: prev.readings + Math.floor(Math.random() * 3),
        regions: prev.regions + (Math.random() > 0.95 ? 1 : 0),
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 5) - 2
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const quickStats = [
    { label: "Total Readings", value: liveData.readings, icon: "📊", color: "from-violet-500 to-purple-600", trend: "+12%" },
    { label: "Active Regions", value: liveData.regions, icon: "🌍", color: "from-cyan-500 to-blue-600", trend: "+5%" },
    { label: "Contributors", value: liveData.activeUsers, icon: "👥", color: "from-pink-500 to-rose-600", trend: "+8%" },
    { label: "Encrypted", value: "100%", icon: "🔐", color: "from-emerald-500 to-green-600", trend: "FHEVM" },
  ];

  const recentRegions = [
    { name: "Shanghai-Pudong", pm25: 78, trend: "up", readings: 45, lastUpdate: "2m ago" },
    { name: "London-Camden", pm25: 32, trend: "down", readings: 89, lastUpdate: "5m ago" },
    { name: "Delhi-Connaught", pm25: 156, trend: "up", readings: 123, lastUpdate: "8m ago" },
    { name: "Paris-Marais", pm25: 28, trend: "stable", readings: 67, lastUpdate: "12m ago" },
  ];

  const getPM25Color = (pm25: number) => {
    if (pm25 < 35) return "text-emerald-600 bg-emerald-50";
    if (pm25 < 75) return "text-amber-600 bg-amber-50";
    return "text-rose-600 bg-rose-50";
  };

  return (
    <div className="flex min-h-screen atmos-bg">
      {/* 左侧边栏导航 */}
      <aside className="sidebar-nav w-72 min-h-screen fixed left-0 top-0 flex flex-col p-6">
        <div className="mb-12">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
            Nebula Atmos
          </h1>
          <p className="text-sm text-slate-600 mt-1">Ambient Intelligence Network</p>
        </div>

        {/* 连接状态 */}
        {!isConnected ? (
          <button
            onClick={connect}
            className="atmos-btn w-full py-3 rounded-xl mb-8 text-sm"
          >
            Connect Wallet
          </button>
        ) : (
          <div className="mb-8 p-4 atmos-card rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-semibold text-slate-600">Connected</span>
            </div>
            <p className="font-mono text-xs text-slate-800 font-semibold truncate">
              {accounts?.[0]}
            </p>
            <div className="flex items-center justify-between mt-3 text-xs">
              <span className="text-slate-500">Chain {chainId}</span>
              <span className={`font-semibold ${fhevmStatus === 'ready' ? 'text-emerald-600' : 'text-amber-600'}`}>
                {fhevmStatus}
              </span>
            </div>
          </div>
        )}

        {/* 导航菜单 */}
        <nav className="flex-1 space-y-2">
          {[
            { id: "dashboard", label: "Dashboard", icon: "📊", route: "/" },
            { id: "submit", label: "Submit Reading", icon: "📝", route: "/submit" },
            { id: "explore", label: "Explore Data", icon: "🔍", route: "/explore" },
            { id: "profile", label: "My Profile", icon: "👤", route: "/profile" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveNav(item.id);
                if (item.route !== "/") router.push(item.route);
              }}
              className={`nav-item w-full px-4 py-3 rounded-lg text-left flex items-center gap-3 ${
                activeNav === item.id ? "active" : ""
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* 底部信息 */}
        <div className="pt-6 border-t border-slate-200">
          <p className="text-xs text-slate-500 text-center">Powered by Zama FHEVM</p>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 ml-72 p-8">
        <div className="max-w-7xl mx-auto">
          {/* 顶部欢迎区 */}
          <div className="mb-8 animate-slide-up">
            <h2 className="text-4xl font-bold text-slate-800 mb-2">Welcome back! 👋</h2>
            <p className="text-slate-600">Monitor real-time air quality data with privacy-preserving encryption.</p>
          </div>

          {/* 快速统计卡片 */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            {quickStats.map((stat, idx) => (
              <div
                key={idx}
                className="atmos-card p-6 rounded-2xl animate-scale-in"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-2xl shadow-lg`}>
                    {stat.icon}
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    {stat.trend}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-slate-800 stat-label">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* 主要操作区 - 横向布局 */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* 提交新读数 */}
            <div
              onClick={() => router.push("/submit")}
              className="atmos-card p-8 rounded-2xl cursor-pointer group"
            >
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-3xl shadow-xl group-hover:scale-110 transition-transform">
                  📝
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-slate-800 mb-2 group-hover:text-violet-600 transition-colors">
                    Lodge New Reading
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    Submit encrypted air quality data (PM2.5, visibility, odor) to the blockchain with full privacy protection.
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-violet-600">
                    Start now <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 探索数据 */}
            <div
              onClick={() => router.push("/explore")}
              className="atmos-card p-8 rounded-2xl cursor-pointer group"
            >
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-3xl shadow-xl group-hover:scale-110 transition-transform">
                  🔍
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-slate-800 mb-2 group-hover:text-cyan-600 transition-colors">
                    Explore Insights
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    Browse global air quality readings, filter by region and time, decrypt authorized data with FHEVM.
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-600">
                    Explore now <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 实时区域数据 */}
          <div className="atmos-card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">Live Regional Updates</h3>
              <span className="flex items-center gap-2 text-xs text-slate-500">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                Real-time
              </span>
            </div>
            <div className="space-y-3">
              {recentRegions.map((region, idx) => (
                <div
                  key={idx}
                  onClick={() => router.push(`/region/${region.name}`)}
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-xl">
                      🌍
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800 group-hover:text-violet-600 transition-colors">
                        {region.name}
                      </p>
                      <p className="text-xs text-slate-500">{region.readings} readings · {region.lastUpdate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`px-4 py-2 rounded-lg ${getPM25Color(region.pm25)}`}>
                      <p className="text-xs font-semibold">PM2.5</p>
                      <p className="text-lg font-bold stat-label">{region.pm25}</p>
                    </div>
                    <div className="text-2xl">
                      {region.trend === "up" ? "📈" : region.trend === "down" ? "📉" : "➡️"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
