(global as any).fetch = require('node-fetch');

import { HTTPError } from "../../src/errors";
import { HTTPStore } from "../../src/storage/httpStore";
import { openArray } from "../../src/creation";

describe("Test HTTPStore", () => {

    const simpleFixtureStoreLE = new HTTPStore("http://localhost:3000/simple_LE.zarr");
    it("Can open simple fixture", async () => {
        const z = await openArray({ store: simpleFixtureStoreLE });
        expect(z.shape).toEqual([8, 8]);
        expect(await z.get([0, 0])).toEqual(1);
        expect(await z.get([0, 1])).toEqual(2);
        expect(await z.get([7, 7])).toEqual(3);
        expect(await z.get([4, 4])).toEqual(0);
    });

    const simpleFixtureStoreBE = new HTTPStore("http://localhost:3000/simple_BE.zarr");
    it("Can open simple fixture", async () => {
        const z = await openArray({ store: simpleFixtureStoreBE });
        expect(z.shape).toEqual([8, 8]);
        expect(await z.get([0, 0])).toEqual(1);
        expect(await z.get([0, 1])).toEqual(2);
        expect(await z.get([7, 7])).toEqual(3);
        expect(await z.get([4, 4])).toEqual(0);
    });

    const simpleFixtureStoreF = new HTTPStore("http://localhost:3000/simple_F.zarr");
    it("Can open simple fixture", async () => {
        const z = await openArray({ store: simpleFixtureStoreF });
        expect(z.shape).toEqual([8, 8]);
        expect(await z.get([0, 0])).toEqual(1);
        expect(await z.get([0, 1])).toEqual(2);
        expect(await z.get([7, 7])).toEqual(3);
        expect(await z.get([4, 4])).toEqual(0);
    });

    const simpleFixtureStoreF3D = new HTTPStore("http://localhost:3000/simple_F_3D.zarr");
    it("Can open simple fixture", async () => {
        const z = await openArray({ store: simpleFixtureStoreF3D });
        expect(z.shape).toEqual([8, 8, 8]);
        expect(await z.get([0, 0, 0])).toEqual(1);
        expect(await z.get([0, 0, 1])).toEqual(2);
        expect(await z.get([7, 0, 7])).toEqual(3);
        expect(await z.get([4, 0, 4])).toEqual(0);
    });

    const emptyFixtureStore = new HTTPStore("http://localhost:3000/empty.zarr");
    it("Can open empty fixture", async () => {
        const z = await openArray({ store: emptyFixtureStore });
        expect(z.shape).toEqual([8, 8]);
        expect(await z.get([0, 0])).toEqual(0);
        expect(await z.get([0, 1])).toEqual(0);
        expect(await z.get([7, 7])).toEqual(0);
        expect(await z.get([4, 4])).toEqual(0);
    });

    const baseUrlStore = new HTTPStore("http://localhost:3000");
    it("Can open by path", async () => {
        const z = await openArray({ store: baseUrlStore, path: "simple_LE.zarr" });
        expect(z.shape).toEqual([8, 8]);
    });

    const forbiddenStore = new HTTPStore("http://localhost:3000/forbidden");
    it("Propagates HTTP server error", async () => {
        await expect(openArray({ store: forbiddenStore })).rejects.toThrowError(HTTPError);
    });
});
