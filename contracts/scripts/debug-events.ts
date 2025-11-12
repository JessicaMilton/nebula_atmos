import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
  
  const AirWitness = await ethers.getContractFactory("AirWitnessFHE");
  const contract = AirWitness.attach(contractAddress);
  
  console.log("🔍 详细调试事件和存储...\n");
  
  // 查询所有事件
  const filter = contract.filters.ReportSubmitted();
  const events = await contract.queryFilter(filter, 0, "latest");
  
  console.log(`找到 ${events.length} 个 ReportSubmitted 事件:\n`);
  
  for (const event of events) {
    const tx = await event.getTransaction();
    const receipt = await event.getTransactionReceipt();
    
    console.log(`Event #${event.index}:`);
    console.log(`  Block: ${event.blockNumber}`);
    console.log(`  TxHash: ${tx.hash}`);
    console.log(`  Args:`, event.args);
    console.log(`  Raw topics:`, event.topics);
    
    // 尝试读取这个 reportId
    if (event.args) {
      const reportId = event.args[0] || event.args.id;
      console.log(`\n  📄 尝试读取 Report #${reportId}:`);
      try {
        const report = await contract.getReport(reportId);
        console.log(`    ID: ${report.id}`);
        console.log(`    Reporter: ${report.reporter}`);
        console.log(`    RegionCode: "${report.regionCode}"`);
        console.log(`    RegionCode (hex): ${ethers.hexlify(ethers.toUtf8Bytes(report.regionCode))}`);
        console.log(`    RegionCode (length): ${report.regionCode.length}`);
        console.log(`    MetadataCID: "${report.metadataCID}"`);
        console.log(`    Timestamp: ${report.timestamp}`);
        
        // 测试查询这个区域
        console.log(`\n  🔍 测试查询 "${report.regionCode}":`);
        const ids = await contract.getReportsByRegion(report.regionCode);
        console.log(`    返回: [${ids.map(i => i.toString()).join(", ")}]`);
        
        // 也测试不同大小写
        console.log(`\n  🔍 测试不同格式:`);
        const variations = [
          report.regionCode,
          report.regionCode.trim(),
          "Beijing-Haidian",
          "beijing-haidian",
          "BEIJING-HAIDIAN"
        ];
        
        for (const v of variations) {
          try {
            const result = await contract.getReportsByRegion(v);
            console.log(`    "${v}" => [${result.map(i => i.toString()).join(", ")}]`);
          } catch (e: any) {
            console.log(`    "${v}" => 错误: ${e.message}`);
          }
        }
        
      } catch (e: any) {
        console.log(`    ❌ 读取失败: ${e.message}`);
      }
    }
    console.log("\n" + "=".repeat(60) + "\n");
  }
}

main().catch(console.error);

