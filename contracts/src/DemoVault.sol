// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// Minimal ERC-20 vault for the Web3MCP demo.
/// `owner()` lets the deployer set this contract's ENS primary name, which hosts check for "owner-verified".
contract DemoVault {
    IERC20 public immutable token;
    address public immutable owner;
    mapping(address => uint256) public balanceOf;

    event Deposited(address indexed account, uint256 amount);
    event Withdrawn(address indexed account, uint256 amount);

    constructor(IERC20 token_) {
        token = token_;
        owner = msg.sender;
    }

    function deposit(uint256 amount) external {
        balanceOf[msg.sender] += amount;
        require(token.transferFrom(msg.sender, address(this), amount), "transfer failed");
        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        balanceOf[msg.sender] -= amount; // reverts if more than deposited
        require(token.transfer(msg.sender, amount), "transfer failed");
        emit Withdrawn(msg.sender, amount);
    }
}
