(global as any).fetch = require('node-fetch');

import { HTTPStore } from "../../src/storage/httpStore";
import { openArray } from "../../src/creation";

import express from "express";
import serveStatic from "serve-static";
import { Server } from "http";
import path from "path";

let server: Server;

beforeAll(async () => {
    return await new Promise(resolve => {
        const fixturesFolderPath = path.normalize(__dirname + "/../../fixtures")
        const serve = serveStatic(fixturesFolderPath, {dotfiles: "allow"});
        const app = express();
        app.use(serve);

        server = app.listen(7357, () => {
            //console.log(`Server running on 7357, serving from ${fixturesFolderPath}`);
            resolve();
        });
    });
});

afterAll(async () => {
    return await new Promise(resolve => {
        server.close((err) => {
            resolve();
        })
    })
});

describe("Test MemoryStore", () => {
    const hStore = new HTTPStore("http://localhost:7357/");

    it("Can open simple fixture", async () => {
        const z = await openArray({ store: hStore, path: "simple.zarr" });
        expect(z.shape).toEqual([8, 8]);
        expect(await z.get([0, 0])).toEqual(1);
        expect(await z.get([0, 1])).toEqual(2);
        expect(await z.get([7, 7])).toEqual(3);
        expect(await z.get([4, 4])).toEqual(0);
    });

    it("Can open empty fixture", async () => {
        const z = await openArray({ store: hStore, path: "empty.zarr" });
        expect(z.shape).toEqual([8, 8]);
        expect(await z.get([0, 0])).toEqual(0);
        expect(await z.get([0, 1])).toEqual(0);
        expect(await z.get([7, 7])).toEqual(0);
        expect(await z.get([4, 4])).toEqual(0);
    });
});
