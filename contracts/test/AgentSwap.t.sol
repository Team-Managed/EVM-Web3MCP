// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {AgentSwap, IPoolManager, IV4Quoter, IPriceFeed} from "../src/AgentSwap.sol";

// Runs against a Sepolia fork (see the README): the real PoolManager, Quoter and ETH/USDC pool.
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
    string constant BELOW_CHAINLINK = "AgentSwap: pool price is more than 3% worse than Chainlink's";

    StubFeed feed;
    AgentSwap swapper;

    receive() external payable {}

    function setUp() public {
        feed = new StubFeed();
        swapper = new AgentSwap(address(this), POOL_MANAGER, QUOTER, feed, USDC);
    }

    // Chainlink price (8 decimals) at which `ethAmount` for `usdcAmount` is exactly fair, scaled by `percent`.
    function setPrice(uint256 ethAmount, uint256 usdcAmount, uint256 percent) internal {
        feed.set(int256(usdcAmount * 1e20 / ethAmount * percent / 100), block.timestamp);
    }

    // Some USDC for this contract, bought at a fair price, plus the quote for selling `usdcIn` of it.
    function buyUsdc() internal returns (uint256 usdcIn, uint256 quoted) {
        setPrice(0.01 ether, swapper.quoteEthToUsdc(0.01 ether), 100);
        usdcIn = swapper.swapEthToUsdc{value: 0.01 ether}(0, address(this)) / 2;
        quoted = swapper.quoteUsdcToEth(uint128(usdcIn));
        IERC20Full(USDC).approve(address(swapper), usdcIn);
    }

    function test_swapsEthForUsdcAtTheQuotedAmount() public {
        uint256 quoted = swapper.quoteEthToUsdc(0.001 ether);
        setPrice(0.001 ether, quoted, 100);

        uint256 out = swapper.swapEthToUsdc{value: 0.001 ether}(quoted, RIYA);

        require(out == quoted && IERC20Full(USDC).balanceOf(RIYA) == quoted, "recipient got the quote");
        require(address(swapper).balance == 0 && IERC20Full(USDC).balanceOf(address(swapper)) == 0, "holds nothing");
    }

    function test_swapsUsdcForEth() public {
        (uint256 usdcIn, uint256 quoted) = buyUsdc();
        setPrice(quoted, usdcIn, 100);
        uint256 before = RIYA.balance;

        uint256 out = swapper.swapUsdcToEth(usdcIn, quoted, RIYA);

        require(out == quoted && RIYA.balance - before == quoted, "recipient got the quote");
    }

    function test_refusesLessThanTheCallersMinimum() public {
        uint256 quoted = swapper.quoteEthToUsdc(0.001 ether);
        setPrice(0.001 ether, quoted, 100);

        try swapper.swapEthToUsdc{value: 0.001 ether}(quoted + 1, RIYA) {
            revert("should refuse");
        } catch Error(string memory reason) {
            require(eq(reason, "AgentSwap: the price moved below your minimum"), reason);
        }
    }

    function test_refusesEthToUsdcMoreThan3PercentBelowChainlink() public {
        uint256 quoted = swapper.quoteEthToUsdc(0.001 ether);
        setPrice(0.001 ether, quoted, 104);

        try swapper.swapEthToUsdc{value: 0.001 ether}(0, RIYA) {
            revert("should refuse");
        } catch Error(string memory reason) {
            require(eq(reason, BELOW_CHAINLINK), reason);
        }
        setPrice(0.001 ether, quoted, 102);
        swapper.swapEthToUsdc{value: 0.001 ether}(0, RIYA);
    }

    function test_refusesUsdcToEthMoreThan3PercentBelowChainlink() public {
        (uint256 usdcIn, uint256 quoted) = buyUsdc();
        // A lower ETH price means each USDC should buy more ETH, so the pool's payout looks worse.
        setPrice(quoted, usdcIn * 100 / 104, 100);

        try swapper.swapUsdcToEth(usdcIn, 0, RIYA) {
            revert("should refuse");
        } catch Error(string memory reason) {
            require(eq(reason, BELOW_CHAINLINK), reason);
        }
        setPrice(quoted, usdcIn * 100 / 102, 100);
        swapper.swapUsdcToEth(usdcIn, 0, RIYA);
    }

    function test_refusesAPriceOlderThan75Minutes() public {
        feed.set(2000e8, block.timestamp - 80 minutes);
        try swapper.swapEthToUsdc{value: 0.001 ether}(0, RIYA) {
            revert("should refuse");
        } catch Error(string memory reason) {
            require(eq(reason, "AgentSwap: Chainlink price is stale"), reason);
        }
    }

    function test_onlyThePoolManagerCanCallBack() public {
        try swapper.unlockCallback(abi.encode(address(this), true, 1, 0, RIYA)) {
            revert("should refuse");
        } catch Error(string memory reason) {
            require(eq(reason, "AgentSwap: only the PoolManager"), reason);
        }
    }

    function eq(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(bytes(a)) == keccak256(bytes(b));
    }
}
