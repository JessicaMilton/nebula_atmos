import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
  const [signer] = await ethers.getSigners();
  
  console.log("🔍 简单测试合约读写...");
  console.log("合约地址:", contractAddress);
  console.log("测试账户:", signer.address);
  
  const AirWitness = await ethers.getContractFactory("AirWitnessFHE");
  const contract = AirWitness.attach(contractAddress);
  
  // 1. 检查初始状态
  console.log("\n📊 检查初始状态:");
  const nextId = await contract.nextReportId();
  console.log("  nextReportId:", nextId.toString());
  
  // 2. 测试查询空区域
  console.log("\n🔍 测试查询 'Beijing-Haidian':");
  const ids = await contract.getReportsByRegion("Beijing-Haidian");
  console.log("  返回的 IDs:", ids.map(i => i.toString()));
  console.log("  数量:", ids.length);
  
  // 3. 查询所有事件
  console.log("\n📡 查询所有提交事件:");
  const filter = contract.filters.ReportSubmitted();
  const events = await contract.queryFilter(filter, 0, "latest");
  console.log("  找到", events.length, "个事件");
  
  for (const event of events) {
    const args = event.args;
    console.log(`  - Report #${args?.id}: ${args?.regionCode} by ${args?.reporter}`);
  }
  
  console.log("\n✅ 合约功能正常！");
  console.log("\n💡 下一步:");
  console.log("   1. 确保 MetaMask 连接到 Localhost 8545 (Chain ID: 31337)");
  console.log("   2. 在前端刷新页面，连接钱包");
  console.log("   3. 去 /submit 页面提交一条报告（区域填 'Beijing-Haidian'）");
  console.log("   4. 提交成功后，去 /explore 页面搜索 'Beijing-Haidian'");
}

main().catch((error) => {
  console.error("❌ 错误:", error);
  process.exitCode = 1;
});

