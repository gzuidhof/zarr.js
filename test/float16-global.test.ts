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

  it("Can open simple <f2 fixture", async () => {
      const store = new HTTPStore("http://localhost:3000/simple_float16_LE.zarr");
      const z = await openArray({ store });
      expect(z.dtype).toBe('<f2');
      expect(z.shape).toEqual([8, 8]);
      expect(await z.get([0, 0])).toEqual(1);
      expect(await z.get([0, 1])).toEqual(2);
      expect(await z.get([7, 7])).toEqual(3);
      expect(await z.get([4, 4])).toEqual(0);
      expect((await z.getRaw(null) as RawArray).data).toBeInstanceOf(Float16Array);
  });

  it("Can open simple >f2 fixture", async () => {
      const store = new HTTPStore("http://localhost:3000/simple_float16_BE.zarr");
      const z = await openArray({ store });
      expect(z.dtype).toBe('>f2');
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
