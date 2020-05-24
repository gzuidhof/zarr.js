(global as any).fetch = require('node-fetch');

import { HTTPStore } from "../../src/storage/httpStore";
import { openArray } from "../../src/creation";
import { NestedArray } from "../../src/nestedArray";

describe("Test MemoryStore", () => {
    const hStore = new HTTPStore("http://localhost:7357/");

    it("Can open the simple fixture with gzip compressor (little endian)", async () => {
        const z = await openArray({ store: hStore, path: "simple_gzip_LE.zarr" });
        expect(z.shape).toEqual([8, 8]);
        expect(await z.get([0, 0])).toEqual(1);
        expect(await z.get([0, 1])).toEqual(2);
        expect(await z.get([7, 7])).toEqual(3);
        expect(await z.get([4, 4])).toEqual(0);
    });

    it("Can open the simple fixture with zlib compressor (little endian)", async () => {
        const z = await openArray({ store: hStore, path: "simple_zlib_LE.zarr" });
        expect(z.shape).toEqual([8, 8]);
        expect(await z.get([0, 0])).toEqual(1);
        expect(await z.get([0, 1])).toEqual(2);
        expect(await z.get([7, 7])).toEqual(3);
        expect(await z.get([4, 4])).toEqual(0);
    });

    it("Can open the simple fixture with gzip compressor (big endian)", async () => {
      const z = await openArray({ store: hStore, path: "simple_gzip_BE.zarr" });
      expect(z.shape).toEqual([8, 8]);
      expect(await z.get([0, 0])).toEqual(1);
      expect(await z.get([0, 1])).toEqual(2);
      expect(await z.get([7, 7])).toEqual(3);
      expect(await z.get([4, 4])).toEqual(0);
  });

  it("Can open the simple fixture with zlib compressor (big endian)", async () => {
      const z = await openArray({ store: hStore, path: "simple_zlib_BE.zarr" });
      expect(z.shape).toEqual([8, 8]);
      expect(await z.get([0, 0])).toEqual(1);
      expect(await z.get([0, 1])).toEqual(2);
      expect(await z.get([7, 7])).toEqual(3);
      expect(await z.get([4, 4])).toEqual(0);
  });

    const compressionConfigs = [
        { id: "gzip", level: 0},
        { id: "gzip", level: 9},
        { id: "zlib", level: -1},
        { id: "zlib", level: 9},
        { id: "blosc", clevel: 5, shuffle: 1, blocksize: 0, cname: "lz4"},
        { id: "blosc", clevel: 4, shuffle: 2, blocksize: 0, cname: "blosclz" }
    ];

    for (const config of compressionConfigs) {
        const data = NestedArray.arange(128);
        it (`Works end to end with compression config ${JSON.stringify(config)}`, async () => {
            const z = await openArray({shape: [128], chunks: [64], compressor: config});
            await z.set(null, data);
            const retrievedData = await z.get(null);
            expect(retrievedData).toEqual(data);
        });
      }
});
