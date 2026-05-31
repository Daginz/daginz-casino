import { ethers, network } from 'hardhat';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Deploy CHIP + CasinoVault and write addresses to deployments.local.json so
 * the backend listener can pick them up. The deployer (signer 0) is the owner.
 */
async function main(): Promise<void> {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying on ${network.name} as ${deployer.address}`);

  const Chip = await ethers.getContractFactory('ChipToken');
  const chip = await Chip.deploy(deployer.address);
  await chip.waitForDeployment();
  const chipAddress = await chip.getAddress();

  const Vault = await ethers.getContractFactory('CasinoVault');
  const vault = await Vault.deploy(chipAddress, deployer.address);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();

  const out = {
    network: network.name,
    chip: chipAddress,
    vault: vaultAddress,
    deployer: deployer.address,
  };
  console.log(out);
  writeFileSync(join(__dirname, '..', 'deployments.local.json'), JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
