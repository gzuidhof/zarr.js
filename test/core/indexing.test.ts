
import { replaceEllipsis, normalizeIntegerSelection } from '../../src/core/indexing';
import { slice } from "../../src/core/slice";
import { ObjectStore } from '../../src/storage/objectStore';
import { initArray } from '../../src/storage';
import { ZarrArray } from '../../src/core';

// describe("normalizeIntegerSelection", () => {
//     it("normalizes integer selections", () => {
//         expect(normalizeIntegerSelection(1, 100)).toEqual(1);
//         expect(normalizeIntegerSelection(-1, 100)).toEqual(99);
//     });

//     it("errors with invalid input", () => {
//         expect(() => normalizeIntegerSelection(100, 100)).toThrowError();
//         expect(() => normalizeIntegerSelection(1000, 100)).toThrowError();
//         expect(() => normalizeIntegerSelection(-1000, 100)).toThrowError();
//     });
// });

// describe("Ellipsis Selection", () => {
//     const testCases =
//         test.each([
//             // expected, selection, shape

//             // 1D, single item
//             [[0], 0, [100]],

//             // 1D
//             [[null], "...", [100]],
//             [[null], [null], [100]],
//             [[[null, 100]], [[null, 100]], [100]],
//             [[[0, null]], [[0, null]], [100]],
//             [[null], [null, "..."], [100]],
//             [[null], ["...", null], [100]],
//             [[slice(0, 5)], slice(0, 5), [100]],
//             [[slice(null)], slice(":"), [100]],
//             [[slice(null)], slice(":", ":"), [100]],

//             // 2D, single item
//             [[0, 0], [0, 0], [100, 100]],
//             [[-1, 1], [-1, 1], [100, 100]],

//             // 2D, single col/row
//             [[0, null], [0, null], [100, 100]],
//             [[0, slice(null)], [0, slice(null)], [100, 100]],
//             [[null, 0], [null, 0], [100, 100]],

//             // 2D
//             [[null, null], "...", [100, 100]],
//             [[null, null], [null], [100, 100]],
//             [[null, null], [null, null], [100, 100]],
//             [[null, null], ["...", null], [100, 100]],
//             [[null, null], [null, "..."], [100, 100]],
//             [[null, slice(null)], ["...", slice(null)], [100, 100]],
//             [[null, null], ["...", null, null], [100, 100]],
//             [[null, null], [null, "...", null], [100, 100]],
//             [[null, null], [null, null, "..."], [100, 100]],


//         ])("replaceEllipsis(%p, %p)", (expected, selection, shape) => {
//             expect(replaceEllipsis(selection, shape)).toEqual(expected);
//         });

//     it("errors with invalid input", () => {
//         expect(() => replaceEllipsis(["...", "..."], [100, 100])).toThrowError();
//         expect(() => replaceEllipsis([0, 1, 2], [100, 100])).toThrowError();
//     });
// });

// describe("Slice creation", () => {
//     it("errors with invalid input", () => {
//         expect(() => slice("..." as any)).toThrowError();
//         expect(() => slice(null, "..." as any)).toThrowError();
//         expect(() => slice(":", "..." as any)).toThrowError();
//         expect(() => slice(undefined as any)).toThrowError();
//         expect(() => slice(5, 0)).toThrowError();

//         // Non-step size 1
//         expect(() => slice(0, 10, 2)).not.toThrowError();
//         expect(() => slice(0, 10, -2)).not.toThrowError();
//     });
// });

describe("GetBasicSelection1D", () => {
    const store = new ObjectStore<ArrayBuffer>();

    const u8 = new Uint32Array(5);
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

    it("can select single numbers", () => {
        expect(z.getBasicSelection([slice(2)])).toEqual([0, 1]);
    });
});