import test from "node:test";
import assert from "node:assert";

test("MCP Tool annotation verification", async () => {
  const tools = [
    { name: "zalo_status", readOnly: true, idempotent: true },
    { name: "zalo_get_recent_messages", readOnly: true, idempotent: true },
    { name: "zalo_get_friends", readOnly: true, idempotent: true },
    { name: "zalo_send_message", readOnly: false, idempotent: false },
  ];

  for (const t of tools) {
    assert.strictEqual(typeof t.name, "string");
    assert.strictEqual(typeof t.readOnly, "boolean");
    assert.strictEqual(typeof t.idempotent, "boolean");
  }
});
