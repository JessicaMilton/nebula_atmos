# AirWitness FHE Contracts

## Overview
AirWitnessFHE stores air quality reports with encrypted fields (pm25, pm10, visibility, smell) using Zama FHEVM.

## Requirements
- Node.js LTS
- Hardhat
- "@fhevm/hardhat-plugin": "^0.1.0"

## Setup
```bash
cd action/contracts
npm install
```

## Local development
1) Start a Hardhat node (with FHEVM plugin enabled by default in hardhat network)
```bash
npx hardhat node
```
2) Deploy
```bash
npm run deploy:localhost
```
Artifacts will be available under `artifacts/`. Use the frontend generator to emit ABI and addresses.

## Sepolia (optional)
Set env:
```
SEPOLIA_RPC_URL=...
DEPLOYER_PRIVATE_KEY=0x...
```
Deploy:
```bash
npm run deploy:sepolia
```


