
import { ZarrArray } from '../src/core';
import { ObjectStore } from '../src/storage/objectStore';
import { initArray, initGroup } from '../src/storage';
import { Group } from "../src/hierarchy";
import { Attributes } from '../src/attributes';


function createGroup(store: any = null, path: string | null = null, readOnly = false, chunkStore = null): Group {
    if (store === null) {
        store = new ObjectStore();
    }
    initGroup(store, path, chunkStore);
    const g = new Group(store, path, readOnly, chunkStore);
    return g;
}

describe("Groups", () => {

    it("initializes as expected (1)", () => {
        const store = new ObjectStore();
        const g = createGroup(store);
        expect(g.store).toEqual(store);
        expect(g.readOnly).toBeFalsy();
        expect(g.path).toEqual("");
        expect(g.name).toEqual("/");
        expect(g.basename).toEqual("");
        expect(g.attrs).toBeInstanceOf(Attributes);
        g.attrs.setItem("foo", "bar");
        expect(g.attrs.getItem("foo")).toEqual("bar");
    });

    it("initializes with paths", () => {
        const store = new ObjectStore();
        const g = createGroup(store, "/foo/bar/", true);
        expect(g.store).toEqual(store);
        expect(g.readOnly).toBeTruthy();
        expect(g.path).toEqual("foo/bar");
        expect(g.name).toEqual("/foo/bar");
        expect(g.basename).toEqual("bar");
        expect(g.attrs).toBeInstanceOf(Attributes);
    });

    it("initialize errors if metadata is not initialized", () => {
        // Group metadata not initialized
        const store = new ObjectStore();
        expect(() => new Group(store)).toThrowError();
    });

    it("initialize errors if array is ocupying slot", () => {
        // Group metadata not initialized
        const store = new ObjectStore();
        initArray(store, 100, 10, "<i4");
        expect(() => initGroup(store)).toThrowError();
        expect(() => new Group(store)).toThrowError();
    });


});