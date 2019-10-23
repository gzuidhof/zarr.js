export type ND<T extends TypedArray> = T | T[] | T[][] | T[][][] | T[][][][] | T[][][][][] | T[][][][][][];

// export type TypedArray = Int32Array;

export type TypedArray = ArrayLike<any> & {
    BYTES_PER_ELEMENT: number;
    set(array: ArrayLike<number>, offset?: number): void;
    slice(start?: number, end?: number): TypedArray;
    buffer: Buffer | ArrayBuffer;
};
export type TypedArrayConstructor<T> = {
    new(): T;
    // tslint:disable-next-line: unified-signatures
    new(size: number): T;
    // tslint:disable-next-line: unified-signatures
    new(buffer: ArrayBuffer): T;
    BYTES_PER_ELEMENT: number;
};
