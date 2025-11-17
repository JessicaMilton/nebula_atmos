"use client";

import { ethers } from "ethers";
import { RefObject, useCallback, useMemo, useRef, useState } from "react";
import type { FhevmInstance, UserDecryptResults } from "@/fhevm/fhevmTypes";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { useInMemoryStorage } from "@/fhevm/GenericStringStorage";
import { AirWitnessABI } from "@/abi/AirWitnessABI";
import { AirWitnessAddresses } from "@/abi/AirWitnessAddresses";

type SubmitParams = {
  pm25: number;
  pm10: number;
  visibility: number;
  smell: number;
  regionCode: string;
  metadataCID: string;
};

export function useAirWitness(parameters: {
  instance: FhevmInstance | undefined;
  chainId: number | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  sameChain: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: RefObject<(ethersSigner: ethers.JsonRpcSigner | undefined) => boolean>;
}) {
  const { instance, chainId, ethersSigner, ethersReadonlyProvider, sameChain, sameSigner } = parameters;
  const { storage } = useInMemoryStorage();

  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reportIds, setReportIds] = useState<number[] | undefined>(undefined);
  const [regionLastTs, setRegionLastTs] = useState<number | undefined>(undefined);
  const [lastReport, setLastReport] = useState<any | undefined>(undefined);
  const [clear, setClear] = useState<{ pm25: string | bigint; pm10: string | bigint; visibility: string | bigint; smell: string | bigint } | undefined>(undefined);
  const [userReportCount, setUserReportCount] = useState<number | undefined>(undefined);
  const [claimedBadges, setClaimedBadges] = useState<Record<number, boolean>>({});

  const contractInfo = useMemo(() => {
    if (!chainId) return undefined;
    const entry = AirWitnessAddresses[chainId.toString() as keyof typeof AirWitnessAddresses];
    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
    const rawAddress = entry?.address as `0x${string}` | undefined;
    // Treat zero-address or empty as not deployed
    const address =
      rawAddress && rawAddress.toLowerCase() !== ZERO_ADDRESS ? (rawAddress as `0x${string}`) : undefined;
    return { address, chainId: entry?.chainId ?? chainId, chainName: entry?.chainName, abi: AirWitnessABI.abi };
  }, [chainId]);

  const canSubmit = useMemo(() => {
    return Boolean(instance && ethersSigner && contractInfo?.address && !isSubmitting);
  }, [instance, ethersSigner, contractInfo?.address, isSubmitting]);

  const submitEncryptedReport = useCallback(
    async (p: SubmitParams) => {
      // Preflight checks with helpful messages
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
        setMessage("Calling submitReport...");
        const contract = new ethers.Contract(contractInfo.address, contractInfo.abi, ethersSigner);
        const tx = await contract.submitReport(
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
      setMessage("Loading region reports...");
      try {
        const contract = new ethers.Contract(contractInfo.address, contractInfo.abi, ethersReadonlyProvider);
        let ids: number[] = [];
        try {
          const result: bigint[] = await contract.getReportsByRegion(regionCode);
          ids = result.map((x) => Number(x));
        } catch (e) {
          // Fallback to event indexing when direct call fails (e.g., ABI/provider mismatch)
          const filter = contract.filters.ReportSubmitted(null, null, regionCode);
          const logs = await contract.queryFilter(filter, 0, "latest");
          ids = logs
            .map((l: any) => {
              try { return Number(l.args?.id); } catch { return 0; }
            })
            .filter((n: number) => Number.isFinite(n) && n > 0);
        }
        // Secondary fallback: scan all ReportSubmitted events and filter by regionCode in storage
        if (ids.length === 0) {
          try {
            const allLogs = await contract.queryFilter(contract.filters.ReportSubmitted(), 0, "latest");
            const allIds = allLogs
              .map((l: any) => {
                try { return Number(l.args?.id); } catch { return 0; }
              })
              .filter((n: number) => Number.isFinite(n) && n > 0);
            // fetch and filter by region equality (case-insensitive)
            const reports = await Promise.all(
              allIds.map(async (id) => {
                try { return await contract.getReport(id); } catch { return null; }
              })
            );
            ids = reports
              .map((r: any) => (r ? { id: Number(r.id), region: String(r.regionCode) } : null))
              .filter((x: any) => x !== null && x.region.toLowerCase() === regionCode.toLowerCase())
              .map((x: any) => x.id);
          } catch {
            // ignore
          }
        }
        // unique + sort desc
        const uniq = Array.from(new Set(ids)).sort((a, b) => b - a);
        setReportIds(uniq);
        setMessage(`Found ${uniq.length} reports`);

        // compute last updated timestamp
        if (uniq.length > 0) {
          const numIds = uniq;
          // fetch in parallel; in dev this is acceptable
          const reports = await Promise.all(
            numIds.map(async (id) => {
              try {
                const r = await contract.getReport(id);
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

  const refreshUserReportCount = useCallback(
    async (userAddress: string) => {
      if (!contractInfo?.address || !ethersReadonlyProvider) return;
      try {
        const contract = new ethers.Contract(contractInfo.address, contractInfo.abi, ethersReadonlyProvider);
        const count = await contract.getUserReportCount(userAddress);
        setUserReportCount(Number(count));
        
        // 同时刷新徽章状态
        const badges = await contract.getUserBadges(userAddress);
        setClaimedBadges({
          1: badges.bronze,
          2: badges.silver,
          3: badges.gold,
          4: badges.expert
        });
      } catch (e) {
        console.error("Failed to get user report count:", e);
        setUserReportCount(0);
      }
    },
    [contractInfo?.address, contractInfo?.abi, ethersReadonlyProvider]
  );

  const claimBadge = useCallback(
    async (badgeLevel: number) => {
      if (!contractInfo?.address || !ethersSigner) return;
      try {
        setMessage("正在领取徽章...");
        const contract = new ethers.Contract(contractInfo.address, contractInfo.abi, ethersSigner);
        const tx = await contract.claimBadge(badgeLevel);
        setMessage("等待交易确认...");
        await tx.wait();
        setMessage("徽章领取成功！");
        
        // 刷新徽章状态
        if (ethersSigner.address) {
          await refreshUserReportCount(ethersSigner.address);
        }
      } catch (e: any) {
        const errorMsg = String(e.message || e);
        if (errorMsg.includes("Badge already claimed")) {
          setMessage("该徽章已经领取过了");
        } else if (errorMsg.includes("Not enough reports")) {
          setMessage("报告数量不足，无法领取");
        } else {
          setMessage(`领取失败: ${errorMsg}`);
        }
      }
    },
    [contractInfo?.address, contractInfo?.abi, ethersSigner, refreshUserReportCount]
  );

  const loadAndDecrypt = useCallback(
    async (reportId: number) => {
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
      setMessage("Loading report...");
      setClear(undefined); // 清空之前的解密数据
      setLastReport(undefined);
      
      try {
        const contract = new ethers.Contract(contractInfo.address, contractInfo.abi, ethersReadonlyProvider);
        
        // 先检查 reportId 是否有效
        const nextId = await contract.nextReportId();
        if (reportId <= 0 || reportId >= Number(nextId)) {
          setMessage(`❌ 报告 #${reportId} 不存在！当前系统只有 ${Number(nextId) - 1} 份报告。请返回浏览页面查看可用报告。`);
          setIsDecrypting(false);
          return;
        }
        
        const report = await contract.getReport(reportId);
        setLastReport({ id: Number(report.id), regionCode: report.regionCode, metadataCID: report.metadataCID });

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
            { handle: report.pm25, contractAddress: contractInfo.address },
            { handle: report.pm10, contractAddress: contractInfo.address },
            { handle: report.visibility, contractAddress: contractInfo.address },
            { handle: report.smell, contractAddress: contractInfo.address }
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
          pm25: decrypted[String(report.pm25)],
          pm10: decrypted[String(report.pm10)],
          visibility: decrypted[String(report.visibility)],
          smell: decrypted[String(report.smell)]
        });
        setMessage("Decrypted!");
      } catch (e: any) {
        const errorMsg = String(e.message || e);
        if (errorMsg.includes("Report not found") || errorMsg.includes("revert")) {
          setMessage(`❌ 报告 #${reportId} 不存在或已被删除。请返回浏览页面查看可用报告。`);
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
    reportIds,
    regionReportIds: reportIds, // alias for convenience
    regionLastTimestamp: regionLastTs,
    lastReport,
    clear,
    userReportCount,
    claimedBadges,
    submitEncryptedReport,
    refreshRegion,
    loadAndDecrypt,
    refreshUserReportCount,
    claimBadge
  };
}


