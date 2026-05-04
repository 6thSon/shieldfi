import { ethers, network } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(`\n🛡️  Deploying ShieldFi to ${network.name}...`);
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Balance:  ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  const ShieldFi = await ethers.getContractFactory("ShieldFi");
  const shieldFi = await ShieldFi.deploy();
  await shieldFi.waitForDeployment();

  const address = await shieldFi.getAddress();
  const deployTx = shieldFi.deploymentTransaction();
  const txHash = deployTx?.hash ?? "unknown";

  console.log(`✅ ShieldFi deployed!`);
  console.log(`   Address:  ${address}`);
  console.log(`   Tx Hash:  ${txHash}`);
  console.log(`   Network:  ${network.name} (chainId: ${network.config.chainId})`);

  // ── 1. Update SHIELDFI_ADDRESS in artifacts/shieldfi/src/lib/contract.ts ──────
  const contractTsPath = path.resolve(
    __dirname,
    "../../../artifacts/shieldfi/src/lib/contract.ts"
  );

  if (fs.existsSync(contractTsPath)) {
    let src = fs.readFileSync(contractTsPath, "utf8");
    src = src.replace(
      /export const SHIELDFI_ADDRESS = "0x[0-9a-fA-F]*"/,
      `export const SHIELDFI_ADDRESS = "${address}"`
    );
    src = src.replace(
      /export const CHAIN_ID = \d+;/,
      `export const CHAIN_ID = ${network.config.chainId ?? 11155111};`
    );
    fs.writeFileSync(contractTsPath, src);
    console.log(`\n   ✔ Updated SHIELDFI_ADDRESS in src/lib/contract.ts`);
  } else {
    console.warn(`   ⚠ contract.ts not found at ${contractTsPath} — update SHIELDFI_ADDRESS manually`);
  }

  // ── 2. Copy compiled ABI to artifacts/shieldfi/src/abi/ShieldFi.json ──────────
  const compiledAbiPath = path.resolve(
    __dirname,
    "../artifacts/contracts/ShieldFi.sol/ShieldFi.json"
  );
  const abiDestDir = path.resolve(
    __dirname,
    "../../../artifacts/shieldfi/src/abi"
  );
  const abiDestPath = path.join(abiDestDir, "ShieldFi.json");

  if (fs.existsSync(compiledAbiPath)) {
    const compiled = JSON.parse(fs.readFileSync(compiledAbiPath, "utf8"));
    if (!fs.existsSync(abiDestDir)) fs.mkdirSync(abiDestDir, { recursive: true });
    fs.writeFileSync(abiDestPath, JSON.stringify(compiled.abi, null, 2));
    console.log(`   ✔ Copied ABI → src/abi/ShieldFi.json`);
  } else {
    console.warn(`   ⚠ Compiled artifact not found — ABI not copied`);
  }

  // ── 3. Summary ────────────────────────────────────────────────────────────────
  console.log(`\n🔗 View on Etherscan:`);
  console.log(`   https://sepolia.etherscan.io/address/${address}`);
  console.log(`   https://sepolia.etherscan.io/tx/${txHash}`);
  console.log(`\n🔍 Verify command (after deployment):`);
  console.log(`   cd packages/hardhat && ./node_modules/.bin/hardhat verify --network sepolia ${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ Deployment failed:", err.message ?? err);
    process.exit(1);
  });
