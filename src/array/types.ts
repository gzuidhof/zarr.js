export type ND<T extends TypedArray> = T | TypedArray | T[] | T[][] | T[][][] | T[][][][] | T[][][][][] | T[][][][][][];

// export type TypedArray = Int32Array;

export type TypedArray = Uint8Array | Int8Array | Float32Array | Float64Array | Int32Array;

// ArrayLike<any> & {
//     BYTES_PER_ELEMENT: number;
//     set(array: ArrayLike<number>, offset?: number): void;
//     slice(start?: number, end?: number): TypedArray;
//     subarray(start?: number, end?: number): TypedArray;
//     buffer: Buffer | ArrayBuffer;
//     constructor: TypedArrayConstructor<TypedArray>;
// };
export type TypedArrayConstructor<T extends TypedArray> = {
    new(): T;
    // tslint:disable-next-line: unified-signatures
    new(size: number): T;
    // tslint:disable-next-line: unified-signatures
    new(buffer: ArrayBuffer): T;
    BYTES_PER_ELEMENT: number;
};
