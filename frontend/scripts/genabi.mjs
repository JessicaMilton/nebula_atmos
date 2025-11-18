#!/usr/bin/env node
/**
 * Generate ABI and addresses for NebulaAtmosFHE from Hardhat deployments/artifacts.
 * Usage:
 *   node scripts/genabi.mjs
 * Looks for deployments in ../../contracts/artifacts and uses the latest address from console output is not reliable.
 * You can also override by setting:
 *   DEPLOYMENTS_JSON=/absolute/path/to/NebulaAtmosFHE.json
 */
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CONTRACTS_ROOT = path.resolve(ROOT, "../contracts");
const FRONTEND_ABI_DIR = path.resolve(ROOT, "abi");

async function main() {
  const explicit = process.env.DEPLOYMENTS_JSON;
  let abi;
  if (explicit) {
    const j = JSON.parse(await fs.readFile(explicit, "utf-8"));
    abi = j.abi;
  } else {
    // fallback to compile artifact
    const artifactPath = path.resolve(CONTRACTS_ROOT, "artifacts/contracts/NebulaAtmosFHE.sol/NebulaAtmosFHE.json");
    const j = JSON.parse(await fs.readFile(artifactPath, "utf-8"));
    abi = j.abi;
  }
  const abiTs = `export const NebulaAtmosABI = ${JSON.stringify({ abi }, null, 2)} as const;\n`;
  await fs.mkdir(FRONTEND_ABI_DIR, { recursive: true });
  await fs.writeFile(path.join(FRONTEND_ABI_DIR, "NebulaAtmosABI.ts"), abiTs, "utf-8");
  console.log("Wrote abi/NebulaAtmosABI.ts");

  // addresses
  const hardhatAddr = process.env.LOCAL_ADDRESS ?? "0x0000000000000000000000000000000000000000";
  const sepoliaAddr = process.env.SEPOLIA_ADDRESS ?? "0x0000000000000000000000000000000000000000";
  const addrObj = {
    "31337": { address: hardhatAddr, chainId: 31337, chainName: "hardhat" },
    "11155111": { address: sepoliaAddr, chainId: 11155111, chainName: "sepolia" }
  };
  const addrTs = `export const NebulaAtmosAddresses = ${JSON.stringify(addrObj, null, 2)} as const;\n`;
  await fs.writeFile(path.join(FRONTEND_ABI_DIR, "NebulaAtmosAddresses.ts"), addrTs, "utf-8");
  console.log("Wrote abi/NebulaAtmosAddresses.ts");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


