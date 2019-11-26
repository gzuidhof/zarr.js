
import { slice } from "../../src/core/slice";
import { ObjectStore } from '../../src/storage/objectStore';
import { initArray } from '../../src/storage';
import { ZarrArray } from '../../src/core';
import { normalizeIntegerSelection, replaceEllipsis } from "../../src/core/indexing";
import { NestedArray, rangeTypedArray } from '../../src/nestedArray/index';
import { create } from '../../src/creation';
import { TypedArray } from "../../src/nestedArray/types";
import { MemoryStore } from "../../src/storage/memoryStore";

describe("normalizeIntegerSelection", () => {
    it("normalizes integer selections", () => {
        expect(normalizeIntegerSelection(1, 100)).toEqual(1);
        expect(normalizeIntegerSelection(-1, 100)).toEqual(99);
    });

    it("errors with invalid input", () => {
        expect(() => normalizeIntegerSelection(100, 100)).toThrowError();
        expect(() => normalizeIntegerSelection(1000, 100)).toThrowError();
        expect(() => normalizeIntegerSelection(-1000, 100)).toThrowError();
    });
});

describe("Ellipsis Selection", () => {
    const testCases =
        test.each([
            // expected, selection, shape

            // 1D, single item
            [[0], 0, [100]],

            // 1D
            [[null], "...", [100]],
            [[null], [null], [100]],
            [[[null, 100]], [[null, 100]], [100]],
            [[[0, null]], [[0, null]], [100]],
            [[null], [null, "..."], [100]],
            [[null], ["...", null], [100]],
            [[slice(0, 5)], slice(0, 5), [100]],
            [[slice(null)], slice(":"), [100]],
            [[slice(null)], slice(":", ":"), [100]],

            // 2D, single item
            [[0, 0], [0, 0], [100, 100]],
            [[-1, 1], [-1, 1], [100, 100]],

            // 2D, single col/row
            [[0, null], [0, null], [100, 100]],
            [[0, slice(null)], [0, slice(null)], [100, 100]],
            [[null, 0], [null, 0], [100, 100]],

            // 2D
            [[null, null], "...", [100, 100]],
            [[null, null], [null], [100, 100]],
            [[null, null], [null, null], [100, 100]],
            [[null, null], ["...", null], [100, 100]],
            [[null, null], [null, "..."], [100, 100]],
            [[null, slice(null)], ["...", slice(null)], [100, 100]],
            [[null, null], ["...", null, null], [100, 100]],
            [[null, null], [null, "...", null], [100, 100]],
            [[null, null], [null, null, "..."], [100, 100]],


        ])("replaceEllipsis(%p, %p)", (expected, selection, shape) => {
            expect(replaceEllipsis(selection, shape)).toEqual(expected);
        });

    it("errors with invalid input", () => {
        expect(() => replaceEllipsis(["...", "..."], [100, 100])).toThrowError();
        expect(() => replaceEllipsis([0, 1, 2], [100, 100])).toThrowError();
    });
});

describe("Slice creation", () => {
    it("errors with invalid input", () => {
        expect(() => slice("..." as any)).toThrowError();
        expect(() => slice(null, "..." as any)).toThrowError();
        expect(() => slice(":", "..." as any)).toThrowError();
        expect(() => slice(undefined as any)).toThrowError();
        // expect(() => slice(5, 0)).toThrowError();

        // Non-step size 1
        expect(() => slice(0, 10, 2)).not.toThrowError();
        expect(() => slice(0, 10, -2)).not.toThrowError();
    });
});

describe("GetBasicSelection1DSimple", () => {
    const store = new MemoryStore<ArrayBuffer>();

    const u8 = new Int32Array(5);
    u8.set([0, 1, 2, 3, 4]);

    initArray(store, 8, 5, '<i4', "my_array");
    store.setItem("my_array/.zarray", Buffer.from(JSON.stringify({
        "chunks": [
            5
        ],
        "compressor": null,
        "dtype": "<i4",
        "fill_value": 0,
        "filters": null,
        "order": "C",
        "shape": [
            8
        ],
        "zarr_format": 2
    })));
    store.setItem("my_array/0", u8.buffer);
    const z = new ZarrArray(store, "my_array");

    it("can select slices", () => {
        expect((z.getBasicSelection([slice(1, 3)]) as NestedArray<TypedArray>).data).toEqual(Int32Array.from([1, 2]));
    });
    it("can select single values", () => {
        expect(z.getBasicSelection(0)).toEqual(0);
        expect(z.getBasicSelection(3)).toEqual(3);
    });
    it("uses the fill value for missing chunks", () => {
        expect(z.getBasicSelection(6)).toEqual(0);
    });
});


