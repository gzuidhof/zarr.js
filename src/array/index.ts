import { DtypeString } from '../types';
import { NestedArrayData, TypedArray, TypedArrayConstructor } from './types';
import { normalizeArraySelection, isIntegerArray, selectionToSliceIndices } from '../core/indexing';
import { Slice, ArraySelection, SliceIndices } from '../core/types';
import { sliceIndices, slice } from '../core/slice';
import { BoundsCheckError, ValueError } from '../errors';
import { AssertionError } from 'assert';


const dtypeMapping: { [A in DtypeString]: TypedArrayConstructor<any> } = {
    "<b": Int8Array,
    "<B": Uint8Array,
    "<i1": Int8Array,
    "<u1": Uint8Array,

    "<i4": Int32Array,

    "<f4": Float32Array,
    "<f8": Float64Array,
};

export class NestedArray<T extends TypedArray> {
    dtype: DtypeString;
    shape: number[];
    data: NestedArrayData<T>;

    constructor(data: Buffer | ArrayBuffer | NestedArrayData<T> | null, shape: number[], dtype: DtypeString) {
        this.shape = shape;
        this.dtype = dtype;

        if (Buffer.isBuffer(data) || data instanceof ArrayBuffer || data === null) {
            // Create from ArrayBuffer or Buffer
            const numShapeElements = shape.reduce((x, y) => x * y, 1);

            if (data === null) {
                data = new ArrayBuffer(numShapeElements * parseInt(dtype[dtype.length - 1], 10));
            }

            const numDataElements = data.byteLength / parseInt(dtype[dtype.length - 1], 10);

            // Throw error if shape.length == 0? tbd

            if (numShapeElements !== numDataElements) {
                throw new Error(`Buffer has ${numDataElements} of dtype ${dtype}, shape is too large or small ${shape} (flat=${numShapeElements})`);
            }

            const typeConstructor: TypedArrayConstructor<T> = (dtypeMapping as any)[dtype];
            this.data = createNestedArray(data, typeConstructor, shape);
        } else {
            this.data = data;
        }
    }

    public slice(selection: number | ArraySelection): NestedArray<T> | number {
        const [sliceResult, outShape] = sliceNestedArray(this.data, this.shape, selection);
        if (outShape === []) {
            return sliceResult as number;
        } else {
            return new NestedArray(sliceResult as NestedArrayData<T>, outShape, this.dtype);
        }
    }

    public set(array: NestedArray<T>, selection?: number | ArraySelection) {
        if (selection === undefined) {
            selection = [slice(null)];
        }
        setNestedArray(this.data, array.data, this.shape, array.shape, selection);
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
export function createNestedArray<T extends TypedArray>(data: Buffer | ArrayBuffer, t: TypedArrayConstructor<T>, shape: number[], offset = 0): NestedArrayData<T> {
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

/**
 * Returns both the slice result and new output shape
 * @param arr NestedArray to slice
 * @param shape The shape of the NestedArray
 * @param selection 
 */
export function sliceNestedArray<T extends TypedArray>(arr: NestedArrayData<T>, shape: number[], selection: number | ArraySelection): [NestedArrayData<T> | number, number[]] {
    // This translates "...", ":", null into a list of slices or integer selections
    const normalizedSelection = normalizeArraySelection(selection, shape);
    const [sliceIndices, outShape] = selectionToSliceIndices(normalizedSelection, shape);
    const outArray = _sliceNestedArray(arr, shape, sliceIndices);

    return [outArray, outShape];
}

function _sliceNestedArray<T extends TypedArray>(arr: NestedArrayData<T>, shape: number[], selection: (SliceIndices | number)[]): NestedArrayData<T> | number {
    const currentSlice = selection[0];

    // Is this necessary?
    // // This is possible when a slice list is passed shorter than the amount of dimensions
    // // tslint:disable-next-line: strict-type-predicates
    // if (currentSlice === undefined) {
    //     return arr.slice();
    // }

    // When a number is passed that dimension is squeezed
    if (typeof currentSlice === "number") {
        // Assume already normalized integer selection here.
        if (shape.length === 1) {
            return arr[currentSlice];
        } else {
            return _sliceNestedArray(arr[currentSlice] as NestedArrayData<T>, shape.splice(1), selection.splice(1));
        }
    }
    const [from, to, step, outputSize] = currentSlice;

    if (outputSize === 0) {
        return new (getNestedArrayConstructor(arr))(0);
    }

    if (shape.length === 1) {
        if (step === 1) {
            return (arr as TypedArray).slice(from, to);
        }

        const newArrData = new (arr.constructor as TypedArrayConstructor<T>)(outputSize);
        for (let i = 0; i < outputSize; i++) {
            newArrData[i] = (arr as TypedArray)[from + i * step];
        }
        return newArrData;
    }

    let newArr = new Array(outputSize);

    for (let i = 0; i < outputSize; i++) {
        newArr[i] = _sliceNestedArray(arr[from + i * step] as NestedArrayData<T>, shape.slice(1), selection.slice(1));
    }

    // This is necessary to ensure that the return value is a NestedArray if the last dimension is squeezed
    // e.g. shape [2,1] with slice [:, 0] would otherwise result in a list of numbers instead of a valid NestedArray
    if (outputSize > 0 && typeof newArr[0] === "number") {
        const typedArrayConstructor = (arr[0] as TypedArray).constructor;
        newArr = (typedArrayConstructor as any).from(newArr);
    }

    return newArr;
}

/**
 * Better to use sparingly - digs down into the dimensions of given array to find the TypedArray and returns its constructor.
 */
function getNestedArrayConstructor<T extends TypedArray>(arr: any): TypedArrayConstructor<T> {
    // TODO fix typing
    // tslint:disable-next-line: strict-type-predicates
    if ((arr as TypedArray).byteLength !== undefined) {
        return (arr).constructor;
    }
    return getNestedArrayConstructor(arr[0]);
}


export function setNestedArray<T extends TypedArray>(dstArr: NestedArrayData<T>, sourceArr: NestedArrayData<T>, destShape: number[], sourceShape: number[], selection: number | ArraySelection) {
    // This translates "...", ":", null, etc into a list of slices.
    const normalizedSelection = normalizeArraySelection(selection, destShape, true);

    // Above we force the results to be SliceIndicesIndices only, without integer selections making this cast is safe.
    const [sliceIndices, outShape] = selectionToSliceIndices(normalizedSelection, destShape) as [SliceIndices[], number[]];

    // TODO: replace with non stringify equality check
    if (JSON.stringify(outShape) !== JSON.stringify(sourceShape)) {
        throw new ValueError(`Shape mismatch in source and target NestedArray: ${sourceShape} and ${outShape}`);
    }

    _setNestedArray(dstArr, sourceArr, destShape, sliceIndices);
}


function _setNestedArray<T extends TypedArray>(dstArr: NestedArrayData<T>, sourceArr: NestedArrayData<T>, shape: number[], selection: SliceIndices[]) {
    let currentSlice = selection[0];

    const [from, to, step, outputSize] = currentSlice;

    if (shape.length === 1) {
        if (step === 1) {
            (dstArr as TypedArray).set(sourceArr as TypedArray, from);
            return;
        }

        for (let i = 0; i < outputSize; i++) {
            dstArr[from + i * step] = (sourceArr as TypedArray)[i];
        }
        return;
    }

    for (let i = 0; i < outputSize; i++) {
        _setNestedArray(dstArr[from + i * step] as NestedArrayData<T>, sourceArr[i] as NestedArrayData<T>, shape.slice(1), selection.slice(1));
    }

}