import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6";
  
  const AirWitness = await ethers.getContractFactory("AirWitnessFHE");
  const contract = AirWitness.attach(contractAddress);
  
  console.log("📊 AirWitness 合约监控面板");
  console.log("=" .repeat(60));
  console.log(`合约地址: ${contractAddress}`);
  console.log(`网络: Localhost (Chain ID: 31337)`);
  console.log("=" .repeat(60));
  
  // 基础统计
  const nextId = await contract.nextReportId();
  console.log(`\n📈 总报告数: ${Number(nextId) - 1}`);
  
  // 查询所有事件
  const filter = contract.filters.ReportSubmitted();
  const events = await contract.queryFilter(filter, 0, "latest");
  
  console.log(`📡 链上事件数: ${events.length}`);
  
  if (events.length === 0) {
    console.log("\n⚠️  当前没有任何报告！");
    console.log("\n💡 操作步骤:");
    console.log("   1. 打开前端: http://localhost:3000");
    console.log("   2. 连接 MetaMask (切换到 Localhost 8545)");
    console.log("   3. 去 /submit 页面提交报告");
    console.log("   4. 区域代号填写: Beijing-Haidian");
    console.log("   5. 提交成功后回来刷新此监控");
    return;
  }
  
  // 统计各区域
  const regionMap = new Map<string, number[]>();
  
  for (const event of events) {
    const reportId = Number(event.args?.id || event.args?.[0]);
    try {
      const report = await contract.getReport(reportId);
      const region = report.regionCode;
      
      if (!regionMap.has(region)) {
        regionMap.set(region, []);
      }
      regionMap.get(region)!.push(reportId);
    } catch (e) {
      console.log(`⚠️  无法读取 Report #${reportId}`);
    }
  }
  
  console.log(`\n🗺️  区域统计 (共 ${regionMap.size} 个区域):\n`);
  
  for (const [region, ids] of regionMap.entries()) {
    console.log(`  📍 "${region}": ${ids.length} 份报告`);
    console.log(`     IDs: [${ids.join(", ")}]`);
    
    // 读取最新一份报告详情
    const latestId = Math.max(...ids);
    try {
      const report = await contract.getReport(latestId);
      const date = new Date(Number(report.timestamp) * 1000);
      console.log(`     最新: #${latestId} by ${report.reporter.slice(0, 6)}...${report.reporter.slice(-4)}`);
      console.log(`     时间: ${date.toLocaleString("zh-CN")}`);
      console.log(`     CID: ${report.metadataCID}`);
    } catch (e) {
      // ignore
    }
    console.log();
  }
  
  console.log("=" .repeat(60));
  console.log("🔍 在前端搜索区域时，请使用上面列出的完整区域名称");
  console.log("=" .repeat(60));
  
  // 测试几个常见区域
  console.log("\n🧪 测试查询:");
  const testRegions = ["Beijing-Haidian", "ss", "test"];
  for (const region of testRegions) {
    try {
      const ids = await contract.getReportsByRegion(region);
      if (ids.length > 0) {
        console.log(`  ✅ "${region}": 找到 ${ids.length} 份`);
      } else {
        console.log(`  ❌ "${region}": 无数据`);
      }
    } catch (e) {
      console.log(`  ❌ "${region}": 查询失败`);
    }
  }
}

main().catch(console.error);

