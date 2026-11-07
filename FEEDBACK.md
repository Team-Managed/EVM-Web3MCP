# Uniswap developer feedback

Required for the Uniswap prize. Add notes here while building, then submit the Uniswap Developer Feedback Form with a link to this file.

## What worked well

- Swapping straight through the v4 PoolManager (unlock, swap, settle, take) took about 40 lines, with native ETH as currency0 and no wrapping.
- The Quoter answers a plain `eth_call` with the exact output, fees and price impact included, so an agent can quote without any custom code.

## What was hard or confusing

- `V4Quoter.quoteExactInputSingle` is non-view in the ABI, because it runs the swap and reverts. Tools that sort functions into reads and writes by ABI mutability treat a quote as a transaction. We added a `dryRun` flag to our manifest format so a read may call it.
- The Sepolia ETH/USDC v4 pools (Circle USDC, fees 100 to 10000) trade around 25,000 USDC per ETH, about 11x Chainlink's price. Any oracle-checked demo has to account for that.

## Documentation gaps

- Sepolia has two working Quoter deployments (`0x61B3f201…Ccf9227`, as in the docs, and `0x68aFa8b8…C8244`). It isn't clear which one is canonical.

## Bugs found
