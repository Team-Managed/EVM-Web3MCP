// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {AgentSwap, IPoolManager, IV4Quoter, IPriceFeed} from "../src/AgentSwap.sol";

// Runs against a Sepolia fork (eth_rpc_url in foundry.toml): the real PoolManager, Quoter and ETH/USDC pool.
// The price feed is a stub, so each test sets a Chainlink price relative to the pool's live quote.

contract StubFeed is IPriceFeed {
    int256 public answer;
    uint256 public updatedAt;

    function set(int256 answer_, uint256 updatedAt_) external {
        answer = answer_;
        updatedAt = updatedAt_;
    }

    function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80) {
        return (0, answer, 0, updatedAt, 0);
    }
}

interface IERC20Full {
    function balanceOf(address) external view returns (uint256);
    function approve(address, uint256) external returns (bool);
}

contract AgentSwapTest {
    IPoolManager constant POOL_MANAGER = IPoolManager(0xE03A1074c86CFeDd5C142C4F04F1a1536e203543);
    IV4Quoter constant QUOTER = IV4Quoter(0x61B3f2011A92d183C7dbaDBdA940a7555Ccf9227);
    address constant USDC = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238;
    address constant RIYA = address(0xA11CE);

    StubFeed feed;
    AgentSwap swapper;

    receive() external payable {}

    function setUp() public {
        feed = new StubFeed();
        swapper = new AgentSwap(address(this), POOL_MANAGER, QUOTER, feed, USDC);
    }

    // Chainlink price (8 decimals) at which `ethIn` for `usdcOut` is exactly fair, scaled by `percent`.
    function setPrice(uint256 ethIn, uint256 usdcOut, uint256 percent) internal {
        feed.set(int256(usdcOut * 1e20 / ethIn * percent / 100), block.timestamp);
    }

    function test_swapsEthForUsdcAtTheQuotedAmount() public {
        uint256 quoted = swapper.quoteEthToUsdc(0.001 ether);
        setPrice(0.001 ether, quoted, 100);

        uint256 out = swapper.swapEthToUsdc{value: 0.001 ether}(RIYA);

        require(out == quoted && IERC20Full(USDC).balanceOf(RIYA) == quoted, "recipient got the quote");
        require(address(swapper).balance == 0 && IERC20Full(USDC).balanceOf(address(swapper)) == 0, "holds nothing");
    }

    function test_swapsUsdcForEth() public {
        setPrice(0.01 ether, swapper.quoteEthToUsdc(0.01 ether), 100);
        uint256 usdcIn = swapper.swapEthToUsdc{value: 0.01 ether}(address(this)) / 2;
        uint256 quoted = swapper.quoteUsdcToEth(uint128(usdcIn));
        setPrice(quoted, usdcIn, 100);
        IERC20Full(USDC).approve(address(swapper), usdcIn);
        uint256 before = RIYA.balance;

        uint256 out = swapper.swapUsdcToEth(usdcIn, RIYA);

        require(out == quoted && RIYA.balance - before == quoted, "recipient got the quote");
    }

    function test_refusesAPriceMoreThan3PercentBelowChainlink() public {
        uint256 quoted = swapper.quoteEthToUsdc(0.001 ether);
        setPrice(0.001 ether, quoted, 104);

        try swapper.swapEthToUsdc{value: 0.001 ether}(RIYA) {
            revert("should refuse");
        } catch Error(string memory reason) {
            require(eq(reason, "AgentSwap: pool price is more than 3% worse than Chainlink's"), reason);
        }
        setPrice(0.001 ether, quoted, 102);
        swapper.swapEthToUsdc{value: 0.001 ether}(RIYA);
    }

    function test_refusesAStalePrice() public {
        feed.set(2000e8, block.timestamp - 4 hours);
        try swapper.swapEthToUsdc{value: 0.001 ether}(RIYA) {
            revert("should refuse");
        } catch Error(string memory reason) {
            require(eq(reason, "AgentSwap: Chainlink price is stale"), reason);
        }
    }

    function test_onlyThePoolManagerCanCallBack() public {
        try swapper.unlockCallback(abi.encode(address(this), true, 1, RIYA)) {
            revert("should refuse");
        } catch Error(string memory reason) {
            require(eq(reason, "AgentSwap: only the PoolManager"), reason);
        }
    }

    function eq(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(bytes(a)) == keccak256(bytes(b));
    }
}
