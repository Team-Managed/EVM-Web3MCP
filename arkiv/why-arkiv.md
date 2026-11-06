# Why Arkiv

Web3MCP lets any protocol publish tools for AI agents under its ENS name, with no one in the middle. Search is the one part that needs a shared database: an agent with a goal ("swap my ETH") but no name has to find candidate protocols somewhere.

## What users would lose with Postgres

- **Anyone could be shut out.** With our own database, we'd decide who gets listed and could edit or remove any listing. On Arkiv, a publisher lists itself with its own wallet, and only that wallet can change or extend the listing. We can't censor it or take it over.
- **Every host would depend on our server.** The Claude Code plugin, the Codex setup and anyone else's host read the same index straight from Arkiv, with no API of ours to run, rate-limit or keep online. If our team disappears, search still works.
- **Dead entries would pile up.** Listings expire after 30 days unless the publisher refreshes them, so abandoned protocols leave search without a cleanup job. In a database, someone would have to write and run that job.
- **Listings couldn't be checked.** Each listing carries the digest of the manifest it describes, and hosts drop any listing whose digest no longer matches ENS. Anyone can verify the index against ENS; they don't have to trust our database.

## What we keep off Arkiv, and why

- **The manifest itself.** ENS is the source of truth for what a protocol's tools do, and the digest check ties each listing to it. An agent never runs anything from Arkiv: it uses the index only to find a name, then reads and verifies that name's manifest from ENS.
- **Anything about users.** Wallet addresses, prepared writes and signing state stay on the user's machine, on the local signing page. They're private and short-lived.
- **Calldata and contract checks.** Built and simulated against the protocol's own chain at the moment of use, never cached.
