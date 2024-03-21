import { TypedArrayConstructor, TypedArray } from "../../src/nestedArray/types";
import { rangeTypedArray } from "../../src/nestedArray";
import { setRawArray, setRawArrayToScalar, setRawArrayFromChunkItem } from "../../src/rawArray/ops";
import { Slice } from "../../src/core/types";
import { slice } from "../../src/core/slice";
import { RawArray } from "../../src/rawArray";

describe("RawArray setting", () => {
    interface TestCase {
        name: string;
        destShape: number[];
        sourceShape: number[];
        constr: TypedArrayConstructor<TypedArray>;
        selection: (Slice | number)[];
        expected: TypedArray;
    }


    const testCases: TestCase[] = [
        {
            name: "1d_3",
            destShape: [3],
            sourceShape: [3],
            constr: Int32Array,
            selection: [slice(null)],
            expected: Int32Array.from([0, 1, 2]),
        },
        {
            name: "1d_3",
            destShape: [3],
            sourceShape: [2],
            constr: Int32Array,
            selection: [slice(1, 3)],
            expected: Int32Array.from([0, 0, 1]),
        },
        {
            name: "1d_3_step_-1",
            destShape: [3],
            sourceShape: [2],
            constr: Int32Array,
            selection: [slice(2, 0, -1)],
            expected: Int32Array.from([0, 1, 0]),
        },
        {
            name: "1d_3_step_2",
            destShape: [3],
            sourceShape: [2],
            constr: Int32Array,
            selection: [slice(0, null, 2)],
            expected: Int32Array.from([0, 1, 1]),
        },
        {
            name: "1d_5_step_-2",
            destShape: [5],
            sourceShape: [3],
            constr: Int32Array,
            selection: [slice(null, null, -2)],
            expected: Int32Array.from([2, 1, 1, 3, 0]),
        },
        {
            name: "2d_2x3",
            destShape: [2, 3],
            sourceShape: [2, 3],
            constr: Int32Array,
            selection: [slice(null)],
            expected: Int32Array.from([0, 1, 2, 3, 4, 5]),
        },
        {
            name: "2d_2x3_s",
            destShape: [2, 3],
            sourceShape: [3],
            constr: Int32Array,
            selection: [0],
            expected: Int32Array.from([0, 1, 2, 3, 4, 5]),
        },
        {
            name: "2d_2x3_s",
            destShape: [2, 3],
            sourceShape: [2],
            constr: Int32Array,
            selection: [slice(null), 0],
            expected: Int32Array.from([0, 1, 2, 1, 4, 5]),
        },
        {
            name: "2d_2x3_int_index",
            destShape: [2, 3],
            sourceShape: [3],
            constr: Int32Array,
            selection: [1],
            expected: Int32Array.from([0, 1, 2, 0, 1, 2]),
        },
        {
            name: "2d_2x3_int_index_step_-1",
            destShape: [2, 3],
            sourceShape: [3],
            constr: Int32Array,
            selection: [1, slice(null, null, -1)],
            expected: Int32Array.from([0, 1, 2, 2, 1, 0]),
        },
        {
            name: "2d_2x3_empty",
            destShape: [2, 3],
            sourceShape: [0, 3],
            constr: Int32Array,
            selection: [slice(0, 0)],
            expected: Int32Array.from([0, 1, 2, 3, 4, 5]),
        },
        {
            name: "5d_1x2x1x2x3_int_index_negative_slice",
            destShape: [1, 2, 1, 2, 3],
            sourceShape: [2, 3],
            constr: Int32Array,
            selection: [0, 1, 0, slice(null, null, -1), slice(null, null, -1)],
            expected: Int32Array.from([0, 1, 2, 3, 4, 5, 5, 4, 3, 2, 1, 0])
        },
        {
            name: "4d_1x2x2x4",
            destShape: [1, 2, 2, 4],
            sourceShape: [1, 2, 2, 4],
            constr: Int32Array,
            selection: [slice(null), slice(null), slice(null), slice(null)],
            expected: Int32Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
        },
        {
            name: "4d_1x2x2x4_step_-1",
            destShape: [1, 2, 2, 4],
            sourceShape: [1, 2, 2, 4],
            constr: Int32Array,
            selection: [slice(null), slice(null), slice(null), slice(null, null, -1)],
            expected: Int32Array.from([3, 2, 1, 0, 7, 6, 5, 4, 11, 10, 9, 8, 15, 14, 13, 12])
        },
        {
            name: "4d_1x2x2x4_step_-1_partial",
            destShape: [1, 2, 2, 4],
            sourceShape: [1, 1, 2, 4],
            constr: Int32Array,
            selection: [slice(null), slice(null, 1), slice(null), slice(null, null, -1)],
            expected: Int32Array.from([3, 2, 1, 0, 7, 6, 5, 4, 8, 9, 10, 11, 12, 13, 14, 15])
        }, {
            name: "1d_3",
            destShape: [3],
            sourceShape: [3],
            constr: BigInt64Array,
            selection: [slice(null)],
            expected: BigInt64Array.from([0n, 1n, 2n]),
        },
        {
            name: "1d_3",
            destShape: [3],
            sourceShape: [2],
            constr: BigInt64Array,
            selection: [slice(1, 3)],
            expected: BigInt64Array.from([0n, 0n, 1n]),
        },
        {
            name: "1d_3_step_-1",
            destShape: [3],
            sourceShape: [2],
            constr: BigInt64Array,
            selection: [slice(2, 0, -1)],
            expected: BigInt64Array.from([0n, 1n, 0n]),
        },
        {
            name: "1d_3_step_2",
            destShape: [3],
            sourceShape: [2],
            constr: BigInt64Array,
            selection: [slice(0, null, 2)],
            expected: BigInt64Array.from([0n, 1n, 1n]),
        },
        {
            name: "1d_5_step_-2",
            destShape: [5],
            sourceShape: [3],
            constr: BigInt64Array,
            selection: [slice(null, null, -2)],
            expected: BigInt64Array.from([2n, 1n, 1n, 3n, 0n]),
        },
        {
            name: "2d_2x3",
            destShape: [2, 3],
            sourceShape: [2, 3],
            constr: BigInt64Array,
            selection: [slice(null)],
            expected: BigInt64Array.from([0n, 1n, 2n, 3n, 4n, 5n]),
        },
        {
            name: "2d_2x3_s",
            destShape: [2, 3],
            sourceShape: [3],
            constr: BigInt64Array,
            selection: [0],
            expected: BigInt64Array.from([0n, 1n, 2n, 3n, 4n, 5n]),
        },
        {
            name: "2d_2x3_s",
            destShape: [2, 3],
            sourceShape: [2],
            constr: BigInt64Array,
            selection: [slice(null), 0],
            expected: BigInt64Array.from([0n, 1n, 2n, 1n, 4n, 5n]),
        },
        {
            name: "2d_2x3_int_index",
            destShape: [2, 3],
            sourceShape: [3],
            constr: BigInt64Array,
            selection: [1],
            expected: BigInt64Array.from([0n, 1n, 2n, 0n, 1n, 2n]),
        },
        {
            name: "2d_2x3_int_index_step_-1",
            destShape: [2, 3],
            sourceShape: [3],
            constr: BigInt64Array,
            selection: [1, slice(null, null, -1)],
            expected: BigInt64Array.from([0n, 1n, 2n, 2n, 1n, 0n]),
        },
        {
            name: "2d_2x3_empty",
            destShape: [2, 3],
            sourceShape: [0, 3],
            constr: BigInt64Array,
            selection: [slice(0, 0)],
            expected: BigInt64Array.from([0n, 1n, 2n, 3n, 4n, 5n]),
        },
        {
            name: "5d_1x2x1x2x3_int_index_negative_slice",
            destShape: [1, 2, 1, 2, 3],
            sourceShape: [2, 3],
            constr: BigInt64Array,
            selection: [0, 1, 0, slice(null, null, -1), slice(null, null, -1)],
            expected: BigInt64Array.from([0n, 1n, 2n, 3n, 4n, 5n, 5n, 4n, 3n, 2n, 1n, 0n])
        },
        {
            name: "4d_1x2x2x4",
            destShape: [1, 2, 2, 4],
            sourceShape: [1, 2, 2, 4],
            constr: BigInt64Array,
            selection: [slice(null), slice(null), slice(null), slice(null)],
            expected: BigInt64Array.from([0n, 1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n, 11n, 12n, 13n, 14n, 15n])
        },
        {
            name: "4d_1x2x2x4_step_-1",
            destShape: [1, 2, 2, 4],
            sourceShape: [1, 2, 2, 4],
            constr: BigInt64Array,
            selection: [slice(null), slice(null), slice(null), slice(null, null, -1)],
            expected: BigInt64Array.from([3n, 2n, 1n, 0n, 7n, 6n, 5n, 4n, 11n, 10n, 9n, 8n, 15n, 14n, 13n, 12n])
        },
        {
            name: "4d_1x2x2x4_step_-1_partial",
            destShape: [1, 2, 2, 4],
            sourceShape: [1, 1, 2, 4],
            constr: BigInt64Array,
            selection: [slice(null), slice(null, 1), slice(null), slice(null, null, -1)],
            expected: BigInt64Array.from([3n, 2n, 1n, 0n, 7n, 6n, 5n, 4n, 8n, 9n, 10n, 11n, 12n, 13n, 14n, 15n])
        },
    ];


    test.each(testCases)(`%p`, (t: TestCase) => {
        const sourceData = rangeTypedArray(t.sourceShape, t.constr);
        const sourceRawArray = new RawArray(new t.constr(sourceData.buffer), t.sourceShape);

        const destData = rangeTypedArray(t.destShape, t.constr);
        const destRawArray = new RawArray(new t.constr(destData.buffer), t.destShape);

        setRawArray(
            destRawArray.data,
            destRawArray.strides,
            t.destShape,
            t.selection,
            sourceRawArray.data,
            sourceRawArray.strides,
            t.sourceShape,
        );

        expect(destRawArray.data).toEqual(t.expected);
    });


});

