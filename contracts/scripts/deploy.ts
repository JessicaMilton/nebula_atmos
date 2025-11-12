import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const Factory = await ethers.getContractFactory("NebulaAtmosFHE");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("NebulaAtmosFHE deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


