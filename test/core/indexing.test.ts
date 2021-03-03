
import { slice } from "../../src/core/slice";
import { initArray } from '../../src/storage';
import { ZarrArray } from '../../src/core';
import { normalizeIntegerSelection, replaceEllipsis } from "../../src/core/indexing";
import { NestedArray, rangeTypedArray } from '../../src/nestedArray/index';
import { create } from '../../src/creation';
import { TypedArray } from "../../src/nestedArray/types";
import { MemoryStore } from "../../src/storage/memoryStore";
import { getStrides } from "../../src/util";

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
    const ellipsis = "..." as const;
    test.each([
        // expected, selection, shape

        // 1D, single item
        [[0], 0, [100]],

        // 1D
        [[null], ellipsis, [100]],
        [[null], [null], [100]],
        [[null], [null, ellipsis], [100]],
        [[null], [ellipsis, null], [100]],
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
        [[null, null], ellipsis, [100, 100]],
        [[null, null], [null], [100, 100]],
        [[null, null], [null, null], [100, 100]],
        [[null, null], [ellipsis, null], [100, 100]],
        [[null, null], [null, ellipsis], [100, 100]],
        [[null, slice(null)], [ellipsis, slice(null)], [100, 100]],
        [[null, null], [ellipsis, null, null], [100, 100]],
        [[null, null], [null, ellipsis, null], [100, 100]],
        [[null, null], [null, null, ellipsis], [100, 100]],


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

    const setup = async (arrName: string) => {
        await initArray(store, 8, 5, '<i4', arrName);
        store.setItem(arrName + "/.zarray", Buffer.from(JSON.stringify({
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
        store.setItem(arrName + "/0", u8.buffer);
    };

    it("can select slices and single values, uses fill value", async () => {
        await setup("array_name_0");
        const z = await ZarrArray.create(store, "array_name_0");
        expect((await z.getBasicSelection([slice(1, 3)]) as NestedArray<Int32Array>).data).toEqual(Int32Array.from([1, 2]));
        expect(await z.getBasicSelection(0)).toEqual(0);
        expect(await z.getBasicSelection(3)).toEqual(3);

        // Uses fill value
        expect(await z.getBasicSelection(6)).toEqual(0);
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

    it("blub", () => {
        expect(true).toEqual(true);
    });

    const data = rangeTypedArray([1050], Int32Array);
    const nestedArr = new NestedArray(data, [1050], "<i4");

    test.each(basicSelections1D)(`%p`, async (selection) => {
        const z = await create({ shape: nestedArr.shape, chunks: [100], dtype: nestedArr.dtype });
        await z.set(null, nestedArr);
        await testGetBasicSelection(z, selection, nestedArr);
    });

    test.each(basicSelections1D)(`%p`, async (selection) => {
        const z = await create({ shape: nestedArr.shape, chunks: [100], dtype: nestedArr.dtype });
        await z.set(null, nestedArr);
        await testGetBasicSelectionRaw(z, selection, nestedArr);
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

    test.each(basicSelections2D)(`%p`, async (selection) => {
        const z = await create({ shape: nestedArr.shape, chunks: [400, 3], dtype: nestedArr.dtype });
        await z.set(null, nestedArr);
        await testGetBasicSelection(z, selection, nestedArr);
    });

    test.each(basicSelections2D)(`%p`, async (selection) => {
        const z = await create({ shape: nestedArr.shape, chunks: [400, 3], dtype: nestedArr.dtype });
        await z.set(null, nestedArr);
        await testGetBasicSelectionRaw(z, selection, nestedArr);
    });
});

async function testGetBasicSelection(z: ZarrArray, selection: any, data: NestedArray<TypedArray>) {
    const selectedFromZarrArray = await z.getBasicSelection(selection);
    const selectedFromSource = data.get(selection);
    if (typeof selectedFromZarrArray === "number") {
        expect(selectedFromZarrArray).toEqual(selectedFromSource);
    }
    else {
        expect((selectedFromZarrArray as NestedArray<any>).flatten())
            .toEqual((selectedFromSource as NestedArray<any>).flatten());
    }
}

async function testGetBasicSelectionRaw(z: ZarrArray, selection: any, data: NestedArray<TypedArray>) {
    const selectedFromZarrArray = await z.getBasicSelection(selection, true); // asRaw === true
    const selectedFromSource = data.get(selection);
    if (typeof selectedFromZarrArray === "number") {
        expect(selectedFromZarrArray).toEqual(selectedFromSource);
    }
    else {
        expect(selectedFromZarrArray.data).toEqual((selectedFromSource as NestedArray<any>).flatten());
    }
}


describe("GetRawChunk", () => {
    const basicChunkCoords1D: any[] = [
        [[0]], [[1]], [[2]], [[6]], [[7]], [[10]]
    ];

    const data = rangeTypedArray([1050], Int32Array);
    const nestedArr = new NestedArray(data, [1050], "<i4");

    test.each(basicChunkCoords1D)(`%p`, async (coords) => {
        const z = await create({ shape: nestedArr.shape, chunks: [100], dtype: nestedArr.dtype });
        await z.set(null, nestedArr);
        await testGetRawChunk(z, coords, nestedArr, 'x');
    });
});

describe("getRawChunk2D", () => {
    interface TestCase {
        chunkCoords: number[];
        pad?: string;
    }

    const testCases: TestCase[] = [
        { chunkCoords: [0, 0] },
        { chunkCoords: [0, 1] },
        { chunkCoords: [1, 1] },
        { chunkCoords: [1, -2] },
        { chunkCoords: [2, 1], pad: 'x' },
        { chunkCoords: [2, 2], pad: 'x' },
        { chunkCoords: [-1, 2], pad: 'x' },
        { chunkCoords: [0, 3], pad: 'y' },
        { chunkCoords: [1, 3], pad: 'y' },
        { chunkCoords: [1, -1], pad: 'y' }
    ];


    const data = rangeTypedArray([1000, 10], Int32Array);
    const nestedArr = new NestedArray(data, [1000, 10], "<i4");

    test.each(testCases)(`%p`, async (t) => {
        const z = await create({ shape: nestedArr.shape, chunks: [400, 3], dtype: nestedArr.dtype });
        await z.set(null, nestedArr);
        await testGetRawChunk(z, t.chunkCoords, nestedArr, t.pad);
    });
});

async function testGetRawChunk(z: ZarrArray, chunkCoords: number[], data: NestedArray<TypedArray>, padDim?: string) {
    const decodedChunk = await z.getRawChunk(chunkCoords);
    const selection = [];
    for (let i = 0; i < chunkCoords.length; i++) {
        const dimChunkSize = z.chunks[i];
        const coord = chunkCoords[i];
        selection.push(slice(coord * dimChunkSize, dimChunkSize * (coord + 1)));
    }

    const selectedFromSource = await data.get(selection);
    const flattened = selectedFromSource.flatten();

    if (padDim) {
        // raw chunks will be zero-padded so need to pad source selection
        const zeroPadded = new Int32Array(decodedChunk.data.length);
        if (padDim === 'x') {
            zeroPadded.set(flattened);
        } else if (padDim === 'y') {
            const chunkStrides = getStrides(z.chunks);
            const dataStrides = getStrides(selectedFromSource.shape);
            for (let i = 0; i < selectedFromSource.shape[0]; i++) {
                const view = flattened.subarray(dataStrides[0] * i, dataStrides[0] * i + selectedFromSource.shape[1]);
                zeroPadded.set(view, chunkStrides[0] * i);
            }
        }
        expect(decodedChunk.data).toEqual(zeroPadded);
    } else {
        expect(decodedChunk.data).toEqual(flattened);
    }
}

