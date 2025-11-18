import { isAddress, Eip1193Provider, JsonRpcProvider } from "ethers";
import type { FhevmInstance, FhevmInstanceConfig } from "../fhevmTypes";
import { RelayerSDKLoader } from "./RelayerSDKLoader";
import { publicKeyStorageGet, publicKeyStorageSet, publicKeyStorageClear } from "./PublicKeyStorage";

type FhevmRelayerStatusType =
  | "sdk-loading"
  | "sdk-loaded"
  | "sdk-initializing"
  | "sdk-initialized"
  | "creating";

type FhevmInitSDKOptions = { gatewayUrl?: string };
type FhevmInitSDKType = (options?: FhevmInitSDKOptions) => Promise<boolean>;
type FhevmLoadSDKType = () => Promise<void>;
type FhevmWindowType = { 
  relayerSDK: { 
    __initialized__?: boolean; 
    createInstance: (config: FhevmInstanceConfig) => Promise<FhevmInstance>; 
    SepoliaConfig: FhevmInstanceConfig;
    ZamaEthereumConfig: FhevmInstanceConfig;
    initSDK: FhevmInitSDKType;
  } 
};

export class FhevmAbortError extends Error {
  constructor(message = "FHEVM operation was cancelled") {
    super(message);
    this.name = "FhevmAbortError";
  }
}

const isFhevmWindowType = (w: any): w is FhevmWindowType => {
  return typeof w !== "undefined" && "relayerSDK" in w;
};

const isFhevmInitialized = (): boolean => {
  if (!isFhevmWindowType(window)) return false;
  return window.relayerSDK.__initialized__ === true;
};

const fhevmLoadSDK: FhevmLoadSDKType = () => {
  const loader = new RelayerSDKLoader({ trace: console.log });
  return loader.load();
};

const fhevmInitSDK: FhevmInitSDKType = async (options?: FhevmInitSDKOptions) => {
  if (!isFhevmWindowType(window)) throw new Error("window.relayerSDK is not available");
  
  // 根据 v0.3.0 文档，可以传入 gatewayUrl
  const initOptions = options || {};
  console.log("[fhevmInitSDK] Initializing with options:", initOptions);
  
  const result = await window.relayerSDK.initSDK(initOptions);
  console.log("[fhevmInitSDK] Init result:", result);
  
  window.relayerSDK.__initialized__ = result;
  if (!result) throw new Error("window.relayerSDK.initSDK failed.");
  return true;
};

type MockResolveResult = { isMock: true; chainId: number; rpcUrl: string };
type GenericResolveResult = { isMock: false; chainId: number; rpcUrl?: string };
type ResolveResult = MockResolveResult | GenericResolveResult;

async function getChainId(providerOrUrl: Eip1193Provider | string): Promise<number> {
  if (typeof providerOrUrl === "string") {
    const provider = new JsonRpcProvider(providerOrUrl);
    return Number((await provider.getNetwork()).chainId);
  }
  const chainId = await providerOrUrl.request({ method: "eth_chainId" });
  return Number.parseInt(chainId as string, 16);
}

async function getWeb3Client(rpcUrl: string) {
  const rpc = new JsonRpcProvider(rpcUrl);
  try {
    const version = await rpc.send("web3_clientVersion", []);
    return version;
  } finally {
    rpc.destroy();
  }
}

async function tryFetchFHEVMHardhatNodeRelayerMetadata(rpcUrl: string): Promise<
  | { ACLAddress: `0x${string}`; InputVerifierAddress: `0x${string}`; KMSVerifierAddress: `0x${string}` }
  | undefined
> {
  const version = await getWeb3Client(rpcUrl);
  if (typeof version !== "string" || !version.toLowerCase().includes("hardhat")) {
    return undefined;
  }
  const rpc = new JsonRpcProvider(rpcUrl);
  try {
    const metadata = await rpc.send("fhevm_relayer_metadata", []);
    if (!metadata) return undefined;
    return metadata;
  } catch {
    return undefined;
  } finally {
    rpc.destroy();
  }
}

async function resolve(providerOrUrl: Eip1193Provider | string, mockChains?: Record<number, string>): Promise<ResolveResult> {
  const chainId = await getChainId(providerOrUrl);
  let rpcUrl = typeof providerOrUrl === "string" ? providerOrUrl : undefined;
  const _mockChains: Record<number, string> = { 31337: "http://localhost:8545", ...(mockChains ?? {}) };
  if (Object.prototype.hasOwnProperty.call(_mockChains, chainId)) {
    if (!rpcUrl) rpcUrl = _mockChains[chainId];
    return { isMock: true, chainId, rpcUrl };
  }
  return { isMock: false, chainId, rpcUrl };
}

function checkIsAddress(a: unknown): a is `0x${string}` {
  if (typeof a !== "string") return false;
  if (!isAddress(a)) return false;
  return true;
}

