import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
  
  console.log("🔍 诊断合约状态...");
  console.log("合约地址:", contractAddress);
  
  try {
    // 检查合约代码
    const code = await ethers.provider.getCode(contractAddress);
    if (code === "0x" || code === "0x0") {
      console.log("❌ 错误：合约未部署在此地址！");
      console.log("请先运行: npx hardhat run scripts/deploy.ts --network localhost");
      return;
    }
    console.log("✅ 合约已部署");
    
    // 连接合约
    const AirWitness = await ethers.getContractFactory("AirWitnessFHE");
    const contract = AirWitness.attach(contractAddress);
    
    // 检查 nextReportId
    const nextId = await contract.nextReportId();
    console.log("📊 nextReportId:", nextId.toString());
    console.log(`   (已提交 ${Number(nextId) - 1} 条报告)`);
    
    // 检查所有 ReportSubmitted 事件
    console.log("\n📡 查询所有 ReportSubmitted 事件...");
    const filter = contract.filters.ReportSubmitted();
    const events = await contract.queryFilter(filter, 0, "latest");
    
    console.log(`找到 ${events.length} 个提交事件:`);
    for (const event of events) {
      const args = event.args;
      console.log(`  - Report #${args?.id}`);
      console.log(`    Reporter: ${args?.reporter}`);
      console.log(`    Region: ${args?.regionCode}`);
      console.log(`    Block: ${event.blockNumber}`);
    }
    
    // 测试查询 Beijing-Haidian
    console.log("\n🔍 测试查询 'Beijing-Haidian'...");
    try {
      const ids = await contract.getReportsByRegion("Beijing-Haidian");
      console.log(`✅ getReportsByRegion 返回: [${ids.map(i => i.toString()).join(", ")}]`);
      
      if (ids.length > 0) {
        console.log("\n📄 读取第一条报告详情...");
        const report = await contract.getReport(ids[0]);
        console.log("  ID:", report.id.toString());
        console.log("  Reporter:", report.reporter);
        console.log("  RegionCode:", report.regionCode);
        console.log("  MetadataCID:", report.metadataCID);
        console.log("  Timestamp:", new Date(Number(report.timestamp) * 1000).toLocaleString());
      }
    } catch (e: any) {
      console.log("❌ 查询失败:", e.message);
    }
    
  } catch (error: any) {
    console.error("❌ 错误:", error.message);
  }
}

main().catch(console.error);