describe("GetBasicSelections1D", () => {
    const basicSelections1D = [
        // single value
        42,
        -1,
        // slices
        slice(0, 1050),
        slice(50, 150),
        slice(0, 2000),
        slice(-150, -50),
        slice(-2000, 2000),
        slice(0, 0),  // empty result
        slice(-1, 0),  // empty result
        // total selections
        slice(null),
        "...",
        ["...", slice(null)],
        // slice with step
        slice(null),
        slice(null, null),
        slice(null, null, 1),
        slice(null, null, 10),
        slice(null, null, 100),
        slice(null, null, 1000),
        slice(null, null, 10000),
        slice(0, 1050),
        slice(0, 1050, 1),
        slice(0, 1050, 10),
        slice(0, 1050, 100),
        slice(0, 1050, 1000),
        slice(0, 1050, 10000),
        slice(1, 31, 3),
        slice(1, 31, 30),
        slice(1, 31, 300),
        slice(81, 121, 3),
        slice(81, 121, 30),
        slice(81, 121, 300),
        slice(50, 150),
        slice(50, 150, 1),
        slice(50, 150, 10),
    ];

    const data = rangeTypedArray([1050], Int32Array);
    const nestedArr = new NestedArray(data, [1050], "<i4");
    const z = create(nestedArr.shape, { chunks: [100], dtype: nestedArr.dtype });
    z.set(null, nestedArr);

    test.each(basicSelections1D)(`%p`, (selection) => {
        testGetBasicSelection(z, selection, nestedArr);

    });
});

describe("GetBasicSelections2D", () => {
    const basicSelections2D: any[] = [
        42,
        -1,
        [42, slice(null)],
        [-1, slice(null)],
        // single value
        [0, 5],
        [-5, 5],
        // single col
        [slice(null), 4],
        [slice(null), -1],
        // row slices,
        slice(null),
        slice(0, 1000),
        slice(250, 350),
        slice(0, 2000),
        slice(-350, -250),
        slice(0, 0),  // empty result N
        slice(-1, 0),  // empty result N
        slice(-2000, 0), // N
        slice(-2000, 2000),
        // 2D slices
        [slice(null), slice(1, 5)],
        [slice(250, 350), slice(null)],
        [slice(250, 350), slice(1, 5)],
        [slice(250, 350), slice(-5, -1)],
        [slice(250, 350), slice(-50, 50)],
        [slice(250, 350, 10), slice(1, 5)],
        [slice(250, 350), slice(1, 5, 2)],
        [slice(250, 350, 33), slice(1, 5, 3)],
        // total selections
        [slice(null), slice(null)],
        "...",
        [],
        ["...", slice(null)],
        ["...", slice(null), slice(null)],
        [null],
        [null, null],
        [null, 0],
    ];

    const data = rangeTypedArray([1000, 10], Int32Array);
    const nestedArr = new NestedArray(data, [1000, 10], "<i4");
    const z = create(nestedArr.shape, { chunks: [400, 3], dtype: nestedArr.dtype });
    z.set(null, nestedArr);

    test.each(basicSelections2D)(`%p`, (selection) => {
        testGetBasicSelection(z, selection, nestedArr);
    });
});

function testGetBasicSelection(z: ZarrArray, selection: any, data: NestedArray<TypedArray>) {
    const selectedFromZarrArray = z.getBasicSelection(selection);
    const selectedFromSource = data.slice(selection);
    if (typeof selectedFromZarrArray === "number") {
        expect(selectedFromZarrArray).toEqual(selectedFromSource);
    }
    else {
        expect((selectedFromZarrArray as NestedArray<any>).flatten())
            .toEqual((selectedFromSource as NestedArray<any>).flatten());
    }
}