export const createFhevmInstance = async (parameters: {
  provider: Eip1193Provider | string;
  mockChains?: Record<number, string>;
  signal: AbortSignal;
  onStatusChange?: (status: FhevmRelayerStatusType) => void;
}): Promise<FhevmInstance> => {
  const { signal, provider: providerOrUrl, mockChains, onStatusChange } = parameters;
  const throwIfAborted = () => { if (signal.aborted) throw new FhevmAbortError(); };
  const notify = (s: FhevmRelayerStatusType) => onStatusChange?.(s);

  const { isMock, rpcUrl, chainId } = await resolve(providerOrUrl, mockChains);
  console.log("[createFhevmInstance] Network detected:", { isMock, chainId, rpcUrl });
  
  if (isMock) {
    console.log("[createFhevmInstance] Mock network detected, fetching metadata...");
    const meta = await tryFetchFHEVMHardhatNodeRelayerMetadata(rpcUrl!);
    if (meta) {
      console.log("[createFhevmInstance] Metadata found:", meta);
      notify("creating");
      const fhevmMock = await import("./mock/fhevmMock");
      const mockInstance = await fhevmMock.fhevmMockCreateInstance({ rpcUrl: rpcUrl!, chainId: 31337, metadata: meta });
      throwIfAborted();
      console.log("[createFhevmInstance] Mock instance created successfully");
      return mockInstance;
    } else {
      console.warn("[createFhevmInstance] Mock network but no metadata found, falling back to SepoliaConfig");
    }
  }

  throwIfAborted();
  if (!isFhevmWindowType(window)) {
    notify("sdk-loading");
    await fhevmLoadSDK();
    throwIfAborted();
    notify("sdk-loaded");
  }
  if (!isFhevmInitialized()) {
    notify("sdk-initializing");
    await fhevmInitSDK();
    throwIfAborted();
    notify("sdk-initialized");
  }

  const relayerSDK = (window as unknown as FhevmWindowType).relayerSDK;
  
  // 根据升级文档，Sepolia 应使用 ZamaEthereumConfig（v0.9+）
  const baseConfig = relayerSDK.ZamaEthereumConfig || relayerSDK.SepoliaConfig;
  const configName = relayerSDK.ZamaEthereumConfig ? "ZamaEthereumConfig" : "SepoliaConfig";
  console.log(`[createFhevmInstance] Using ${configName} for Sepolia`);
  
  const aclAddress = baseConfig.aclContractAddress as string;
  console.log("[createFhevmInstance] ACL Address:", aclAddress);
  if (!checkIsAddress(aclAddress)) throw new Error(`Invalid ACL address: ${aclAddress}`);

  const pub = await publicKeyStorageGet(aclAddress as `0x${string}`);
  console.log("[createFhevmInstance] Public key from storage:", pub.publicKey ? "found" : "not found");
  throwIfAborted();

  // 关键修复：如果没有缓存的 public key，不要传入 undefined
  // 让 SDK 自己从网络获取
  const config: FhevmInstanceConfig = {
    ...baseConfig,
    network: providerOrUrl,
    // 只有当 public key 存在且有效时才传入
    ...(pub.publicKey?.data ? { publicKey: pub.publicKey } : {}),
    ...(pub.publicParams ? { publicParams: pub.publicParams as any } : {})
  };
  console.log("[createFhevmInstance] Config prepared:", { 
    hasPublicKey: !!config.publicKey, 
    hasPublicParams: !!config.publicParams,
    aclAddress: config.aclContractAddress,
    gatewayUrl: (config as any).gatewayUrl || "default"
  });

  notify("creating");
  console.log("[createFhevmInstance] Calling relayerSDK.createInstance...");
  try {
    const instance = await relayerSDK.createInstance(config);
    console.log("[createFhevmInstance] Instance created successfully");
    
    // 保存获取到的 public key 供下次使用
    await publicKeyStorageSet(
      aclAddress as `0x${string}`,
      instance.getPublicKey(),
      instance.getPublicParams(2048) as any
    );
    throwIfAborted();
    return instance;
  } catch (err) {
    console.error("[createFhevmInstance] Failed to create instance:", err);
    const message = (err as any)?.message ?? "";
    // 若为公钥反序列化失败，清空缓存并重试一次（不携带缓存公钥）
    if (typeof message === "string" && /Invalid public key|deserialization failed/i.test(message)) {
      try {
        console.warn("[createFhevmInstance] Detected invalid cached public key. Clearing storage and retrying without cached keys...");
        await publicKeyStorageClear(aclAddress as `0x${string}`);
        const configNoKeys: FhevmInstanceConfig = {
          ...baseConfig,
          network: providerOrUrl
        };
        const instance = await relayerSDK.createInstance(configNoKeys);
        console.log("[createFhevmInstance] Instance created successfully on retry (fresh keys)");
        await publicKeyStorageSet(
          aclAddress as `0x${string}`,
          instance.getPublicKey(),
          instance.getPublicParams(2048) as any
        );
        throwIfAborted();
        return instance;
      } catch (retryErr) {
        console.error("[createFhevmInstance] Retry after clearing storage also failed:", retryErr);
        throw retryErr;
      }
    }
    throw err;
  }
};


