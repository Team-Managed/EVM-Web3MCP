import { validateManifest, type Manifest } from '@web3mcp/evm';

/** Generate only after choosing real deployment addresses; never publishes. */
export function giftBoxManifest(giftbox: string, usdc: string): Manifest {
  if (/^0x0{40}$/i.test(giftbox) || /^0x0{40}$/i.test(usdc) || giftbox.toLowerCase() === usdc.toLowerCase()) {
    throw new Error('GiftBox and USDC must be distinct nonzero contract addresses.');
  }
  const inputs = {
    name: { type: 'string', description: 'Canonical lowercase top-level .eth name, e.g. riya.eth' },
    unlock_on: { type: 'date', description: 'Unlock date at midnight UTC, or ISO date-time with explicit timezone' },
    message: { type: 'string', description: 'Public message, at most 1024 UTF-8 bytes; never include secrets' },
  };
  const call = (fn: string, args: string[], value?: string) => ({ contract: 'giftbox', function: fn, args, ...(value ? { value } : {}) });
  const giftOutput = '(address sender,address token,uint256 amount,uint64 unlockAt,bool done,string name,string message)';
  return validateManifest({
    web3mcp: '0.1-evm', chainId: 11155111, name: 'gifts.web3mcp.eth', contracts: { giftbox, usdc },
    tools: [
      { name: 'gifts_for', kind: 'read', description: 'Gift IDs recorded for this name, including completed gifts.', inputs: { name: inputs.name },
        call: call('function giftsFor(string name) view returns (uint256[])', ['$input.name']) },
      { name: 'gift', kind: 'read', description: 'Full public details of a gift.', inputs: { id: { type: 'uint256' } },
        call: call(`function gifts(uint256 id) view returns (${giftOutput})`, ['$input.id']) },
      { name: 'who_can_claim', kind: 'read', description: 'Current ENSv2 name owner; zero for unregistered or expired names. Does not check a gift unlock time.',
        inputs: { name: inputs.name }, call: call('function ownerOf(string name) view returns (address)', ['$input.name']) },
      { name: 'gift_usdc', kind: 'write', description: 'Escrow USDC for the current owner of a name at claim time. Sender can cancel before unlock or recover after 90 days.',
        inputs: { ...inputs, amount: { type: 'amount', token: 'usdc' } }, steps: [
          { approve: { token: 'usdc', spender: 'giftbox', amount: '$input.amount' } },
          { call: call('function giftUsdc(string name,uint256 amount,uint64 unlockAt,string message) returns (uint256)', ['$input.name', '$input.amount', '$input.unlock_on', '$input.message']) },
        ] },
      { name: 'gift_eth', kind: 'write', description: 'Escrow ETH for whoever owns the name at claim time, with sender cancellation/recovery rules.',
        inputs: { ...inputs, amount: { type: 'ether' } }, steps: [
          { call: call('function giftEth(string name,uint64 unlockAt,string message) payable returns (uint256)', ['$input.name', '$input.unlock_on', '$input.message'], '$input.amount') },
        ] },
      { name: 'claim', kind: 'write', description: 'Claim an unlocked active gift as the current ENSv2 owner.', inputs: { id: { type: 'uint256' } },
        steps: [{ call: call('function claim(uint256 id)', ['$input.id']) }] },
      { name: 'cancel', kind: 'write', description: 'Refund an active gift as sender, before unlock or at least 90 days after unlock.', inputs: { id: { type: 'uint256' } },
        steps: [{ call: call('function cancel(uint256 id)', ['$input.id']) }] },
    ],
  });
}
