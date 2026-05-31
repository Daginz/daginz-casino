import { ethers } from 'hardhat';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * End-to-end on-chain smoke against a running local node:
 *   faucet -> approve -> deposit (assert Deposit event + balances) ->
 *   owner withdraw (assert Withdrawal event + balances).
 * Proves the deployed contracts behave on a real chain, not just unit tests.
 */
async function main(): Promise<void> {
  const dep = JSON.parse(
    readFileSync(join(__dirname, '..', 'deployments.local.json'), 'utf8'),
  ) as { chip: string; vault: string };

  const [owner, player] = await ethers.getSigners();
  const chip = await ethers.getContractAt('ChipToken', dep.chip);
  const vault = await ethers.getContractAt('CasinoVault', dep.vault);

  const fmt = (v: bigint) => ethers.formatEther(v);

  // 1. faucet
  await (await chip.connect(player).faucet()).wait();
  console.log('after faucet, player CHIP:', fmt(await chip.balanceOf(player.address)));

  // 2. approve + deposit 250
  const amount = ethers.parseEther('250');
  await (await chip.connect(player).approve(dep.vault, amount)).wait();
  const depTx = await (await vault.connect(player).deposit(amount)).wait();

  const depEvent = depTx!.logs
    .map((l) => {
      try {
        return vault.interface.parseLog(l);
      } catch {
        return null;
      }
    })
    .find((e) => e?.name === 'Deposit');
  console.log('Deposit event:', depEvent?.args?.player, fmt(depEvent?.args?.amount), 'nonce', depEvent?.args?.nonce);

  console.log('player CHIP after deposit:', fmt(await chip.balanceOf(player.address)));
  console.log('vault CHIP:', fmt(await vault.vaultBalance()));

  // 3. owner withdraw 100 to player
  const wid = ethers.id('wd-smoke-1');
  const wTx = await (await vault.connect(owner).withdraw(player.address, ethers.parseEther('100'), wid)).wait();
  const wEvent = wTx!.logs
    .map((l) => {
      try {
        return vault.interface.parseLog(l);
      } catch {
        return null;
      }
    })
    .find((e) => e?.name === 'Withdrawal');
  console.log('Withdrawal event:', wEvent?.args?.player, fmt(wEvent?.args?.amount));

  console.log('player CHIP final:', fmt(await chip.balanceOf(player.address)));
  console.log('vault CHIP final:', fmt(await vault.vaultBalance()));

  // assertions
  const playerBal = await chip.balanceOf(player.address);
  const vaultBal = await vault.vaultBalance();
  const pass = playerBal === ethers.parseEther('850') && vaultBal === ethers.parseEther('150');
  console.log(pass ? 'ONCHAIN SMOKE: PASS' : 'ONCHAIN SMOKE: FAIL');
  if (!pass) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
