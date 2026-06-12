import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  generateTxReference,
  generateTxReferenceBatch,
  sortByStringKey,
} from "@/lib/utils";

describe("generateTxReference", () => {
  it("starts with the given prefix", () => {
    const ref = generateTxReference("WD");
    assert.ok(ref.startsWith("WD-"));
  });

  it("contains a timestamp segment", () => {
    const ref = generateTxReference("PKG");
    const parts = ref.split("-");
    const timestamp = Number(parts[1]);
    assert.ok(!Number.isNaN(timestamp));
    assert.ok(timestamp > 1700000000000);
  });

  it("contains a 4-char hex random segment", () => {
    const ref = generateTxReference("TX");
    const parts = ref.split("-");
    assert.match(parts[2], /^[A-F0-9]{4}$/);
  });

  it("generates unique references on successive calls", () => {
    const refs = new Set(Array.from({ length: 50 }, () => generateTxReference("T")));
    assert.equal(refs.size, 50);
  });
});

describe("generateTxReferenceBatch", () => {
  it("returns the requested number of references", () => {
    const batch = generateTxReferenceBatch("B", 5);
    assert.equal(batch.length, 5);
  });

  it("all references in a batch are unique", () => {
    const batch = generateTxReferenceBatch("B", 100);
    const uniqueSet = new Set(batch);
    assert.equal(uniqueSet.size, 100);
  });

  it("each reference starts with the prefix", () => {
    const batch = generateTxReferenceBatch("PAY", 3);
    for (const ref of batch) {
      assert.ok(ref.startsWith("PAY-"));
    }
  });

  it("returns empty array for count 0", () => {
    assert.deepStrictEqual(generateTxReferenceBatch("X", 0), []);
  });
});

describe("sortByStringKey", () => {
  it("sorts objects by the given key alphabetically", () => {
    const items = [
      { name: "Charlie", id: 3 },
      { name: "Alice", id: 1 },
      { name: "Bob", id: 2 },
    ];
    const sorted = sortByStringKey(items, "name");
    assert.deepStrictEqual(
      sorted.map((x) => x.name),
      ["Alice", "Bob", "Charlie"],
    );
  });

  it("does not mutate the original array", () => {
    const items = [{ name: "B" }, { name: "A" }];
    const sorted = sortByStringKey(items, "name");
    assert.equal(items[0].name, "B");
    assert.equal(sorted[0].name, "A");
  });

  it("handles null/undefined values by coercing to empty string", () => {
    const items = [
      { name: "B" as string | null },
      { name: null },
      { name: "A" },
    ];
    const sorted = sortByStringKey(items, "name");
    assert.equal(sorted[0].name, null);
    assert.equal(sorted[1].name, "A");
    assert.equal(sorted[2].name, "B");
  });

  it("returns empty array for empty input", () => {
    assert.deepStrictEqual(sortByStringKey([], "name"), []);
  });
});
