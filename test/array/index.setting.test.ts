import { TypedArrayConstructor, TypedArray, NestedArrayData } from "../../src/array/types";
import { Slice } from "../../src/core/types";
import { slice } from "../../src/core/slice";
import { createNestedArray, sliceNestedArray, setNestedArray } from "../../src/array";
import { rangeTypedArray } from "./index.test";

describe("NestedArray setting", () => {
    interface TestCase {
        name: string;
        destShape: number[];
        sourceShape: number[];
        constr: TypedArrayConstructor<TypedArray>;
        selection: (Slice | number)[];
        expected: NestedArrayData<TypedArray>;
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
            name: "1d_5_step_-3",
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
            expected: [Int32Array.from([0, 1, 2]), Int32Array.from([3, 4, 5])],
        },
        {
            name: "2d_2x3_int_index",
            destShape: [2, 3],
            sourceShape: [1, 3],
            constr: Int32Array,
            selection: [1],
            expected: [Int32Array.from([0, 1, 2]), Int32Array.from([0, 1, 2])],
        },
        {
            name: "2d_2x3_int_index_step_-1",
            destShape: [2, 3],
            sourceShape: [1, 3],
            constr: Int32Array,
            selection: [1, slice(null, null, -1)],
            expected: [Int32Array.from([0, 1, 2]), Int32Array.from([2, 1, 0])],
        },
        {
            name: "2d_2x3_empty",
            destShape: [2, 3],
            sourceShape: [0, 3],
            constr: Int32Array,
            selection: [slice(0, 0)],
            expected: [Int32Array.from([0, 1, 2]), Int32Array.from([3, 4, 5])],
        },
        {
            name: "4d_1x2x2x4",
            destShape: [1, 2, 2, 4],
            sourceShape: [1, 2, 2, 4],
            constr: Int32Array,
            selection: [slice(null), slice(null), slice(null), slice(null)],
            expected: [[[Int32Array.from([0, 1, 2, 3]), Int32Array.from([4, 5, 6, 7])], [Int32Array.from([8, 9, 10, 11]), Int32Array.from([12, 13, 14, 15])]]]
        },
        {
            name: "4d_1x2x2x4_step_-1",
            destShape: [1, 2, 2, 4],
            sourceShape: [1, 2, 2, 4],
            constr: Int32Array,
            selection: [slice(null), slice(null), slice(null), slice(null, null, -1)],
            expected: [[[Int32Array.from([3, 2, 1, 0]), Int32Array.from([7, 6, 5, 4])], [Int32Array.from([11, 10, 9, 8]), Int32Array.from([15, 14, 13, 12])]]]
        },
        {
            name: "4d_1x2x2x4_step_-1_partial",
            destShape: [1, 2, 2, 4],
            sourceShape: [1, 1, 2, 4],
            constr: Int32Array,
            selection: [slice(null), slice(null, 1), slice(null), slice(null, null, -1)],
            expected: [[[Int32Array.from([3, 2, 1, 0]), Int32Array.from([7, 6, 5, 4])], [Int32Array.from([8, 9, 10, 11]), Int32Array.from([12, 13, 14, 15])]]]
        },
    ];


    test.each(testCases)(`%p`, (t: TestCase) => {
        const sourceData = rangeTypedArray(t.sourceShape, t.constr);
        const sourceNestedArray = (createNestedArray(sourceData.buffer, t.constr, t.sourceShape));

        const destData = rangeTypedArray(t.destShape, t.constr);
        const destNestedArray = (createNestedArray(destData.buffer, t.constr, t.destShape));

        setNestedArray(destNestedArray, sourceNestedArray, t.destShape, t.sourceShape, t.selection);
        expect(destNestedArray).toEqual(t.expected);
    });


});