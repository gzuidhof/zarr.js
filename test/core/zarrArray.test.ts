
import { ZarrArray } from '../../src/core';
import { ObjectStore } from '../../src/storage/objectStore';
import { initArray, initGroup } from '../../src/storage';
import { CreateArrayOptions, normalizeStoreArgument, array } from '../../src/creation';
import { NestedArray, rangeTypedArray } from '../../src/nestedArray';
import { slice } from '../../src/core/slice';
import { arrayEquals1D } from '../../src/util';

function createArray(shape: number | number[], opts?: CreateArrayOptions) {
    if (opts === undefined) {
        opts = {};
    }

    opts.store = normalizeStoreArgument(opts.store);
    opts.chunks = opts.chunks === undefined ? null : opts.chunks;
    opts.dtype = opts.dtype === undefined ? "<u1" : opts.dtype;

    initArray(
        opts.store, shape, opts.chunks, opts.dtype,
        opts.path, opts.compressor, opts.fillValue,
        opts.order, opts.overwrite, opts.chunkStore, opts.filters
    );

    return new ZarrArray(opts.store, undefined, opts.readOnly, opts.chunkStore, opts.cacheMetadata, opts.cacheAttrs);
}

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


describe("ZarrArray 1D Setting", () => {
    const a = new NestedArray(null, 100, "<i4");
    const z = createArray(a.shape, { chunks: 10, dtype: a.dtype });
    z.set(null, a);
    expect(nestedArrayEquals(a, z.get())).toBeTruthy();

    for (const value of [-1, 0, 1, 10]) {
        a.set(slice(15, 35), value);
        z.set(slice(15, 35), value);
        expect(nestedArrayEquals(a, z.get())).toBeTruthy();
        a.set(null, value);
        z.set(null, value);
        expect(nestedArrayEquals(a, z.get())).toBeTruthy();
        // Slicing exactly a chunk
        expect(nestedArrayEquals(a.get([slice(10, 20)]), z.get([slice(10, 20)]))).toBeTruthy();
    }

    const rangeTA = rangeTypedArray([35 - 15], Int32Array);
    const rangeNA = new NestedArray(rangeTA);

    a.set(slice(15, 35), rangeNA);
    z.set(slice(15, 35), rangeNA);
    expect(nestedArrayEquals(a, z.get())).toBeTruthy();

});

function nestedArrayEquals(a: NestedArray<any> | number, b: NestedArray<any> | number) {
    if (typeof b !== typeof a) {
        console.log("Types are different");
        return false;
    }

    // Second check is actually not necessary, but TS doesn't understand that
    if (typeof a === "number" || typeof b === "number") {
        if (a !== b) {
            console.log("Values are different", a, b);
            return false;
        }
        return false;
    }

    if (a.dtype !== b.dtype) {
        console.log("Dtypes are different", a, b);
        return false;
    }

    if (!arrayEquals1D(a.shape, b.shape)) {
        console.log("Shapes are different", a.shape, b.shape);
        return false;
    }
    if (!arrayEquals1D(a.flatten(), b.flatten())) {
        console.log("Values are different", a.flatten(), b.flatten());
        return false;
    }
    return true;
}