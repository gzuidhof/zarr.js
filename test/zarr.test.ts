import ZarrArray from "../src/zarr"

/**
 * Dummy test
 */
describe("Dummy test", () => {
  it("ZarrArray is instantiable", () => {
    expect(new ZarrArray()).toBeInstanceOf(ZarrArray)
  })
})
