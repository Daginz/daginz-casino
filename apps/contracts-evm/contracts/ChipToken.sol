// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title CHIP — testnet casino chip (ERC-20).
/// @notice Open faucet for testnet: anyone can mint a capped amount to play.
///         NOT for production — a real chip would gate minting.
contract ChipToken is ERC20, Ownable {
    /// @notice Max a single faucet call mints (1000 CHIP, 18 decimals).
    uint256 public constant FAUCET_AMOUNT = 1000 ether;

    constructor(address initialOwner) ERC20("Casino Chip", "CHIP") Ownable(initialOwner) {}

    /// @notice Testnet faucet: mint FAUCET_AMOUNT to the caller.
    function faucet() external {
        _mint(msg.sender, FAUCET_AMOUNT);
    }

    /// @notice Owner mint (e.g. seeding accounts in tests/scripts).
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
