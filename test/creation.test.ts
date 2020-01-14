import { array, zeros, empty, ones, full, openArray, create } from "../src/creation";
import { rangeTypedArray, NestedArray } from '../src/nestedArray/index';
import { MemoryStore } from "../src/storage/memoryStore";
import { ZarrArray } from "../src/core";
import { PermissionError } from '../src/errors';

describe("array", () => {
    const data = rangeTypedArray([100], Int32Array);
    const nData = new NestedArray(data);

    it("can be initialized with data", async () => {
        const a = await array(nData, { chunks: 10 });
        expect(a.shape).toEqual([100]);
        expect(a.dtype).toEqual("<i4");
        expect((await a.get() as NestedArray<Int32Array>).flatten()).toEqual(data);
    });

    it("can be initialized with data dtype null", async () => {
        const a = await array(nData, { chunks: 10, dtype: undefined });
        expect(a.shape).toEqual([100]);
        expect(a.dtype).toEqual("<i4");
        expect((await a.get() as NestedArray<Int32Array>).flatten()).toEqual(data);
    });
});

describe("empty, zeroes, ones, full", () => {
    it("initializes empty", async () => {
        const z = await empty(100, { chunks: 10 });
        expect(z.shape).toEqual([100]);
        expect(z.chunks).toEqual([10]);
    });

    it("initializes zeroes", async () => {
        const z = await zeros(100, { chunks: 10 });
        expect(z.shape).toEqual([100]);
        expect(z.chunks).toEqual([10]);
        expect(new Int32Array(100)).toEqual((await z.get() as NestedArray<Int32Array>).flatten());
    });

    it("initializes ones", async () => {
        const z = await ones(100, { chunks: 10 });
        expect(z.shape).toEqual([100]);
        expect(z.chunks).toEqual([10]);
        expect(new Int32Array(100).fill(1)).toEqual((await z.get() as NestedArray<Int32Array>).flatten());
    });

    it("initializes full int", async () => {
        const z = await full(100, 123, { chunks: 10 });
        expect(z.shape).toEqual([100]);
        expect(z.chunks).toEqual([10]);
        expect(new Int32Array(100).fill(123)).toEqual((await z.get() as NestedArray<Int32Array>).flatten());
    });

    it("initializes full NaN", async () => {
        const z = await full(100, NaN, { chunks: 10, dtype: "<f4" });
        expect(z.shape).toEqual([100]);
        expect(z.chunks).toEqual([10]);
        expect((await z.get() as NestedArray<Float32Array>).flatten()).toEqual(new Float32Array(100).fill(NaN));
    });
});

describe("openArray", () => {

    const store = new MemoryStore();

    it("handles persistence mode w", async () => {
        const z = await openArray({ store, mode: "w", shape: 100, chunks: 10 });
        await z.set(null, 42);
        expect(z).toBeInstanceOf(ZarrArray);
        expect(z.store).toBeInstanceOf(MemoryStore);
        expect((await z.get(null) as NestedArray<Int32Array>).flatten()).toEqual(new Int32Array(100).fill(42));
    });

    // TODO: test other modes

});

describe("Read only arrays", () => {
    it("respects read only", async () => {
        const z = await create({ shape: 100, chunks: 20, readOnly: true });
        expect(z.readOnly).toBeTruthy();

        await expect(z.set(null, 42)).rejects.toBeInstanceOf(PermissionError);

        z.readOnly = false;
        await expect(z.set(null, 42)).resolves.toBeUndefined();
        expect((await z.get(null) as NestedArray<Int32Array>).flatten()).toEqual(new Int32Array(100).fill(42));

        z.readOnly = true;
        await expect(z.set(null, 0)).rejects.toBeInstanceOf(PermissionError);

        // This is subtly different, but here we want to create an array with data, and then
        // have it be read only
        const data = rangeTypedArray([100], Int32Array);
        const nData = new NestedArray(data);
        const y = await array(nData, { readOnly: true, chunks: 15 });

        expect((await y.get(null) as NestedArray<Int32Array>).flatten()).toEqual(data);
        expect(y.readOnly).toBeTruthy();
        await expect(y.set(null, 0)).rejects.toBeInstanceOf(PermissionError);
    });
});