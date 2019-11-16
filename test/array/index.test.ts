import { createNestedArray, sliceNestedArray } from "../../src/array";
import { ND, TypedArray, TypedArrayConstructor } from '../../src/array/types';
import { Slice } from '../../dist/types/core/types';
import { slice } from "../../src/core/slice";


describe("NestedArray creation", () => {

    interface TestCase {
        name: string;
        shape: number[];
        constr: TypedArrayConstructor<TypedArray>;
        expected: ND<TypedArray>;
    }

    const testCases: TestCase[] = [
        {
            name: "1d_0",
            shape: [0],
            constr: Int32Array,
            expected: Int32Array.from([]),
        },
        {
            name: "1d_1",
            shape: [1],
            constr: Int32Array,
            expected: Int32Array.from([0]),
        },
        {
            name: "1d_3",
            shape: [3],
            constr: Int32Array,
            expected: Int32Array.from([0, 1, 2]),
        },
        {
            name: "2d_1x6",
            shape: [1, 6],
            constr: Int32Array,
            expected: [
                Int32Array.from([0, 1, 2, 3, 4, 5])
            ],
        },
        {
            name: "2d_2x3",
            shape: [2, 3],
            constr: Int32Array,
            expected: [
                Int32Array.from([0, 1, 2]),
                Int32Array.from([3, 4, 5])
            ],
        },
        {
            name: "2d_3x2",
            shape: [3, 2],
            constr: Int32Array,
            expected: [
                Int32Array.from([0, 1]),
                Int32Array.from([2, 3]),
                Int32Array.from([4, 5]),
            ],
        },
        {
            name: "2d_6x1",
            shape: [6, 1],
            constr: Int32Array,
            expected: [
                Int32Array.from([0]),
                Int32Array.from([1]),
                Int32Array.from([2]),
                Int32Array.from([3]),
                Int32Array.from([4]),
                Int32Array.from([5]),
            ],
        },
        {
            name: "3d_2x1x2",
            shape: [2, 1, 2],
            constr: Int32Array,
            expected: [[Int32Array.from([0, 1])], [Int32Array.from([2, 3])]],
        },
        {
            name: "3d_2x2x1",
            shape: [2, 2, 1],
            constr: Int32Array,
            expected: [[Int32Array.from([0]), Int32Array.from([1])], [Int32Array.from([2]), Int32Array.from([3])]],
        },
        {
            name: "3d_2x2x2",
            shape: [2, 2, 2],
            constr: Int32Array,
            expected: [[Int32Array.from([0, 1]), Int32Array.from([2, 3])], [Int32Array.from([4, 5]), Int32Array.from([6, 7])]],
        },
        {
            name: "3d_3x3x4",
            shape: [3, 2, 4],
            constr: Int32Array,
            expected: [
                [
                    Int32Array.from([0, 1, 2, 3]),
                    Int32Array.from([4, 5, 6, 7]),
                ],
                [
                    Int32Array.from([8, 9, 10, 11]),
                    Int32Array.from([12, 13, 14, 15]),
                ],
                [
                    Int32Array.from([16, 17, 18, 19]),
                    Int32Array.from([20, 21, 22, 23]),
                ],
            ],
        },
        {
            name: "4d_1x1x1x4",
            shape: [1, 1, 1, 4],
            constr: Int32Array,
            expected: [[[Int32Array.from([0, 1, 2, 3])]]],
        },
        {
            name: "4d_1x1x2x4",
            shape: [1, 1, 2, 4],
            constr: Int32Array,
            expected: [[[Int32Array.from([0, 1, 2, 3]), Int32Array.from([4, 5, 6, 7])]]],
        },
        {
            name: "4d_1x2x2x4",
            shape: [1, 2, 2, 4],
            constr: Int32Array,
            expected: [[[Int32Array.from([0, 1, 2, 3]), Int32Array.from([4, 5, 6, 7])], [Int32Array.from([8, 9, 10, 11]), Int32Array.from([12, 13, 14, 15])]]],
        },
        {
            name: "4d_1x2x2x4_u8",
            shape: [1, 2, 2, 4],
            constr: Uint8Array,
            expected: [[[Uint8Array.from([0, 1, 2, 3]), Uint8Array.from([4, 5, 6, 7])], [Uint8Array.from([8, 9, 10, 11]), Uint8Array.from([12, 13, 14, 15])]]],
        },
        {
            name: "4d_1x2x2x4_f32",
            shape: [1, 2, 2, 4],
            constr: Float32Array,
            expected: [[[Float32Array.from([0, 1, 2, 3]), Float32Array.from([4, 5, 6, 7])], [Float32Array.from([8, 9, 10, 11]), Float32Array.from([12, 13, 14, 15])]]],
        },
    ];

    test.each(testCases)(`%p`, (t: TestCase) => {
        const size = t.shape.reduce((x, y) => x * y, 1);
        const data = new t.constr(size);
        data.set([...Array(size).keys()]); // Sets range 0,1,2,3,4,5
        const nestedArray = (createNestedArray(data.buffer, t.constr, t.shape));

        expect(nestedArray).toEqual(t.expected);
    });

});

