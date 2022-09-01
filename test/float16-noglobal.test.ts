import { create, openArray, HTTPStore } from '../src/zarr';

(global as any).fetch = require('node-fetch');

describe("f2 dtype without globalThis.Float16Array", () => {
  it("throws by default (not Float16Array in globalThis).", async () => {
      const z = await create({ shape: [100, 100], chunks: 10, dtype: '<f2' });
      await expect(z.getRaw(null))
        .rejects
        .toThrowError(/^'<f2' is not supported natively in zarr\.js\./);
  });

  it("cannot open simple f2 fixture", async () => {
    const store = new HTTPStore("http://localhost:3000/simple_float16_LE.zarr");
    const z = await openArray({ store });
    await expect(z.getRaw(null))
        .rejects
        .toThrowError(/^'<f2' is not supported natively in zarr\.js\./);
  });
});
