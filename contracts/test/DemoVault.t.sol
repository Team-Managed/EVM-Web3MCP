// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {DemoVault, IERC20} from "../src/DemoVault.sol";

contract TestToken {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract DemoVaultTest {
    TestToken token;
    DemoVault vault;

    function setUp() public {
        token = new TestToken();
        vault = new DemoVault(IERC20(address(token)));
        token.mint(address(this), 100);
        token.approve(address(vault), 100);
    }

    function test_depositAndWithdraw() public {
        vault.deposit(40);
        require(vault.balanceOf(address(this)) == 40, "deposit not credited");
        require(token.balanceOf(address(vault)) == 40, "vault not funded");

        vault.withdraw(15);
        require(vault.balanceOf(address(this)) == 25, "withdraw not debited");
        require(token.balanceOf(address(this)) == 75, "tokens not returned");
    }

    function test_cannotWithdrawMoreThanDeposited() public {
        vault.deposit(10);
        try vault.withdraw(11) {
            revert("withdrew more than deposited");
        } catch {}
    }

    function test_ownerIsDeployer() public view {
        require(vault.owner() == address(this), "owner not set");
    }
}
