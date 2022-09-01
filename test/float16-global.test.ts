import { create, openArray, HTTPStore } from '../src/zarr';
import { Float16Array } from '@petamoriken/float16';
import { RawArray } from '../src/rawArray';

(global as any).fetch = require('node-fetch');

describe("f2 dtype with globalThis.Float16Array", () => {
  beforeAll(() => {
      globalThis.Float16Array = Float16Array;
  });

  it("can read 'f2' with globalThis.Float16Array", async () => {
      const z = await create({ shape: [100, 100], chunks: 10, dtype: '<f2' });
      const { data } = await z.getRaw(null) as RawArray;
      expect(data).toBeInstanceOf(Float16Array);
      expect(Array.from(data)).toEqual(Array(100 * 100).fill(0));
  });

  it.each([
    { name: 'LE', dtype: '<f2' },
    { name: 'BE', dtype: '>f2' },
  ])("Can open simple f2 fixture", async ({ name, dtype }) => {
      const store = new HTTPStore(`http://localhost:3000/simple_float16_${name}.zarr`);
      const z = await openArray({ store });
      expect(z.dtype).toBe(dtype);
      expect(z.shape).toEqual([8, 8]);
      expect(await z.get([0, 0])).toEqual(1);
      expect(await z.get([0, 1])).toEqual(2);
      expect(await z.get([7, 7])).toEqual(3);
      expect(await z.get([4, 4])).toEqual(0);
      expect((await z.getRaw(null) as RawArray).data).toBeInstanceOf(Float16Array);
  });

  afterAll(() => {
      delete globalThis.Float16Array;
  });
});
