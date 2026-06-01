import { ethers } from 'hardhat';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Verifies the chip->wei withdrawal math the backend listener uses: owner
 * withdraws WHOLE CHIP (here 120) which must equal 120 * 10^18 wei on-chain.
 * Mirrors OnchainListenerService.sendWithdrawal's conversion.
 */
async function main(): Promise<void> {
  const dep = JSON.parse(
    readFileSync(join(__dirname, '..', 'deployments.local.json'), 'utf8'),
  ) as { chip: string; vault: string };

  const [owner, player] = await ethers.getSigners();
  const chip = await ethers.getContractAt('ChipToken', dep.chip);
  const vault = await ethers.getContractAt('CasinoVault', dep.vault);

  const before = await chip.balanceOf(player.address);
  const chipAmount = 120n; // whole CHIP (ledger unit)
  const weiAmount = chipAmount * 10n ** 18n; // same conversion as units.chipToWei
  const wid = ethers.id('wd-conv-check');

  await (await vault.connect(owner).withdraw(player.address, weiAmount, wid)).wait();
  const after = await chip.balanceOf(player.address);

  const delta = after - before;
  const ok = delta === weiAmount;
  console.log(`withdrew ${chipAmount} CHIP -> player delta ${ethers.formatEther(delta)} CHIP`);
  console.log(ok ? 'WITHDRAW CONV: PASS' : 'WITHDRAW CONV: FAIL');
  if (!ok) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
