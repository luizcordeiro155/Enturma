const test = require("node:test");
const assert = require("node:assert/strict");
const { historyCount } = require("./native-version.cjs");
test("release version uses immutable history length, not page size or next-page link", () => {
  assert.equal(
    historyCount(
      '<https://api.github.com/commits?per_page=1&page=2>; rel="next", <https://api.github.com/commits?per_page=1&page=184>; rel="last"',
      1,
    ),
    184,
  );
  assert.equal(historyCount(null, 1), 1);
  assert.throws(() => historyCount(null, 0));
  assert.throws(() =>
    historyCount(
      '<https://api.github.com/commits?page=999999999999>; rel="last"',
      1,
    ),
  );
});
