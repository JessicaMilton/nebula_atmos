import { openDB, type DBSchema, type IDBPDatabase } from "idb";

interface PublicParamsDB extends DBSchema {
  paramsStore: {
    key: `0x${string}`;
    value: {
      version: number;
      seed: string;
      delta: string;
    };
  };
  publicKeyStore: {
    key: `0x${string}`;
    value: {
      publicKeyId: string;
      publicKey: Uint8Array;
    };
  };
}

let __dbPromise: Promise<IDBPDatabase<PublicParamsDB>> | undefined = undefined;

async function _getDB(): Promise<IDBPDatabase<PublicParamsDB> | undefined> {
  if (__dbPromise) return __dbPromise;
  if (typeof window === "undefined") return undefined;
  __dbPromise = openDB<PublicParamsDB>("fhevm", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("paramsStore")) {
        db.createObjectStore("paramsStore", { keyPath: "acl" as any });
      }
      if (!db.objectStoreNames.contains("publicKeyStore")) {
        db.createObjectStore("publicKeyStore", { keyPath: "acl" as any });
      }
    }
  }) as unknown as Promise<IDBPDatabase<PublicParamsDB>>;
  return __dbPromise;
}

export async function publicKeyStorageGet(aclAddress: `0x${string}`): Promise<{
  publicKey?: { id: string | null; data: Uint8Array | null };
  publicParams: Record<"2048", { version: number; seed: string; delta: string }> | null;
}> {
  const db = await _getDB();
  if (!db) return { publicParams: null };

  let storedPublicKey: { publicKeyId: string; publicKey: Uint8Array } | null = null;
  try {
    const pk = await db.get("publicKeyStore", aclAddress as any);
    if (pk?.publicKey) storedPublicKey = pk;
  } catch {}

  let storedPublicParams: { version: number; seed: string; delta: string } | null = null;
  try {
    const pp = await db.get("paramsStore", aclAddress as any);
    if (pp) storedPublicParams = pp as any;
  } catch {}

  const publicParams = storedPublicParams ? { "2048": storedPublicParams } : null;
  const publicKey = storedPublicKey
    ? { id: storedPublicKey.publicKeyId, data: storedPublicKey.publicKey }
    : undefined;

  return { ...(publicKey && { publicKey }), publicParams };
}

export async function publicKeyStorageSet(
  aclAddress: `0x${string}`,
  publicKey: { publicKeyId: string; publicKey: Uint8Array } | null,
  publicParams: { version: number; seed: string; delta: string } | null
) {
  const db = await _getDB();
  if (!db) return;
  try {
    if (publicKey) {
      await db.put("publicKeyStore", { ...(publicKey as any), acl: aclAddress } as any);
    }
  } catch {}
  try {
    if (publicParams) {
      await db.put("paramsStore", { ...(publicParams as any), acl: aclAddress } as any);
    }
  } catch {}
}

/**
 * Remove cached public key and params for a specific ACL address.
 * Useful when SDK version changes or deserialization fails.
 */
export async function publicKeyStorageClear(aclAddress: `0x${string}`) {
  const db = await _getDB();
  if (!db) return;
  try {
    await db.delete("publicKeyStore", aclAddress as any);
  } catch {}
  try {
    await db.delete("paramsStore", aclAddress as any);
  } catch {}
}


