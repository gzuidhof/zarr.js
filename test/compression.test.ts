(global as any).fetch = require('node-fetch');

import { HTTPStore } from "../src/storage/httpStore";
import { openArray } from "../src/creation";

describe("Test MemoryStore", () => {
    const hStore = new HTTPStore("http://localhost:7357/");

    it("Can open simple fixture with gzip compressor", async () => {
        const z = await openArray({ store: hStore, path: "simple_gzip.zarr" });
        expect(z.shape).toEqual([8, 8]);
        expect(await z.get([0, 0])).toEqual(1);
        expect(await z.get([0, 1])).toEqual(2);
        expect(await z.get([7, 7])).toEqual(3);
        expect(await z.get([4, 4])).toEqual(0);
    });

    it("Can open simple fixture with zlib compressor", async () => {
        const z = await openArray({ store: hStore, path: "simple_zlib.zarr" });
        expect(z.shape).toEqual([8, 8]);
        expect(await z.get([0, 0])).toEqual(1);
        expect(await z.get([0, 1])).toEqual(2);
        expect(await z.get([7, 7])).toEqual(3);
        expect(await z.get([4, 4])).toEqual(0);
    });

});