describe("NestedArray slicing", () => {
    interface TestCase {
        name: string;
        shape: number[];
        constr: TypedArrayConstructor<TypedArray>;
        selection: (Slice | number)[];
        expected: ND<TypedArray> | number;
        expectedShape?: number[];
    }

    const testCases: TestCase[] = [
        {
            name: "1d_3",
            shape: [3],
            constr: Int32Array,
            selection: [slice(null)],
            expected: Int32Array.from([0, 1, 2]),
        },
        {
            name: "1d_3",
            shape: [3],
            constr: Int32Array,
            selection: [slice(null, null, 1)],
            expected: Int32Array.from([0, 1, 2]),
        },
        {
            name: "1d_3_subset",
            shape: [3],
            constr: Int32Array,
            selection: [slice(1, 3)],
            expected: Int32Array.from([1, 2]),
        },
        {
            name: "1d_3_superset",
            shape: [3],
            constr: Int32Array,
            selection: [slice(0, 100)],
            expected: Int32Array.from([0, 1, 2]),
        },
        {
            name: "1d_3_empty",
            shape: [3],
            constr: Int32Array,
            selection: [slice(5, 100)],
            expected: Int32Array.from([]),
        },
        {
            name: "1d_5_step_2",
            shape: [5],
            constr: Int32Array,
            selection: [slice(1, null, 2)],
            expected: Int32Array.from([1, 3]),
        },
        {
            name: "1d_5_super_subset_step_-1",
            shape: [5],
            constr: Int32Array,
            selection: [slice(5, 2, -1)],
            expected: Int32Array.from([4, 3]),
        },
        {
            name: "1d_5_subset_step_-1",
            shape: [5],
            constr: Int32Array,
            selection: [slice(4, 0, -1)],
            expected: Int32Array.from([4, 3, 2, 1]),
        },
        {
            name: "1d_5_subset_step_-2",
            shape: [5],
            constr: Int32Array,
            selection: [slice(4, 0, -2)],
            expected: Int32Array.from([4, 2]),
        },
        {
            name: "1d_5_step_-1_A",
            shape: [5],
            constr: Int32Array,
            selection: [slice(null, null, -1)],
            expected: Int32Array.from([4, 3, 2, 1, 0]),
        },
        {
            name: "1d_5_step_-1_B",
            shape: [5],
            constr: Int32Array,
            selection: [slice(null, -3, -1)],
            expected: Int32Array.from([4, 3]),
        },
        {
            name: "1d_5_step_-2",
            shape: [5],
            constr: Int32Array,
            selection: [slice(null, -3, -2)],
            expected: Int32Array.from([4]),
        },
        {
            name: "2d_2x3",
            shape: [2, 3],
            constr: Int32Array,
            selection: [slice(null)],
            expected: [Int32Array.from([0, 1, 2]), Int32Array.from([3, 4, 5])],
        },
        {
            name: "2d_2x3",
            shape: [2, 3],
            constr: Int32Array,
            selection: [slice(null), slice(null)],
            expected: [Int32Array.from([0, 1, 2]), Int32Array.from([3, 4, 5])],
        },
        {
            name: "2d_2x3_inverse",
            shape: [2, 3],
            constr: Int32Array,
            selection: [slice(null, null, -1), slice(null)],
            expected: [Int32Array.from([3, 4, 5]), Int32Array.from([0, 1, 2])],
        },
        {
            name: "2d_2x3_empty_result_A",
            shape: [2, 3],
            constr: Int32Array,
            selection: [slice(0, 0)],
            expected: new Int32Array(0),
            expectedShape: [0, 3],
        },
        {
            name: "2d_2x3_empty_result_B",
            shape: [2, 3],
            constr: Int32Array,
            selection: [slice(null), slice(0, 0)],
            expected: [Int32Array.from([]), Int32Array.from([])],
        },
        {
            name: "2d_2x3_slice_A",
            shape: [2, 3],
            constr: Int32Array,
            selection: [slice(0, 1), slice(null)],
            expected: [Int32Array.from([0, 1, 2])],
        },
        {
            name: "2d_2x3_slice_B",
            shape: [2, 3],
            constr: Int32Array,
            selection: [slice(1, 2), slice(null)],
            expected: [Int32Array.from([3, 4, 5])],
        },
        {
            name: "2d_2x3_slice_C",
            shape: [2, 3],
            constr: Int32Array,
            selection: [slice(1, 2), slice(0, 2)],
            expected: [Int32Array.from([3, 4])],
        },
        {
            name: "2d_2x3_slice_D",
            shape: [2, 3],
            constr: Int32Array,
            selection: [slice(1, 2), slice(null, 0, -1)],
            expected: [Int32Array.from([5, 4])],
        },
        {
            name: "2d_2x3_slice_E",
            shape: [2, 3],
            constr: Int32Array,
            selection: [slice(1, 2), slice(null, null, -1)],
            expected: [Int32Array.from([5, 4, 3])],
        },
        {
            name: "4d_1x2x2x4",
            shape: [1, 2, 2, 4],
            constr: Int32Array,
            selection: [slice(null), slice(null), slice(null), slice(null)],
            expected: [[[Int32Array.from([0, 1, 2, 3]), Int32Array.from([4, 5, 6, 7])], [Int32Array.from([8, 9, 10, 11]), Int32Array.from([12, 13, 14, 15])]]]
        },
        {
            name: "4d_1x2x2x4_inverse_dim1",
            shape: [1, 2, 2, 4],
            constr: Int32Array,
            selection: [slice(null), slice(null, null, -1), slice(null), slice(null)],
            expected: [[[Int32Array.from([8, 9, 10, 11]), Int32Array.from([12, 13, 14, 15])], [Int32Array.from([0, 1, 2, 3]), Int32Array.from([4, 5, 6, 7])]]]
        },
        {
            name: "4d_1x2x2x4_inverse_dim1_step5",
            shape: [1, 2, 2, 4],
            constr: Int32Array,
            selection: [slice(null), slice(null, null, -5), slice(null), slice(null)],
            expected: [[[Int32Array.from([8, 9, 10, 11]), Int32Array.from([12, 13, 14, 15])]]]
        },
        {
            name: "4d_1x2x2x4_inverse_dim1_step5_slice",
            shape: [1, 2, 2, 4],
            constr: Int32Array,
            selection: [slice(null), slice(null, null, -5), slice(null), slice(0, 2)],
            expected: [[[Int32Array.from([8, 9]), Int32Array.from([12, 13])]]]
        },
        {
            name: "4d_1x2x2x4_squeeze_simple",
            shape: [1, 2, 2, 4],
            constr: Int32Array,
            selection: [0],
            expected: [[Int32Array.from([0, 1, 2, 3]), Int32Array.from([4, 5, 6, 7])], [Int32Array.from([8, 9, 10, 11]), Int32Array.from([12, 13, 14, 15])]]
        },
        {
            name: "1d_squeeze",
            shape: [3],
            constr: Int32Array,
            selection: [1],
            expected: 1,
        },
        {
            name: "1d_squeeze_negative_dim",
            shape: [3],
            constr: Int32Array,
            selection: [-1],
            expected: 2,
        },
        {
            name: "1d_squeeze_wrongtype",
            shape: [3],
            constr: Int32Array,
            selection: -1 as any, // Not allowed by typing, but actually supported
            expected: 2,
        },
        {
            name: "2d_2x3_squeeze",
            shape: [2, 3],
            constr: Int32Array,
            selection: [1],
            expected: Int32Array.from([3, 4, 5]),
        },
        {
            name: "2d_2x3_squeeze_last_dim",
            shape: [2, 3],
            constr: Int32Array,
            selection: [slice(null), 0],
            expected: Int32Array.from([0, 3]),
        },
        {
            name: "2d_2x3_squeeze_neg_neg",
            shape: [2, 3],
            constr: Int32Array,
            selection: [-2, -1],
            expected: 2,
        },
        {
            name: "4d_1x2x2x4_squeeze_A",
            shape: [1, 2, 2, 4],
            constr: Int32Array,
            selection: [0, 0, slice(null), 0],
            expected: Int32Array.from([0, 4]),
        },
        {
            name: "4d_1x2x2x4_squeeze_B",
            shape: [1, 2, 2, 4],
            constr: Int32Array,
            selection: [0, 1, slice(null), 0],
            expected: Int32Array.from([8, 12]),
        },
        {
            name: "4d_1x2x2x4_empty",
            shape: [1, 2, 2, 4],
            constr: Int32Array,
            selection: [0, slice(5, 5), slice(null)],
            expected: new Int32Array(0),
            expectedShape: [0, 2, 4],
        },

    ];

    test.each(testCases)(`%p`, (t: TestCase) => {
        const size = t.shape.reduce((x, y) => x * y, 1);
        const data = new t.constr(size);
        data.set([...Array(size).keys()]); // Sets range 0,1,2,3,4,5
        const nestedArray = (createNestedArray(data.buffer, t.constr, t.shape));

        const [sliceResult, sliceShape] = sliceNestedArray(nestedArray, t.shape, t.selection);


        let expectedOutputShape = t.expectedShape;
        // We can naively determine it, this breaks for selections where some dimensions are empty
        if (expectedOutputShape === undefined) {
            expectedOutputShape = [];
            let x = t.expected;
            while (typeof x !== "number" && x !== undefined) {
                expectedOutputShape.push((x as ArrayLike<any>).length);
                x = x[0];
            }
        }

        expect(sliceResult).toEqual(t.expected);
        expect(sliceShape).toEqual(expectedOutputShape);
    });
});