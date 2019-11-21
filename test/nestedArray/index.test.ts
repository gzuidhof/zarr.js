import { createNestedArray, sliceNestedArray, rangeTypedArray } from "../../src/nestedArray";
import { NestedArrayData, TypedArray, TypedArrayConstructor } from '../../src/nestedArray/types';


describe("NestedArray creation", () => {

    interface TestCase {
        name: string;
        shape: number[];
        constr: TypedArrayConstructor<TypedArray>;
        expected: NestedArrayData<TypedArray>;
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
        const data = rangeTypedArray(t.shape, t.constr);
        const nestedArray = createNestedArray(data.buffer, t.constr, t.shape);

        expect(nestedArray).toEqual(t.expected);
    });

});