describe("RawArray scalar setting", () => {
    interface TestCase {
        name: string;
        destShape: number[];
        value: number | bigint;
        constr: TypedArrayConstructor<TypedArray>;
        selection: (Slice | number)[];
        expected: TypedArray;
    }


    const testCases: TestCase[] = [
        {
            name: "1d_3",
            destShape: [3],
            value: 2,
            constr: Int32Array,
            selection: [slice(null)],
            expected: Int32Array.from([2, 2, 2]),
        },
        {
            name: "4d_1x2x2x4",
            destShape: [1, 2, 2, 4],
            value: 3,
            constr: Int32Array,
            selection: [slice(null), slice(0, 1), slice(null), slice(null)],
            expected: Int32Array.from([3, 3, 3, 3, 3, 3, 3, 3, 8, 9, 10, 11, 12, 13, 14, 15])
        },
        {
            name: "4d_1x2x2x4_step_2",
            destShape: [1, 2, 2, 4],
            value: 3,
            constr: Int32Array,
            selection: [slice(null), slice(0, 1), slice(null), slice(null, null, 2)],
            expected: Int32Array.from([3, 1, 3, 3, 3, 5, 3, 7, 8, 9, 10, 11, 12, 13, 14, 15])
        },
        {
            name: "1d_3",
            destShape: [3],
            value: 2n,
            constr: BigInt64Array,
            selection: [slice(null)],
            expected: BigInt64Array.from([2n, 2n, 2n]),
        },
        {
            name: "4d_1x2x2x4",
            destShape: [1, 2, 2, 4],
            value: 3n,
            constr: BigInt64Array,
            selection: [slice(null), slice(0, 1), slice(null), slice(null)],
            expected: BigInt64Array.from([3n, 3n, 3n, 3n, 3n, 3n, 3n, 3n, 8n, 9n, 10n, 11n, 12n, 13n, 14n, 15n])
        },
        {
            name: "4d_1x2x2x4_step_2",
            destShape: [1, 2, 2, 4],
            value: 3n,
            constr: BigInt64Array,
            selection: [slice(null), slice(0, 1), slice(null), slice(null, null, 2)],
            expected: BigInt64Array.from([3n, 1n, 3n, 3n, 3n, 5n, 3n, 7n, 8n, 9n, 10n, 11n, 12n, 13n, 14n, 15n])
        },
    ];


    test.each(testCases)(`%p`, (t: TestCase) => {
        const destData = rangeTypedArray(t.destShape, t.constr);
        const destRawArray = new RawArray(new t.constr(destData.buffer), t.destShape);
        setRawArrayToScalar(destRawArray.data, destRawArray.strides, t.destShape, t.selection, t.value);
        expect(destRawArray.data).toEqual(t.expected);
    });

});

