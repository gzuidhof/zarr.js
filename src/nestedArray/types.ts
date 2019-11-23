import { DtypeString } from "../types";

export type NestedArrayData = TypedArray | NDNestedArrayData;
export type NDNestedArrayData = TypedArray[] | TypedArray[][] | TypedArray[][][] | TypedArray[][][][] | TypedArray[][][][][] | TypedArray[][][][][][];

export type TypedArray = Uint8Array | Int8Array | Float32Array | Float64Array | Int32Array;

// ArrayLike<any> & {
//     BYTES_PER_ELEMENT: number;
//     set(array: ArrayLike<number>, offset?: number): void;
//     slice(start?: number, end?: number): TypedArray;
//     subarray(start?: number, end?: number): TypedArray;
//     buffer: Buffer | ArrayBuffer;
//     constructor: TypedArrayConstructor<TypedArray>;
// };
export type TypedArrayConstructor<TypedArray> = {
    new(): TypedArray;
    // tslint:disable-next-line: unified-signatures
    new(size: number): TypedArray;
    // tslint:disable-next-line: unified-signatures
    new(buffer: ArrayBuffer): TypedArray;
    BYTES_PER_ELEMENT: number;
};

export const DTYPE_TYPEDARRAY_MAPPING: { [A in DtypeString]: TypedArrayConstructor<TypedArray> } = {
    "<b": Int8Array,
    "<B": Uint8Array,
    "<i1": Int8Array,
    "<u1": Uint8Array,

    "<i4": Int32Array,

    "<f4": Float32Array,
    "<f8": Float64Array,
};
