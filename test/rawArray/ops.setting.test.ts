import { TypedArrayConstructor, TypedArray } from "../../src/nestedArray/types";
import { rangeTypedArray } from "../../src/nestedArray";
import { setRawArrayDirect, setRawArrayToScalar } from "../../src/rawArray/ops";
import { Slice } from "../../src/core/types";
import { slice } from "../../src/core/slice";
import { RawArray } from "../../src/rawArray";

describe("RawArray setting", () => {
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
    ];


    test.each(testCases)(`%p`, (t: TestCase) => {
        const sourceData = rangeTypedArray(t.sourceShape, t.constr);
        const sourceRawArray = new RawArray(new t.constr(sourceData.buffer), t.sourceShape);

        const destData = rangeTypedArray(t.destShape, t.constr);
        const destRawArray = new RawArray(new t.constr(destData.buffer), t.destShape);

        setRawArrayDirect(
            destRawArray.data,
            destRawArray.strides,
            t.destShape,
            t.destSelection,
            sourceRawArray.data,
            sourceRawArray.strides,
            t.sourceShape,
            t.sourceSelection
        );
        if (t.name === "4d_1x2x2x4_step_2") {
            console.warn('here');
        }
        expect(destRawArray.data).toEqual(t.expected);
    });


});

describe("RawArray scalar setting", () => {
    interface TestCase {
        name: string;
        destShape: number[];
        value: number;
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
    ];


    test.each(testCases)(`%p`, (t: TestCase) => {
        const destData = rangeTypedArray(t.destShape, t.constr);
        const destRawArray = new RawArray(new t.constr(destData.buffer), t.destShape);
        setRawArrayToScalar(destRawArray.data, destRawArray.strides, t.destShape, t.selection, t.value);
        expect(destRawArray.data).toEqual(t.expected);
    });

});