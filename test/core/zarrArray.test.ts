
import { ZarrArray } from '../../src/core';
import { ObjectStore } from '../../src/storage/objectStore';
import { initArray, initGroup } from '../../src/storage';

describe("ZarrArray Creation", () => {
    it("does basic initialization", () => {
        const store = new ObjectStore<Buffer>();
        initArray(store, 100, 5, '<f8');
        const z = new ZarrArray(store);

        expect(z).toBeInstanceOf(ZarrArray);
        expect(z.shape).toEqual([100]);
        expect(z.chunks).toEqual([5]);
        expect(z.path).toEqual("");
        expect(z.name).toEqual(null);
        expect(z.basename).toEqual(null);
        expect(z.store).toEqual(store);
        expect(z.chunkStore).toEqual(store);
        expect(z.dtype).toEqual('<f8');
    });

    it("initializes at path", () => {
        const store = new ObjectStore<Buffer>();
        initArray(store, 100, 5, '<f8', "foo/bar");
        const z = new ZarrArray(store, "foo/bar");

        expect(z).toBeInstanceOf(ZarrArray);
        expect(z.shape).toEqual([100]);
        expect(z.chunks).toEqual([5]);
        expect(z.path).toEqual("foo/bar");
        expect(z.name).toEqual("/foo/bar");
        expect(z.basename).toEqual("bar");
        expect(z.store).toEqual(store);
        expect(z.chunkStore).toEqual(store);
        expect(z.dtype).toEqual('<f8');
    });

    it("errors when store is in incorrect state", () => {
        const uninitializedStore = new ObjectStore<Buffer>();
        expect(() => new ZarrArray(uninitializedStore)).toThrowError();

        const occupiedStore = new ObjectStore<Buffer>();
        initGroup(occupiedStore, "baz");
        expect(() => new ZarrArray(occupiedStore)).toThrowError();
    });


});