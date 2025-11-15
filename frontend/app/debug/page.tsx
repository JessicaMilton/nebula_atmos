"use client";

import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useFhevm } from "@/fhevm/useFhevm";

export default function DebugPage() {
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
    error: fhevmError,
  } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: isConnected,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-white mb-8">🔍 FHEVM Debug Panel</h1>

        {/* MetaMask 状态 */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">MetaMask Status</h2>
          <div className="space-y-2 text-white/80 font-mono text-sm">
            <div>Connected: <span className={isConnected ? "text-green-400" : "text-red-400"}>{String(isConnected)}</span></div>
            <div>Chain ID: <span className="text-yellow-400">{chainId ?? "undefined"}</span></div>
            <div>Accounts: <span className="text-blue-400">{accounts?.join(", ") || "none"}</span></div>
            <div>Provider: <span className="text-purple-400">{provider ? "available" : "undefined"}</span></div>
          </div>
          <button 
            onClick={connect} 
            disabled={isConnected}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg disabled:opacity-50"
          >
            {isConnected ? "Connected" : "Connect Wallet"}
          </button>
        </div>

        {/* FHEVM 状态 */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">FHEVM Status</h2>
          <div className="space-y-2 text-white/80 font-mono text-sm">
            <div>Status: <span className={
              fhevmStatus === "ready" ? "text-green-400" :
              fhevmStatus === "error" ? "text-red-400" :
              fhevmStatus === "loading" ? "text-yellow-400" :
              "text-gray-400"
            }>{fhevmStatus}</span></div>
            <div>Instance: <span className="text-purple-400">{fhevmInstance ? "created" : "undefined"}</span></div>
            <div>Mock Chains: <span className="text-blue-400">{JSON.stringify(initialMockChains)}</span></div>
          </div>
        </div>

        {/* 错误信息 */}
        {fhevmError && (
          <div className="bg-red-500/20 backdrop-blur-md rounded-xl p-6 border border-red-500/50">
            <h2 className="text-xl font-bold text-red-300 mb-4">❌ Error Details</h2>
            <div className="space-y-2 text-red-200 font-mono text-sm">
              <div>Message: {fhevmError.message}</div>
              <div>Name: {fhevmError.name}</div>
              {fhevmError.stack && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-red-300 hover:text-red-100">Stack Trace</summary>
                  <pre className="mt-2 text-xs overflow-x-auto whitespace-pre-wrap">{fhevmError.stack}</pre>
                </details>
              )}
            </div>
          </div>
        )}

        {/* 浏览器控制台提示 */}
        <div className="bg-blue-500/20 backdrop-blur-md rounded-xl p-6 border border-blue-500/50">
          <h2 className="text-xl font-bold text-blue-300 mb-4">💡 Debugging Tips</h2>
          <ul className="space-y-2 text-blue-200 text-sm">
            <li>• 打开浏览器开发者工具 (F12)</li>
            <li>• 查看 Console 标签页中的详细日志</li>
            <li>• 查看 Network 标签页，检查 wasm 文件是否成功加载</li>
            <li>• 确保 MetaMask 连接到正确的网络：
              <ul className="ml-6 mt-1 space-y-1">
                <li>- Localhost 8545 (Chain ID: 31337) - 本地开发</li>
                <li>- Sepolia (Chain ID: 11155111) - 测试网</li>
              </ul>
            </li>
          </ul>
        </div>

        {/* 网络信息 */}
        <div className="bg-purple-500/20 backdrop-blur-md rounded-xl p-6 border border-purple-500/50">
          <h2 className="text-xl font-bold text-purple-300 mb-4">🌐 Network Info</h2>
          <div className="space-y-2 text-purple-200 text-sm">
            {chainId === 31337 && (
              <div className="text-green-300">
                ✅ 本地 Hardhat 网络 (开发模式)
                <br/>
                确保已启动: <code className="bg-black/30 px-2 py-1 rounded">npx hardhat node</code>
              </div>
            )}
            {chainId === 11155111 && (
              <div className="text-yellow-300">
                ⚠️ Sepolia 测试网
                <br/>
                需要测试 ETH 和正确的 KMS 配置
              </div>
            )}
            {chainId && chainId !== 31337 && chainId !== 11155111 && (
              <div className="text-red-300">
                ❌ 不支持的网络 (Chain ID: {chainId})
                <br/>
                请切换到 Localhost 或 Sepolia
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

