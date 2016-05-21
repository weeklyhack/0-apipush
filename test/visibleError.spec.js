import assert from 'assert';
import VisibleError from "../visibleError";

function assertIsVisible(error) {
  assert.deepEqual(VisibleError.prototype.visible.call(error), true);
}

describe("VisibleError", function() {
  it("should create a new VisibleError", function() {
    let error = new VisibleError(500, "Unexpected Error");
    assert.deepEqual(error.message, "Unexpected Error");
    assert.deepEqual(error.code, 500);
    assertIsVisible();
  });
  it("should convert a VisibleError to JSON", function() {
    let error = new VisibleError(500, "Unexpected Error");
    assert.deepEqual(VisibleError.prototype.toJSON.call(error), {error: "Unexpected Error", code: 500});
    assertIsVisible();
  });
});
