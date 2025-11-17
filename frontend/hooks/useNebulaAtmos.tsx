"use client";

import { ethers } from "ethers";
import { RefObject, useCallback, useMemo, useState } from "react";
import type { FhevmInstance, UserDecryptResults } from "@/fhevm/fhevmTypes";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { useInMemoryStorage } from "@/fhevm/GenericStringStorage";
import { NebulaAtmosABI } from "@/abi/NebulaAtmosABI";
import { NebulaAtmosAddresses } from "@/abi/NebulaAtmosAddresses";

type SubmitParams = {
  pm25: number;
  pm10: number;
  visibility: number;
  smell: number;
  regionCode: string;
  metadataCID: string;
};

export function useNebulaAtmos(parameters: {
  instance: FhevmInstance | undefined;
  chainId: number | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  sameChain: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: RefObject<(ethersSigner: ethers.JsonRpcSigner | undefined) => boolean>;
}) {
  const { instance, chainId, ethersSigner, ethersReadonlyProvider } = parameters;
  const { storage } = useInMemoryStorage();

  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [readingIds, setReadingIds] = useState<number[] | undefined>(undefined);
  const [regionLastTs, setRegionLastTs] = useState<number | undefined>(undefined);
  const [lastReading, setLastReading] = useState<any | undefined>(undefined);
  const [clear, setClear] = useState<{ pm25: string | bigint; pm10: string | bigint; visibility: string | bigint; smell: string | bigint } | undefined>(undefined);
  const [userReadingCount, setUserReadingCount] = useState<number | undefined>(undefined);
  const [claimedMedals, setClaimedMedals] = useState<Record<number, boolean>>({});

  const contractInfo = useMemo(() => {
    if (!chainId) return undefined;
    const entry = NebulaAtmosAddresses[chainId.toString() as keyof typeof NebulaAtmosAddresses];
    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
    const rawAddress = entry?.address as `0x${string}` | undefined;
    const address = rawAddress && rawAddress.toLowerCase() !== ZERO_ADDRESS ? (rawAddress as `0x${string}`) : undefined;
    return { address, chainId: entry?.chainId ?? chainId, chainName: entry?.chainName, abi: NebulaAtmosABI.abi };
  }, [chainId]);

  const canSubmit = useMemo(() => {
    return Boolean(instance && ethersSigner && contractInfo?.address && !isSubmitting);
  }, [instance, ethersSigner, contractInfo?.address, isSubmitting]);

  const lodgeEncryptedReading = useCallback(
    async (p: SubmitParams) => {
      if (!contractInfo?.address) {
        setMessage("当前网络未部署合约或地址未配置");
        return;
      }
      if (!ethersSigner) {
        setMessage("请先连接钱包");
        return;
      }
      if (!instance) {
        setMessage("FHEVM 未就绪，请稍后重试");
        return;
      }
      if (!canSubmit) {
        setMessage("正在处理或条件未满足，请稍后再试");
        return;
      }
      setIsSubmitting(true);
      setMessage("Encrypting...");
      try {
        const input = instance.createEncryptedInput(contractInfo.address, ethersSigner.address);
        input.add32(p.pm25);
        input.add32(p.pm10);
        input.add32(p.visibility);
        input.add32(p.smell);
        const enc = await input.encrypt().catch((e: any) => {
          throw new Error(`加密失败: ${String(e?.message || e)}`);
        });
        setMessage("Calling lodgeReading...");
        const contract = new ethers.Contract(contractInfo.address, contractInfo.abi, ethersSigner);
        const tx = await contract.lodgeReading(
          enc.handles[0],
          enc.handles[1],
          enc.handles[2],
          enc.handles[3],
          enc.inputProof,
          p.metadataCID,
          p.regionCode
        );
        setMessage(`Waiting tx: ${tx.hash}`);
        await tx.wait();
        setMessage("Submitted!");
      } catch (e) {
        setMessage(`Failed: ${String(e)}`);
      } finally {
        setIsSubmitting(false);
      }
    },
    [canSubmit, contractInfo?.address, ethersSigner, instance]
  );

  const canRefreshRegion = useMemo(() => {
    return Boolean(contractInfo?.address && ethersReadonlyProvider && !isRefreshing);
  }, [contractInfo?.address, ethersReadonlyProvider, isRefreshing]);

  const refreshRegion = useCallback(
    async (regionCode: string) => {
      if (!contractInfo?.address) {
        setMessage("当前网络未部署合约或地址未配置");
        return;
      }
      if (!ethersReadonlyProvider) {
        setMessage("只读 Provider 不可用");
        return;
      }
      if (!canRefreshRegion) {
        return;
      }
      setIsRefreshing(true);
      setMessage("Loading region readings...");
      try {
        const contract = new ethers.Contract(contractInfo.address, contractInfo.abi, ethersReadonlyProvider);
        let ids: number[] = [];
        try {
          const result: bigint[] = await contract.listRegionReadings(regionCode);
          ids = result.map((x) => Number(x));
        } catch (e) {
          const filter = contract.filters.ReadingLogged(null, null, regionCode);
          const logs = await contract.queryFilter(filter, 0, "latest");
          ids = logs
            .map((l: any) => {
              try { return Number(l.args?.id); } catch { return 0; }
            })
            .filter((n: number) => Number.isFinite(n) && n > 0);
        }
        if (ids.length === 0) {
          try {
            const allLogs = await contract.queryFilter(contract.filters.ReadingLogged(), 0, "latest");
            const allIds = allLogs
              .map((l: any) => {
                try { return Number(l.args?.id); } catch { return 0; }
              })
              .filter((n: number) => Number.isFinite(n) && n > 0);
            const readings = await Promise.all(
              allIds.map(async (id) => {
                try { return await contract.fetchReading(id); } catch { return null; }
              })
            );
            ids = readings
              .map((r: any) => (r ? { id: Number(r.id), region: String(r.regionCode) } : null))
              .filter((x: any) => x !== null && x.region.toLowerCase() === regionCode.toLowerCase())
              .map((x: any) => x.id);
          } catch {
            // ignore
          }
        }
        const uniq = Array.from(new Set(ids)).sort((a, b) => b - a);
        setReadingIds(uniq);
        setMessage(`Found ${uniq.length} readings`);

        if (uniq.length > 0) {
          const numIds = uniq;
          const reports = await Promise.all(
            numIds.map(async (id) => {
              try {
                const r = await contract.fetchReading(id);
                return Number(r.timestamp);
              } catch {
                return 0;
              }
            })
          );
          const maxTs = reports.reduce((m, t) => (t > m ? t : m), 0);
          setRegionLastTs(maxTs > 0 ? maxTs : undefined);
        } else {
          setRegionLastTs(undefined);
        }
      } catch (e) {
        setMessage(`Failed: ${String(e)}`);
      } finally {
        setIsRefreshing(false);
      }
    },
    [canRefreshRegion, contractInfo?.address, ethersReadonlyProvider]
  );

  const canDecrypt = useMemo(() => {
    return Boolean(instance && ethersSigner && contractInfo?.address && !isDecrypting);
  }, [instance, ethersSigner, contractInfo?.address, isDecrypting]);

  const refreshUserReadingCount = useCallback(
    async (userAddress: string) => {
      if (!contractInfo?.address || !ethersReadonlyProvider) return;
      try {
        const contract = new ethers.Contract(contractInfo.address, contractInfo.abi, ethersReadonlyProvider);
        const count = await contract.totalUserReadings(userAddress);
        setUserReadingCount(Number(count));

        const medals = await contract.getUserMedals(userAddress);
        setClaimedMedals({
          1: medals.bronze,
          2: medals.silver,
          3: medals.gold,
          4: medals.expert
        });
      } catch (e) {
        console.error("Failed to get user reading count:", e);
        setUserReadingCount(0);
      }
    },
    [contractInfo?.address, contractInfo?.abi, ethersReadonlyProvider]
  );

  const redeemMedal = useCallback(
    async (tier: number) => {
      if (!contractInfo?.address || !ethersSigner) return;
      try {
        setMessage("正在领取勋章...");
        const contract = new ethers.Contract(contractInfo.address, contractInfo.abi, ethersSigner);
        const tx = await contract.redeemMedal(tier);
        setMessage("等待交易确认...");
        await tx.wait();
        setMessage("勋章领取成功！");
        if (ethersSigner.address) {
          await refreshUserReadingCount(ethersSigner.address);
        }
      } catch (e: any) {
        const errorMsg = String(e.message || e);
        if (errorMsg.includes("Medal already redeemed")) {
          setMessage("该勋章已经领取过了");
        } else if (errorMsg.includes("Not enough readings")) {
          setMessage("读数数量不足，无法领取");
        } else {
          setMessage(`领取失败: ${errorMsg}`);
        }
      }
    },
    [contractInfo?.address, contractInfo?.abi, ethersSigner, refreshUserReadingCount]
  );

  const loadAndDecrypt = useCallback(
    async (readingId: number) => {
      if (!contractInfo?.address) {
        setMessage("当前网络未部署合约或地址未配置");
        return;
      }
      if (!ethersReadonlyProvider) {
        setMessage("只读 Provider 不可用");
        return;
      }
      if (!canDecrypt || !ethersSigner || !instance) {
        return;
      }
      setIsDecrypting(true);
      setMessage("Loading reading...");
      setClear(undefined);
      setLastReading(undefined);
      try {
        const contract = new ethers.Contract(contractInfo.address, contractInfo.abi, ethersReadonlyProvider);
        const nextId = await contract.nextReadingId();
        if (readingId <= 0 || readingId >= Number(nextId)) {
          setMessage(`❌ 读数 #${readingId} 不存在！当前系统只有 ${Number(nextId) - 1} 条记录。`);
          setIsDecrypting(false);
          return;
        }
        const reading = await contract.fetchReading(readingId);
        setLastReading({ id: Number(reading.id), regionCode: reading.regionCode, metadataCID: reading.metadataCID });

        const sig = await FhevmDecryptionSignature.loadOrSign(
          instance,
          [contractInfo.address as `0x${string}`],
          ethersSigner,
          storage
        );
        if (!sig) {
          setMessage("Signature unavailable");
          return;
        }
        setMessage("Decrypting...");
        const res: UserDecryptResults = await instance.userDecrypt(
          [
            { handle: reading.pm25, contractAddress: contractInfo.address },
            { handle: reading.pm10, contractAddress: contractInfo.address },
            { handle: reading.visibility, contractAddress: contractInfo.address },
            { handle: reading.smell, contractAddress: contractInfo.address }
          ],
          sig.privateKey,
          sig.publicKey,
          sig.signature,
          sig.contractAddresses,
          sig.userAddress,
          sig.startTimestamp,
          sig.durationDays
        );
        const decrypted = res as unknown as Record<string, string | bigint>;
        setClear({
          pm25: decrypted[String(reading.pm25)],
          pm10: decrypted[String(reading.pm10)],
          visibility: decrypted[String(reading.visibility)],
          smell: decrypted[String(reading.smell)]
        });
        setMessage("Decrypted!");
      } catch (e: any) {
        const errorMsg = String(e.message || e);
        if (errorMsg.includes("Reading not found") || errorMsg.includes("revert")) {
          setMessage(`❌ 读数 #${readingId} 不存在或已被删除。`);
        } else {
          setMessage(`Failed: ${errorMsg}`);
        }
      } finally {
        setIsDecrypting(false);
      }
    },
    [canDecrypt, contractInfo?.address, ethersSigner, instance, ethersReadonlyProvider, storage]
  );

  return {
    message,
    isSubmitting,
    isDecrypting,
    isRefreshing,
    canSubmit,
    canDecrypt,
    canRefreshRegion,
    readingIds,
    regionReadingIds: readingIds,
    regionLastTimestamp: regionLastTs,
    lastReading,
    clear,
    userReadingCount,
    claimedMedals,
    lodgeEncryptedReading,
    refreshRegion,
    loadAndDecrypt,
    refreshUserReadingCount,
    redeemMedal
  };
}


