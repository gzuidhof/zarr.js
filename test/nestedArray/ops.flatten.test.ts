import { createNestedArray, rangeTypedArray } from "../../src/nestedArray";
import { flattenNestedArray } from '../../src/nestedArray/ops';
import { TypedArray, TypedArrayConstructor } from "../../src/nestedArray/types";

describe("NestedArray slicing", () => {
    interface TestCase {
        name: string;
        shape: number[];
        constr: TypedArrayConstructor<TypedArray>;
    }


    const testCases: TestCase[] = [
        {
            name: "1d_3",
            shape: [3],
            constr: Int32Array,
        },
        {
            name: "3d",
            shape: [3, 5, 7],
            constr: Int32Array,
        },
        {
            name: "5d",
            shape: [3, 5, 7, 5, 3],
            constr: Int32Array,
        },
        {
            name: "2d_f32",
            shape: [3, 5],
            constr: Float32Array,
        },
        
        {
            name: "2d_i8",
            shape: [3, 5],
            constr: BigInt64Array,
        }
    ];


    test.each(testCases)(`%p`, (t: TestCase) => {
        const data = rangeTypedArray(t.shape, t.constr);
        const nestedArray = createNestedArray(data.buffer, t.constr, t.shape);

        const flat = flattenNestedArray(nestedArray, t.shape);
        expect(flat).toEqual(data);
    });

});