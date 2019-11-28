
import { ZarrArray } from '../src/core';
import { ObjectStore } from '../src/storage/objectStore';
import { initArray, initGroup } from '../src/storage';
import { Group } from "../src/hierarchy";
import { Attributes } from '../src/attributes';


async function createGroup(store: any = null, path: string | null = null, readOnly = false, chunkStore = null) {
    if (store === null) {
        store = new ObjectStore();
    }
    await initGroup(store, path, chunkStore);
    const g = await Group.create(store, path, readOnly, chunkStore);
    return g;
}

describe("Groups", () => {

    it("initializes as expected (1)", async () => {
        const store = new ObjectStore();
        const g = await createGroup(store);
        expect(g.store).toEqual(store);
        expect(g.readOnly).toBeFalsy();
        expect(g.path).toEqual("");
        expect(g.name).toEqual("/");
        expect(g.basename).toEqual("");
        expect(g.attrs).toBeInstanceOf(Attributes);
        await g.attrs.setItem("foo", "bar");
        expect(await g.attrs.getItem("foo")).toEqual("bar");
    });

    it("initializes with paths", async () => {
        const store = new ObjectStore();
        const g = await createGroup(store, "/foo/bar/", true);
        expect(g.store).toEqual(store);
        expect(g.readOnly).toBeTruthy();
        expect(g.path).toEqual("foo/bar");
        expect(g.name).toEqual("/foo/bar");
        expect(g.basename).toEqual("bar");
        expect(g.attrs).toBeInstanceOf(Attributes);
    });

    // it("initialize errors if metadata is not initialized", () => {
    //     // Group metadata not initialized
    //     const store = new ObjectStore();
    //     expect(() => new Group(store)).toThrowError();
    // });

    it("initialize errors if array is ocupying slot", async () => {
        // Group metadata not initialized
        const store = new ObjectStore();
        await initArray(store, 100, 10, "<i4");
        await expect(initGroup(store)).rejects.toBeTruthy();
        await expect(Group.create(store)).rejects.toBeTruthy();
    });

    it("can create groups", async () => {
        const g1 = await createGroup();
        expect(g1.path).toEqual("");
        expect(g1.name).toEqual("/");

        // create level 1 child group
        const g2 = await g1.createGroup("foo");
        expect(g2).toBeInstanceOf(Group);
        expect(g2.path).toEqual("foo");
        expect(g2.name).toEqual("/foo");

        // create level 2 child group
        const g3 = await g2.createGroup("bar");
        expect(g3).toBeInstanceOf(Group);
        expect(g3.path).toEqual("foo/bar");
        expect(g3.name).toEqual("/foo/bar");

        // create level 3 child group
        const g4 = await g1.createGroup("foo/bar/baz");
        expect(g4).toBeInstanceOf(Group);
        expect(g4.path).toEqual("foo/bar/baz");
        expect(g4.name).toEqual("/foo/bar/baz");

        // create level 3 group via root
        const g5 = await g4.createGroup("/a/b/c/");
        expect(g5).toBeInstanceOf(Group);
        expect(g5.path).toEqual("a/b/c");
        expect(g5.name).toEqual("/a/b/c");

        // test bad keys
        await expect(g1.createGroup("foo")).rejects.toBeTruthy(); // already exists
        await expect(g1.createGroup("a/b/c")).rejects.toBeTruthy(); // already exists
        await expect(g4.createGroup("/a/b/c")).rejects.toBeTruthy(); // already exists
        await expect(g1.createGroup("")).rejects.toBeTruthy();
        await expect(g1.createGroup("/")).rejects.toBeTruthy();
        await expect(g1.createGroup("//")).rejects.toBeTruthy();

    });

    it("can require groups", async () => {
        const g1 = await createGroup();

        // test creation
        const g2 = await g1.requireGroup("foo");
        expect(g2).toBeInstanceOf(Group);
        expect(g2.path).toEqual("foo");
        expect(g2.name).toEqual("/foo");

        const g3 = await g2.requireGroup("bar");
        expect(g3).toBeInstanceOf(Group);
        expect(g3.path).toEqual("foo/bar");
        expect(g3.name).toEqual("/foo/bar");

        const g4 = await g1.requireGroup("foo/bar/baz");
        expect(g4).toBeInstanceOf(Group);
        expect(g4.path).toEqual("foo/bar/baz");
        expect(g4.name).toEqual("/foo/bar/baz");

        const g5 = await g4.requireGroup("/a/b/c/");
        expect(g5).toBeInstanceOf(Group);
        expect(g5.path).toEqual("a/b/c");
        expect(g5.name).toEqual("/a/b/c");

        // test when group already created
        const g2a = await g1.requireGroup("foo");
        expect(g2a).toEqual(g2);
        expect(g2a.path).toEqual("foo");
        expect(g2a.name).toEqual("/foo");
        const g3a = await g2a.requireGroup("bar");
        expect(g3a).toEqual(g3);
        expect(g3a.path).toEqual("foo/bar");
        expect(g3a.name).toEqual("/foo/bar");
        const g4a = await g1.requireGroup("foo/bar/baz");
        expect(g4a).toEqual(g4);
        expect(g4a.path).toEqual("foo/bar/baz");
        expect(g4a.name).toEqual("/foo/bar/baz");
        const g5a = await g4a.requireGroup("/a/b/c/");
        expect(g5a).toEqual(g5);
        expect(g5a.path).toEqual("a/b/c");
        expect(g5a.name).toEqual("/a/b/c");

        // test path normalization
        expect(await g1.requireGroup("quux")).toEqual(await g1.requireGroup("/quux/"));
    });

    it("can get subgroups by proxy", async () => {
        const g1 = await createGroup();
        // create level 1 child group
        const g2 = await g1.createGroup("foo");
        const g1proxy = g1.proxy();
        expect(await g1proxy["foo"]).toEqual(g2);
    });

});