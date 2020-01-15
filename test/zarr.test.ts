/**
 * Import everything test
 */
import * as zarr from "../src/zarr";
describe("Import test", () => {
  it("Exposes ZarrArray", () => {
    expect(zarr.ZarrArray).toBeDefined();
  });
});
