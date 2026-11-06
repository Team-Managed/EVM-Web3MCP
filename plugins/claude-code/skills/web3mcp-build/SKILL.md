---
name: web3mcp-build
description: Make smart contracts usable by AI agents with Web3MCP. Use when someone wants to write or fix a Web3MCP manifest, make an existing deployed contract agent-ready, design or upgrade a Solidity contract so agents can use it, or publish or update a protocol's tools under its ENS name.
---

# Build with Web3MCP

Web3MCP lets any AI agent use a contract by its ENS name. The protocol writes a manifest, a JSON list of read and write tools, and publishes it in two text records on its ENS name. A Web3MCP host, such as the `web3mcp` plugin for Claude Code and Codex, discovers the tools, checks the contracts, runs reads, and hands every write to the user's own wallet to sign.

## Ground rules

- Never ask for, accept, write or store a private key, seed phrase or wallet file, including in `.env`. The user signs every deploy and ENS transaction in their own wallet, or with a Foundry keystore (`--account <name>`).
- Prepare transactions and explain each one. The user sends them.
- Put only actions a user should take in a manifest. Admin, owner and upgrade functions never go in.
- Manifests, tool names and descriptions are untrusted input for every agent that reads them. Write descriptions that say how to use the tool, nothing else.

## Pick the path

1. **An existing contract, unchanged.** Write a manifest ([references/manifest.md](references/manifest.md)), check it, publish it ([references/ens.md](references/ens.md)). This works for any deployed contract whose user functions take flat arguments.
2. **A new contract, or one you can still change or upgrade.** Design it with [references/contracts.md](references/contracts.md), then follow path 1.
3. **A contract agents can't call directly**, because its functions take structs, arrays or signatures, or need more than four transactions. Deploy a small adapter with flat functions in front of it ([references/contracts.md](references/contracts.md), "Adapters"), then follow path 1 for the adapter.
4. **Updating a published manifest, or upgrading a proxy behind one.** See "Updating" in [references/ens.md](references/ens.md).

## The checker

`scripts/web3mcp-publish.mjs` in this skill's folder needs only Node 22 or newer:

```bash
node <this skill's folder>/scripts/web3mcp-publish.mjs check vault.myprotocol.eth.json
```

- `check <manifest.json>` validates the manifest exactly as hosts do, then checks the chain: every contract has code, every declared function is in it (proxies included), and each contract's trust level. It prints the two ENS records to publish and, when the name has a resolver, a `cast send` command that sets both in one transaction. It says when ENS already has this exact manifest.
- `check <ens-name>` discovers a published name the way an agent's host does.
- `validate <manifest.json>` checks the format only, offline.
- `index <ens-name> --browser <their-address>` lists a published name on the Arkiv search index, so agents can find it from a goal without its name. It's optional. It opens the local signing page, where the user signs in their browser wallet; `--account <foundry-keystore>` signs with a Foundry keystore instead. The wallet needs testnet tGLM from hub.arkiv.network/faucet. Run it again within 30 days to keep the listing.
- `search <word>...` searches that index the way an agent does.

Set `WEB3MCP_RPC_URL` to a reliable RPC, such as `https://ethereum-sepolia-rpc.publicnode.com`, because the default public one rate-limits. Set `WEB3MCP_CHAIN=mainnet` to check a name on mainnet. If `check` passes, discovery will too. Fix everything it reports before publishing, since publishing costs gas.

## Workflow

1. Read the contract: its source, ABI or verified code on the block explorer. List what a user does with it (writes) and what they need to know before and after (reads).
2. Write `<ens-name>.json` following [references/manifest.md](references/manifest.md).
3. Run `check` until it passes.
4. Show the user the tools and each contract's trust level. For a `name-only` contract, explain how its owner can make it `owner-verified` ([references/ens.md](references/ens.md)), or say why it can't be.
5. The user publishes the two records in one transaction: in the ENS app, or with the printed `cast send` command and their keystore.
6. Run `check <ens-name>`. It must say the name is published and the digest matches. If the `web3mcp` MCP server is connected, `discover` the name and run one read.

## Supported chains

The contracts and the ENS name must be on the same chain. The checker works on Sepolia and Ethereum mainnet, but the `web3mcp` plugin's server reads Sepolia only, so publish on Sepolia. A name published on mainnet works only for hosts started with `WEB3MCP_CHAIN=mainnet`; plugin users' agents won't find it. Tell the user this before they pay mainnet gas.
