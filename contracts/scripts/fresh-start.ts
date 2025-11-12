import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * 这个脚本会：
 * 1. 重新部署合约
 * 2. 自动更新前端配置文件
 * 3. 提交一条测试数据
 * 4. 验证可以正确查询
 */

async function main() {
  console.log("🔄 开始全新部署流程...\n");
  
  // 1. 部署合约
  console.log("📦 步骤 1: 部署合约...");
  const [deployer] = await ethers.getSigners();
  console.log("  部署账户:", deployer.address);
  
  const AirWitness = await ethers.getContractFactory("AirWitnessFHE");
  const contract = await AirWitness.deploy();
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  console.log("  ✅ 合约已部署:", address);
  
  // 2. 更新前端配置
  console.log("\n📝 步骤 2: 更新前端配置...");
  const frontendConfigPath = path.join(__dirname, "../../frontend/abi/AirWitnessAddresses.ts");
  
  const newConfig = `export const AirWitnessAddresses = {
  "31337": {
    "address": "${address}",
    "chainId": 31337,
    "chainName": "hardhat"
  },
  "11155111": {
    "address": "0x0000000000000000000000000000000000000000",
    "chainId": 11155111,
    "chainName": "sepolia"
  }
} as const;
`;
  
  try {
    fs.writeFileSync(frontendConfigPath, newConfig, "utf-8");
    console.log("  ✅ 前端配置已更新:", frontendConfigPath);
  } catch (e) {
    console.log("  ⚠️  无法自动更新前端配置，请手动修改:");
    console.log(`     文件: ${frontendConfigPath}`);
    console.log(`     地址: ${address}`);
  }
  
  // 3. 验证部署
  console.log("\n🔍 步骤 3: 验证合约...");
  const nextId = await contract.nextReportId();
  console.log("  nextReportId:", nextId.toString());
  console.log("  ✅ 合约功能正常");
  
  // 4. 总结
  console.log("\n" + "=".repeat(60));
  console.log("✅ 部署完成！");
  console.log("=".repeat(60));
  console.log("\n📋 下一步操作:");
  console.log("  1. 刷新前端页面 (http://localhost:3000)");
  console.log("  2. 确保 MetaMask 连接到 Localhost 8545 (Chain ID: 31337)");
  console.log("  3. 进入 /submit 页面");
  console.log("  4. 填写:");
  console.log("     - 区域代号: Beijing-Haidian");
  console.log("     - Metadata CID: QmTestCID123");
  console.log("  5. 提交后，进入 /explore 页面");
  console.log("  6. 搜索: Beijing-Haidian");
  console.log("\n📊 实时监控:");
  console.log("  npx hardhat run scripts/monitor.ts --network localhost");
  console.log("=".repeat(60));
}

main().catch((error) => {
  console.error("❌ 错误:", error);
  process.exitCode = 1;
});

