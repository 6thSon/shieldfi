import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import fs from "fs";
import path from "path";

const deployShieldFi: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log(`\n🛡️  Deploying ShieldFi to ${hre.network.name}...`);
  console.log(`   Deployer: ${deployer}`);

  const shieldFi = await deploy("ShieldFi", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
    waitConfirmations: hre.network.name === "hardhat" ? 0 : 2,
  });

  const txHash = shieldFi.transactionHash ?? "(already deployed)";
  console.log(`\n✅ ShieldFi deployed!`);
  console.log(`   Address:  ${shieldFi.address}`);
  console.log(`   Tx Hash:  ${txHash}`);
  console.log(`   Network:  ${hre.network.name} (chainId: ${hre.network.config.chainId})`);

  // ── 1. Update SHIELDFI_ADDRESS in artifacts/shieldfi/src/lib/contract.ts ──────
  const contractTsPath = path.resolve(
    __dirname,
    "../../../artifacts/shieldfi/src/lib/contract.ts"
  );

  if (fs.existsSync(contractTsPath)) {
    let src = fs.readFileSync(contractTsPath, "utf8");
    src = src.replace(
      /export const SHIELDFI_ADDRESS = "0x[0-9a-fA-F]*"/,
      `export const SHIELDFI_ADDRESS = "${shieldFi.address}"`
    );
    src = src.replace(
      /export const CHAIN_ID = \d+;/,
      `export const CHAIN_ID = ${hre.network.config.chainId ?? 11155111};`
    );
    fs.writeFileSync(contractTsPath, src);
    console.log(`   ✔ Updated SHIELDFI_ADDRESS in contract.ts`);
  } else {
    console.warn(`   ⚠ contract.ts not found at ${contractTsPath}`);
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
    console.log(`   ✔ Copied ABI → ${abiDestPath}`);
  } else {
    console.warn(`   ⚠ Compiled artifact not found at ${compiledAbiPath}`);
  }

  // ── 3. Etherscan verification hint ───────────────────────────────────────────
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log(`\n🔍 Etherscan verification command:`);
    console.log(`   npx hardhat verify --network ${hre.network.name} ${shieldFi.address}`);
    console.log(`\n🔗 View on Etherscan:`);
    console.log(`   https://sepolia.etherscan.io/address/${shieldFi.address}`);
    console.log(`   https://sepolia.etherscan.io/tx/${txHash}`);
  }
};

export default deployShieldFi;
deployShieldFi.tags = ["ShieldFi"];
