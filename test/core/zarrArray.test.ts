
import { ZarrArray } from '../../src/core';
import { ObjectStore } from '../../src/storage/objectStore';
import { initArray, initGroup } from '../../src/storage';
import { normalizeStoreArgument, CreateArrayOptions, zeros } from '../../src/creation';
import { NestedArray, rangeTypedArray } from '../../src/nestedArray';
import { slice } from '../../src/core/slice';
import { arrayEquals1D } from '../../src/util';

async function createArray(shape: number | number[], opts?: Omit<CreateArrayOptions, 'shape'>) {
    if (opts === undefined) {
        opts = {};
    }

    opts.store = normalizeStoreArgument(opts.store);
    opts.chunks = opts.chunks === undefined ? null : opts.chunks;
    opts.dtype = opts.dtype === undefined ? "<u1" : opts.dtype;

    await initArray(
        opts.store, shape, opts.chunks, opts.dtype,
        opts.path, opts.compressor, opts.fillValue,
        opts.order, opts.overwrite, opts.chunkStore, opts.filters
    );

    return ZarrArray.create(opts.store, undefined, opts.readOnly, opts.chunkStore, opts.cacheMetadata, opts.cacheAttrs);
}

describe("ZarrArray Creation", () => {
    it("does basic initialization", async () => {
        const store = new ObjectStore<Buffer>();
        await initArray(store, 100, 5, '<f8');
        const z = await ZarrArray.create(store);

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

    it("initializes at path", async () => {
        const store = new ObjectStore<Buffer>();
        await initArray(store, 100, 5, '<f8', "foo/bar");
        const z = await ZarrArray.create(store, "foo/bar");

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

    it("errors when store is in incorrect state", async () => {
        const uninitializedStore = new ObjectStore<Buffer>();
        await expect(ZarrArray.create(uninitializedStore)).rejects.toBeTruthy();

        const occupiedStore = new ObjectStore<Buffer>();
        await initGroup(occupiedStore, "baz");
        await expect(ZarrArray.create(occupiedStore)).rejects.toBeTruthy();
    });

    it("errors for unsupported/invalid dtype", async () => {
        const store = new ObjectStore<Buffer>();
        await initArray(store, 100, 5, '<i64' as any);
        const z = await ZarrArray.create(store);
        await expect(z.get(null)).rejects.toBeTruthy();
    });

});


describe("ZarrArray 1D Setting", () => {

    it("Can set 1D arrays", async () => {
        const a = new NestedArray(null, 100, "<i4");
        const z = await createArray(a.shape, { chunks: 10, dtype: a.dtype });
        await z.set(null, a);
        expect(nestedArrayEquals(a, await z.get())).toBeTruthy();

        for (const value of [-1, 0, 1, 10]) {
            a.set(slice(15, 35), value);
            await z.set(slice(15, 35), value);
            expect(nestedArrayEquals(a, await z.get())).toBeTruthy();
            a.set(null, value);
            await z.set(null, value);
            expect(nestedArrayEquals(a, await z.get())).toBeTruthy();
            // Slicing exactly a chunk
            expect(nestedArrayEquals(a.get([slice(10, 20)]), await z.get([slice(10, 20)]))).toBeTruthy();
        }

        const rangeTA = rangeTypedArray([35 - 15], Int32Array);
        const rangeNA = new NestedArray(rangeTA);

        a.set(slice(15, 35), rangeNA);
        await z.set(slice(15, 35), rangeNA);
        expect(nestedArrayEquals(a, await z.get())).toBeTruthy();
    });
});

describe("ZarrArray Set with progress callback", () => {
    it("calls the callback the right amount of times with progress", async () => {
        const cb = jest.fn();
        const z = await zeros([5, 100], { chunks: [1, 50] });
        await z.set(null, 1, { progressCallback: cb });
        expect(cb.mock.calls.length).toBe(10 + 1);
        expect(cb.mock.calls[0][0]).toEqual({ progress: 0, queueSize: 10 });
        expect(cb.mock.calls[5][0]).toEqual({ progress: 5, queueSize: 10 });
        expect(cb.mock.calls[10][0]).toEqual({ progress: 10, queueSize: 10 });
    });
});


describe("ZarrArray Get with progress callback", () => {
    it("calls the callback the right amount of times with progress", async () => {
        const cb = jest.fn();
        const z = await zeros([5, 100], { chunks: [1, 50] });
        await z.get(null, { progressCallback: cb });
        expect(cb.mock.calls.length).toBe(10 + 1);
        expect(cb.mock.calls[0][0]).toEqual({ progress: 0, queueSize: 10 });
        expect(cb.mock.calls[5][0]).toEqual({ progress: 5, queueSize: 10 });
        expect(cb.mock.calls[10][0]).toEqual({ progress: 10, queueSize: 10 });
    });
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