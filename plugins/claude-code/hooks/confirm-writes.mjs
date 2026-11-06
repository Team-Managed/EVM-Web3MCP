// PreToolUse hook: asks the user before any Web3MCP write, meaning a tx_ tool or the call tool running one.
// Reads pass through. Input that can't be parsed is treated as a write.
let raw = '';
for await (const chunk of process.stdin) raw += chunk;

let write = true;
try {
  const { tool_name = '', tool_input = {} } = JSON.parse(raw);
  const tool = tool_name.endsWith('__call') ? String(tool_input.tool ?? '') : tool_name.split('__').pop();
  write = tool.startsWith('tx_');
} catch {}

if (write) {
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'ask',
        permissionDecisionReason: 'Web3MCP write: confirm before it opens your wallet signing page',
      },
    }),
  );
}
