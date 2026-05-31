import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('CHIP + CasinoVault', () => {
  async function deploy() {
    const [owner, player] = await ethers.getSigners();
    const Chip = await ethers.getContractFactory('ChipToken');
    const chip = await Chip.deploy(owner.address);
    const Vault = await ethers.getContractFactory('CasinoVault');
    const vault = await Vault.deploy(await chip.getAddress(), owner.address);
    return { owner, player, chip, vault };
  }

  it('faucet mints 1000 CHIP to caller', async () => {
    const { player, chip } = await deploy();
    await chip.connect(player).faucet();
    expect(await chip.balanceOf(player.address)).to.equal(ethers.parseEther('1000'));
  });

  it('deposit emits Deposit and moves CHIP into the vault', async () => {
    const { player, chip, vault } = await deploy();
    await chip.connect(player).faucet();
    const amount = ethers.parseEther('100');
    await chip.connect(player).approve(await vault.getAddress(), amount);

    await expect(vault.connect(player).deposit(amount))
      .to.emit(vault, 'Deposit')
      .withArgs(player.address, amount, 0n);

    expect(await vault.vaultBalance()).to.equal(amount);
    expect(await chip.balanceOf(player.address)).to.equal(ethers.parseEther('900'));
  });

  it('deposit nonce increments', async () => {
    const { player, chip, vault } = await deploy();
    await chip.connect(player).faucet();
    const a = ethers.parseEther('10');
    await chip.connect(player).approve(await vault.getAddress(), ethers.parseEther('30'));
    await vault.connect(player).deposit(a);
    await expect(vault.connect(player).deposit(a))
      .to.emit(vault, 'Deposit')
      .withArgs(player.address, a, 1n);
  });

  it('owner can withdraw to a player; non-owner cannot', async () => {
    const { owner, player, chip, vault } = await deploy();
    // fund the vault via a deposit first
    await chip.connect(player).faucet();
    const amount = ethers.parseEther('100');
    await chip.connect(player).approve(await vault.getAddress(), amount);
    await vault.connect(player).deposit(amount);

    const wid = ethers.id('withdrawal-1');
    await expect(vault.connect(owner).withdraw(player.address, ethers.parseEther('40'), wid))
      .to.emit(vault, 'Withdrawal')
      .withArgs(player.address, ethers.parseEther('40'), wid);
    expect(await chip.balanceOf(player.address)).to.equal(ethers.parseEther('940'));

    await expect(
      vault.connect(player).withdraw(player.address, 1n, wid),
    ).to.be.revertedWithCustomError(vault, 'OwnableUnauthorizedAccount');
  });

  it('deposit of 0 reverts', async () => {
    const { player, vault } = await deploy();
    await expect(vault.connect(player).deposit(0)).to.be.revertedWith('amount=0');
  });
});
