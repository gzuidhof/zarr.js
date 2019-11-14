import { DtypeString } from '../types';
import { ND, TypedArray, TypedArrayConstructor } from './types';
import { replaceEllipsis } from '../core/indexing';
import { Slice } from '../core/types';
import { sliceIndices } from '../core/slice';
import { NPN_ENABLED } from 'constants';


const dtypeMapping = {
    "<i4": Int32Array
};

export class NestedArray<T extends TypedArray> {
    dtype: DtypeString;
    shape: number[];
    data: ND<T>;

    constructor(data: Buffer | ArrayBuffer, shape: number[], dtype: DtypeString) {
        this.shape = shape;
        this.dtype = dtype;

        const numShapeElements = shape.reduce((x, y) => x * y, 1);
        const numDataElements = data.byteLength / parseInt(dtype[dtype.length - 1], 10);

        // Throw error if shape.length == 0? tbd

        if (numShapeElements !== numDataElements) {
            throw new Error(`Buffer has ${numDataElements} of dtype ${dtype}, shape is too large or small ${shape} (flat=${numShapeElements})`);
        }

        const typeConstructor: TypedArrayConstructor<T> = (dtypeMapping as any)[dtype];
        this.data = createNestedArray(data, typeConstructor, shape);
    }
}

/**
 * Creates multi-dimensional (rank > 1) array given input data and shape recursively.
 * What it does is create a Array<Array<...<Array<Uint8Array>>> or some other typed array.
 * This is for internal use, there should be no need to call this from user code.
 * @param data a buffer containing the data for this array.
 * @param t constructor for the datatype of choice
 * @param shape list of numbers describing the size in each dimension
 * @param offset in bytes for this dimension
 */
export function createNestedArray<T extends TypedArray>(data: Buffer | ArrayBuffer, t: TypedArrayConstructor<T>, shape: number[], offset = 0): ND<T> {
    if (shape.length === 1) {
        // This is only ever reached if called with rank 1 shape, never reached through recursion.
        // We just slice set the array directly from one level above to save some function calls.
        return new t(data.slice(offset, offset + shape[0] * t.BYTES_PER_ELEMENT));
    }

    const arr = new Array<any>(shape[0]);
    if (shape.length === 2) {
        for (let i = 0; i < shape[0]; i++) {
            arr[i] = new t(data.slice(offset + shape[1] * i * t.BYTES_PER_ELEMENT, offset + shape[1] * (i + 1) * t.BYTES_PER_ELEMENT));
        }
        return arr;
    }

    const nextShape = shape.slice(1);
    // Small optimization possible here: this can be precomputed for different levels of depth and passed on.
    const mult = nextShape.reduce((x, y) => x * y, 1);

    for (let i = 0; i < shape[0]; i++) {
        arr[i] = createNestedArray(data, t, nextShape, offset + mult * i * t.BYTES_PER_ELEMENT);
    }
    return arr;
}

export function sliceNestedArray<T extends TypedArray>(arr: ND<T>, shape: number[], selection: Slice[]) {
    const dimensionLength = shape[0];
    const [from, to, step, outputSize] = sliceIndices(selection[0], dimensionLength);

    if (shape.length === 1) {
        if (step === 1) {
            return (arr as TypedArray).slice(from, to);
        }

        // console.log(from, to, step, outputSize, selection);
        const newArrData = new (arr.constructor as TypedArrayConstructor<T>)(outputSize);
        for (let i = 0; i < outputSize; i++) {
            newArrData[i] = (arr as TypedArray)[from + i * step];
        }
        return newArrData;
    }

    // TODO more than 1 index

}


// export function setNestedArray<T extends TypedArray>(array: NestedArray<T>, data: Buffer | ArrayBuffer, selection: Slice[]): ND<T> {
//     replaceEllipsis(selection, array.shape);
//     const indices = selection.map(DimensionSelection()

//     // Check bounds and slice make sense

//     return arr;
// }