// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title CasinoVault — escrow for CHIP deposits/withdrawals (testnet).
/// @notice Players deposit CHIP into the vault; an off-chain listener credits
///         the player's ledger balance on the Deposit event. Withdrawals are
///         authorised off-chain (the backend, as owner, releases CHIP back).
///
/// Trust model (testnet, deliberately simple): the backend is the owner and is
/// the source of truth for off-chain balances. A production design would use
/// signed withdrawal vouchers / a multisig rather than a single owner.
contract CasinoVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable chip;

    /// @param player who deposited
    /// @param amount CHIP amount (wei)
    /// @param nonce per-deposit index so the listener can dedupe/track
    event Deposit(address indexed player, uint256 amount, uint256 nonce);

    /// @param player who received the withdrawal
    /// @param amount CHIP amount (wei)
    /// @param withdrawalId backend-supplied id for off-chain reconciliation
    event Withdrawal(address indexed player, uint256 amount, bytes32 indexed withdrawalId);

    uint256 public depositNonce;

    constructor(IERC20 chipToken, address initialOwner) Ownable(initialOwner) {
        chip = chipToken;
    }

    /// @notice Deposit CHIP into the vault. Requires prior approve(vault, amount).
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "amount=0");
        chip.safeTransferFrom(msg.sender, address(this), amount);
        emit Deposit(msg.sender, amount, depositNonce);
        depositNonce += 1;
    }

    /// @notice Owner (backend) releases CHIP to a player on an approved withdrawal.
    /// @dev withdrawalId lets the backend mark the off-chain request as settled
    ///      and prevents double-processing in its own records.
    function withdraw(address player, uint256 amount, bytes32 withdrawalId)
        external
        onlyOwner
        nonReentrant
    {
        require(amount > 0, "amount=0");
        chip.safeTransfer(player, amount);
        emit Withdrawal(player, amount, withdrawalId);
    }

    /// @notice Vault CHIP balance (informational).
    function vaultBalance() external view returns (uint256) {
        return chip.balanceOf(address(this));
    }
}