describe("RawArray setting from chunkItem", () => {
    interface TestCase {
        name: string;
        destShape: number[];
        sourceShape: number[];
        constr: TypedArrayConstructor<TypedArray>;
        destSelection: (Slice | number)[];
        sourceSelection: (Slice | number)[];
        expected: TypedArray;
    }


    const testCases: TestCase[] = [
        {
            name: "1d_3",
            destShape: [3],
            sourceShape: [3],
            constr: Int32Array,
            destSelection: [slice(null)],
            sourceSelection: [slice(null)],
            expected: Int32Array.from([0, 1, 2]),
        },
        {
            name: "1d_3",
            destShape: [3],
            sourceShape: [2],
            constr: Int32Array,
            destSelection: [slice(1, 3)],
            sourceSelection: [slice(null)],
            expected: Int32Array.from([0, 0, 1]),
        },
        {
            name: "1d_3_step_2",
            destShape: [3],
            sourceShape: [2],
            constr: Int32Array,
            destSelection: [slice(0, null, 2)],
            sourceSelection: [slice(null)],
            expected: Int32Array.from([0, 1, 1]),
        },
        {
            name: "2d_2x3",
            destShape: [2, 3],
            sourceShape: [2, 3],
            constr: Int32Array,
            destSelection: [slice(null)],
            sourceSelection: [slice(null)],
            expected: Int32Array.from([0, 1, 2, 3, 4, 5]),
        },
        {
            name: "2d_2x3_s",
            destShape: [2, 3],
            sourceShape: [3],
            constr: Int32Array,
            destSelection: [0],
            sourceSelection: [slice(null)],
            expected: Int32Array.from([0, 1, 2, 3, 4, 5]),
        },
        {
            name: "2d_2x3_s",
            destShape: [2, 3],
            sourceShape: [2],
            constr: Int32Array,
            destSelection: [slice(null), 0],
            sourceSelection: [slice(null)],
            expected: Int32Array.from([0, 1, 2, 1, 4, 5])
        },
        {
            name: "2d_2x3_empty",
            destShape: [2, 3],
            sourceShape: [0, 3],
            constr: Int32Array,
            destSelection: [slice(0, 0)],
            sourceSelection: [slice(null)],
            expected: Int32Array.from([0, 1, 2, 3, 4, 5]),
        },
        {
            name: "4d_1x2x2x4",
            destShape: [1, 2, 2, 4],
            sourceShape: [1, 2, 2, 4],
            constr: Int32Array,
            destSelection: [slice(null), slice(null), slice(null), slice(null)],
            sourceSelection: [slice(null), slice(null), slice(null), slice(null)],
            expected: Int32Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
        },
        {
            name: "1d_3",
            destShape: [3],
            sourceShape: [3],
            constr: BigInt64Array,
            destSelection: [slice(null)],
            sourceSelection: [slice(null)],
            expected: BigInt64Array.from([0n, 1n, 2n]),
        },
        {
            name: "1d_3",
            destShape: [3],
            sourceShape: [2],
            constr: BigInt64Array,
            destSelection: [slice(1, 3)],
            sourceSelection: [slice(null)],
            expected: BigInt64Array.from([0n, 0n, 1n]),
        },
        {
            name: "1d_3_step_2",
            destShape: [3],
            sourceShape: [2],
            constr: BigInt64Array,
            destSelection: [slice(0, null, 2)],
            sourceSelection: [slice(null)],
            expected: BigInt64Array.from([0n, 1n, 1n]),
        },
        {
            name: "2d_2x3",
            destShape: [2, 3],
            sourceShape: [2, 3],
            constr: BigInt64Array,
            destSelection: [slice(null)],
            sourceSelection: [slice(null)],
            expected: BigInt64Array.from([0n, 1n, 2n, 3n, 4n, 5n]),
        },
        {
            name: "2d_2x3_s",
            destShape: [2, 3],
            sourceShape: [3],
            constr: BigInt64Array,
            destSelection: [0],
            sourceSelection: [slice(null)],
            expected: BigInt64Array.from([0n, 1n, 2n, 3n, 4n, 5n]),
        },
        {
            name: "2d_2x3_s",
            destShape: [2, 3],
            sourceShape: [2],
            constr: BigInt64Array,
            destSelection: [slice(null), 0],
            sourceSelection: [slice(null)],
            expected: BigInt64Array.from([0n, 1n, 2n, 1n, 4n, 5n])
        },
        {
            name: "2d_2x3_empty",
            destShape: [2, 3],
            sourceShape: [0, 3],
            constr: BigInt64Array,
            destSelection: [slice(0, 0)],
            sourceSelection: [slice(null)],
            expected: BigInt64Array.from([0n, 1n, 2n, 3n, 4n, 5n]),
        },
        {
            name: "4d_1x2x2x4",
            destShape: [1, 2, 2, 4],
            sourceShape: [1, 2, 2, 4],
            constr: BigInt64Array,
            destSelection: [slice(null), slice(null), slice(null), slice(null)],
            sourceSelection: [slice(null), slice(null), slice(null), slice(null)],
            expected: BigInt64Array.from([0n, 1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n, 11n, 12n, 13n, 14n, 15n])
        },
    ];


    test.each(testCases)(`%p`, (t: TestCase) => {
        const sourceData = rangeTypedArray(t.sourceShape, t.constr);
        const sourceRawArray = new RawArray(new t.constr(sourceData.buffer), t.sourceShape);

        const destData = rangeTypedArray(t.destShape, t.constr);
        const destRawArray = new RawArray(new t.constr(destData.buffer), t.destShape);

        setRawArrayFromChunkItem(
            destRawArray.data,
            destRawArray.strides,
            t.destShape,
            t.destSelection,
            sourceRawArray.data,
            sourceRawArray.strides,
            t.sourceShape,
            t.sourceSelection
        );

        expect(destRawArray.data).toEqual(t.expected);
    });


});