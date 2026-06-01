import { ethers } from 'hardhat';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Acts as a player: faucet -> approve -> deposit `amount` CHIP into the vault.
 * Prints the player address (lowercased) so the harness can check the ledger
 * credited that same id. Usage: hardhat run ... (amount via DEPOSIT_AMOUNT env)
 */
async function main(): Promise<void> {
  const dep = JSON.parse(
    readFileSync(join(__dirname, '..', 'deployments.local.json'), 'utf8'),
  ) as { chip: string; vault: string };

  const signers = await ethers.getSigners();
  const player = signers[1]!; // account #1 = the player
  const chip = await ethers.getContractAt('ChipToken', dep.chip);
  const vault = await ethers.getContractAt('CasinoVault', dep.vault);

  const amount = ethers.parseEther(process.env.DEPOSIT_AMOUNT ?? '300');

  await (await chip.connect(player).faucet()).wait();
  await (await chip.connect(player).approve(dep.vault, amount)).wait();
  const tx = await (await vault.connect(player).deposit(amount)).wait();

  console.log('PLAYER_ADDR=' + player.address.toLowerCase());
  console.log('DEPOSIT_AMOUNT_WEI=' + amount.toString());
  console.log('DEPOSIT_TX=' + tx!.hash);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
