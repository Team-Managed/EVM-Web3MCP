// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

// The parts of Uniswap v4 and Chainlink this contract uses. Currency, IHooks and BalanceDelta are
// address, address and int256 in the ABI.
struct PoolKey {
    address currency0;
    address currency1;
    uint24 fee;
    int24 tickSpacing;
    address hooks;
}

struct SwapParams {
    bool zeroForOne;
    int256 amountSpecified;
    uint160 sqrtPriceLimitX96;
}

struct QuoteExactSingleParams {
    PoolKey poolKey;
    bool zeroForOne;
    uint128 exactAmount;
    bytes hookData;
}

interface IPoolManager {
    function unlock(bytes calldata data) external returns (bytes memory);
    function swap(PoolKey memory key, SwapParams memory params, bytes calldata hookData) external returns (int256);
    function sync(address currency) external;
    function settle() external payable returns (uint256);
    function take(address currency, address to, uint256 amount) external;
}

interface IV4Quoter {
    function quoteExactInputSingle(QuoteExactSingleParams memory params) external returns (uint256 amountOut, uint256 gasEstimate);
}

interface IPriceFeed {
    function latestRoundData() external view returns (uint80, int256 answer, uint256, uint256 updatedAt, uint80);
}

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// Swaps ETH and USDC on a Uniswap v4 pool for whoever calls it, and refuses any swap that pays
/// more than 3% less than Chainlink's ETH/USD price. It holds no funds: each swap pays the pool
/// and sends the output to the recipient in the same transaction.
contract AgentSwap {
    uint256 public constant MAX_SHORTFALL_BPS = 300;
    uint256 public constant MAX_PRICE_AGE = 3 hours;
    uint24 public constant FEE = 3000;
    int24 public constant TICK_SPACING = 60;
    uint160 private constant MIN_SQRT_PRICE = 4295128739;
    uint160 private constant MAX_SQRT_PRICE = 1461446703485210103287273052203988822378723970342;

    /// ERC-173 owner. ENS lets the owner set this contract's primary name; it has no other power.
    address public immutable owner;
    IPoolManager public immutable poolManager;
    IV4Quoter public immutable quoter;
    IPriceFeed public immutable ethUsd;
    address public immutable usdc;

    constructor(address owner_, IPoolManager poolManager_, IV4Quoter quoter_, IPriceFeed ethUsd_, address usdc_) {
        owner = owner_;
        poolManager = poolManager_;
        quoter = quoter_;
        ethUsd = ethUsd_;
        usdc = usdc_;
    }

    /// ETH price in US dollars with 8 decimals, from Chainlink.
    function ethPrice() public view returns (uint256) {
        (, int256 answer,, uint256 updatedAt,) = ethUsd.latestRoundData();
        require(answer > 0 && block.timestamp - updatedAt <= MAX_PRICE_AGE, "AgentSwap: Chainlink price is stale");
        return uint256(answer);
    }

    /// Uniswap's exact quote, fees and price impact included. Not view: the Quoter runs the swap and
    /// undoes it, so call this with eth_call.
    function quoteEthToUsdc(uint128 ethIn) external returns (uint256 usdcOut) {
        (usdcOut,) = quoter.quoteExactInputSingle(QuoteExactSingleParams(poolKey(), true, ethIn, ""));
    }

    function quoteUsdcToEth(uint128 usdcIn) external returns (uint256 ethOut) {
        (ethOut,) = quoter.quoteExactInputSingle(QuoteExactSingleParams(poolKey(), false, usdcIn, ""));
    }

    /// Swap the ETH sent for USDC, paid to `recipient`.
    function swapEthToUsdc(address recipient) external payable returns (uint256 usdcOut) {
        return swap(true, msg.value, recipient);
    }

    /// Swap `usdcIn` of the caller's USDC (approve this contract first) for ETH, paid to `recipient`.
    function swapUsdcToEth(uint256 usdcIn, address recipient) external returns (uint256 ethOut) {
        return swap(false, usdcIn, recipient);
    }

    function unlockCallback(bytes calldata data) external returns (bytes memory) {
        require(msg.sender == address(poolManager), "AgentSwap: only the PoolManager");
        (address payer, bool ethToUsdc, uint256 amountIn, address recipient) =
            abi.decode(data, (address, bool, uint256, address));

        int256 delta = poolManager.swap(
            poolKey(),
            SwapParams(ethToUsdc, -int256(amountIn), ethToUsdc ? MIN_SQRT_PRICE + 1 : MAX_SQRT_PRICE - 1),
            ""
        );
        // BalanceDelta: ETH (currency0) in the upper 128 bits, USDC in the lower; negative is owed to the pool.
        int128 eth = int128(delta >> 128);
        int128 usd = int128(delta);
        (int128 paid, int128 received) = ethToUsdc ? (eth, usd) : (usd, eth);
        require(uint256(int256(-paid)) == amountIn, "AgentSwap: not enough liquidity in the pool");
        uint256 amountOut = uint256(int256(received));

        uint256 price = ethPrice();
        uint256 fair = ethToUsdc ? amountIn * price / 1e20 : amountIn * 1e20 / price;
        require(
            amountOut * 10_000 >= fair * (10_000 - MAX_SHORTFALL_BPS),
            "AgentSwap: pool price is more than 3% worse than Chainlink's"
        );

        if (ethToUsdc) {
            poolManager.settle{value: amountIn}();
            poolManager.take(usdc, recipient, amountOut);
        } else {
            poolManager.sync(usdc);
            require(IERC20(usdc).transferFrom(payer, address(poolManager), amountIn), "AgentSwap: USDC transfer failed");
            poolManager.settle();
            poolManager.take(address(0), recipient, amountOut);
        }
        return abi.encode(amountOut);
    }

    function poolKey() public view returns (PoolKey memory) {
        return PoolKey(address(0), usdc, FEE, TICK_SPACING, address(0));
    }

    function swap(bool ethToUsdc, uint256 amountIn, address recipient) private returns (uint256) {
        require(amountIn > 0 && amountIn <= type(uint128).max, "AgentSwap: amount must be above zero");
        require(recipient != address(0), "AgentSwap: no recipient");
        return abi.decode(poolManager.unlock(abi.encode(msg.sender, ethToUsdc, amountIn, recipient)), (uint256));
    }
}
