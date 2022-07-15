import { Order, FillType, ChunksArgument, DtypeString } from "./types";

import { DimensionSelection, Slice } from "./core/types";
import { isSlice } from "./core/indexing";
import { TypedArray } from "./nestedArray/types";

/**
 * This should be true only if this javascript is getting executed in Node.
 */
export const IS_NODE = typeof process !== "undefined" && process.versions && process.versions.node;

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function noop(): void {}

export function humanReadableSize(size: number) {
    if (size < 2 ** 10) {
        return `${size}`;
    }
    else if (size < 2 ** 20) {
        return `${(size / (2 ** 10)).toFixed(1)}K`;
    }
    else if (size < 2 ** 30) {
        return `${(size / (2 ** 20)).toFixed(1)}M`;
    }
    else if (size < 2 ** 40) {
        return `${(size / (2 ** 30)).toFixed(1)}G`;
    }
    else if (size < 2 ** 50) {
        return `${(size / (2 ** 40)).toFixed(1)}T`;
    }
    return `${(size / (2 ** 50)).toFixed(1)}P`;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function normalizeStoragePath(path: string | String | null): string {
    if (path === null) {
        return "";
    }

    if (path instanceof String) {
        path = path.valueOf();
    }

    // convert backslash to forward slash
    path = path.replace(/\\/g, "/");

    // ensure no leading slash
    while (path.length > 0 && path[0] === '/') {
        path = path.slice(1);
    }

    // ensure no trailing slash
    while (path.length > 0 && path[path.length - 1] === '/') {
        path = path.slice(0, path.length - 1);
    }


    // collapse any repeated slashes
    path = path.replace(/\/\/+/g, "/");

    // don't allow path segments with just '.' or '..'
    const segments = path.split('/');

    for (const s of segments) {
        if (s === "." || s === "..") {
            throw Error("path containing '.' or '..' segment not allowed");
        }
    }
    return path as string;
}

export function normalizeShape(shape: number | number[]): number[] {
    if (typeof shape === "number") {
        shape = [shape];
    }
    return shape.map(x => Math.floor(x));
}

export function normalizeChunks(chunks: ChunksArgument, shape: number[]): number[] {
    // Assume shape is already normalized

    if (chunks === null || chunks === true) {
        throw new Error("Chunk guessing is not supported yet");
    }

    if (chunks === false) {
        return shape;
    }

    if (typeof chunks === "number") {
        chunks = [chunks];
    }

    // handle underspecified chunks
    if (chunks.length < shape.length) {
        // assume chunks across remaining dimensions
        chunks = chunks.concat(shape.slice(chunks.length));
    }

    return chunks.map((x, idx) => {
        // handle null or -1 in chunks
        if (x === -1 || x === null) {
            return shape[idx];
        } else {
            return Math.floor(x);
        }
    });
}

export function normalizeOrder(order: string): Order {
    order = order.toUpperCase();
    return order as Order;
}

export function normalizeDtype(dtype: DtypeString): DtypeString {
    return dtype;
}

export function normalizeFillValue(fillValue: FillType): FillType {
    return fillValue;
}

/**
 * Determine whether `item` specifies a complete slice of array with the
 *  given `shape`. Used to optimize __setitem__ operations on chunks
 * @param item
 * @param shape
 */
export function isTotalSlice(item: DimensionSelection | DimensionSelection[], shape: number[]): boolean {
    if (item === null) {
        return true;
    }
    if (!Array.isArray(item)) {
        item = [item];
    }

    for (let i = 0; i < Math.min(item.length, shape.length); i++) {
        const it = item[i];
        if (it === null) continue;

        if (isSlice(it)) {
            const s = it as Slice;
            const isStepOne = s.step === 1 || s.step === null;

            if (s.start === null && s.stop === null && isStepOne) {
                continue;
            }
            if (((s.stop as number) - (s.start as number)) === shape[i] && isStepOne) {
                continue;
            }
            return false;
        }
        return false;


        // } else {
        //     console.error(`isTotalSlice unexpected non-slice, got ${it}`);
        //     return false;
        // }
    }
    return true;
}

/**
 * Checks for === equality of all elements.
 */
export function arrayEquals1D(a: ArrayLike<any>, b: ArrayLike<any>) {
    if (a.length !== b.length) {
        return false;
    }

    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}

/*
 * Determines "C" order strides for a given shape array.
 * Strides provide integer steps in each dimention to traverse an ndarray.
 *
 * NOTE: - These strides here are distinct from numpy.ndarray.strides, which describe actual byte steps.
 *       - Strides are assumed to be contiguous, so initial step is 1. Thus, output will always be [XX, XX, 1].
 */
export function getStrides(shape: number[]): number[] {
    // adapted from https://github.com/scijs/ndarray/blob/master/ndarray.js#L326-L330
    const ndim = shape.length;
    const strides = Array(ndim);
    let step = 1; // init step
    for (let i = ndim - 1; i >= 0; i--) {
        strides[i] = step;
        step *= shape[i];
    }
    return strides;
}

export function resolveUrl(root: string | URL, path: string): string {
    const base = typeof root === 'string' ? new URL(root) : root;
    if (!base.pathname.endsWith('/')) {
        // ensure trailing slash so that base is resolved as _directory_
        base.pathname += '/';
    }
    const resolved = new URL(path, base);
    // copy search params to new URL
    resolved.search = base.search;
    return resolved.href;
}

/**
 * Swaps byte order in-place for a given TypedArray.
 * Used to flip endian-ness when getting/setting chunks from/to zarr store.
 * @param src TypedArray
 */
export function byteSwapInplace(src: TypedArray): void {
  const b = src.BYTES_PER_ELEMENT;
  if (b === 1) return; // no swapping needed
  if (IS_NODE) {
    // Use builtin methods for swapping if in Node environment
    const bytes = Buffer.from(src.buffer, src.byteOffset, src.length * b);
    if (b === 2) bytes.swap16();
    if (b === 4) bytes.swap32();
    if (b === 8) bytes.swap64();
    return;
  }
  // In browser, need to flip manually
  // Adapted from https://github.com/zbjornson/node-bswap/blob/master/bswap.js
  const flipper = new Uint8Array(src.buffer, src.byteOffset, src.length * b);
  const numFlips = b / 2;
  const endByteIndex = b - 1;
  let t: number;
  for (let i = 0; i < flipper.length; i += b) {
    for (let j = 0; j < numFlips; j++) {
      t = flipper[i + j];
      flipper[i + j] = flipper[i + endByteIndex - j];
      flipper[i + endByteIndex - j] = t;
    }
  }
}

/**
 * Creates a copy of a TypedArray and swaps bytes.
 * Used to flip endian-ness when getting/setting chunks from/to zarr store.
 * @param src TypedArray
 */
export function byteSwap(src: TypedArray): TypedArray {
    const copy = src.slice();
    byteSwapInplace(copy);
    return copy;
}

function convertColMajorToRowMajor2D(src: TypedArray, out: TypedArray, shape: number[]): void {
  let idx = 0;
  const shape0 = shape[0];
  const shape1 = shape[1];
  const stride0 = shape1;
  for (let i1 = 0; i1 < shape1; i1++) {
    for (let i0 = 0; i0 < shape0; i0++) {
      out[i0 * stride0 + i1] = src[idx++];
    }
  }
}

function convertColMajorToRowMajor3D(src: TypedArray, out: TypedArray, shape: number[]): void {
  let idx = 0;
  const shape0 = shape[0];
  const shape1 = shape[1];
  const shape2 = shape[2];
  const stride0 = shape2 * shape1;
  const stride1 = shape2;
  for (let i2 = 0; i2 < shape2; i2++) {
    for (let i1 = 0; i1 < shape1; i1++) {
      for (let i0 = 0; i0 < shape0; i0++) {
        out[i0 * stride0 + i1 * stride1 + i2] = src[idx++];
      }
    }
  }
}

function convertColMajorToRowMajor4D(src: TypedArray, out: TypedArray, shape: number[]): void {
  let idx = 0;
  const shape0 = shape[0];
  const shape1 = shape[1];
  const shape2 = shape[2];
  const shape3 = shape[3];
  const stride0 = shape3 * shape2 * shape1;
  const stride1 = shape3 * shape2;
  const stride2 = shape3;
  for (let i3 = 0; i3 < shape3; i3++) {
    for (let i2 = 0; i2 < shape2; i2++) {
      for (let i1 = 0; i1 < shape1; i1++) {
        for (let i0 = 0; i0 < shape0; i0++) {
          out[i0 * stride0 + i1 * stride1 + i2 * stride2 + i3] = src[idx++];
        }
      }
    }
  }
}

function convertColMajorToRowMajorGeneric(src: TypedArray, out: TypedArray, shape: number[]): void {
  const nDims = shape.length;
  const size = shape.reduce((r, a) => r * a);

  const rowMajorStrides = shape.map((_, i) =>
    i + 1 === nDims ? 1 : shape.slice(i + 1).reduce((r, a) => r * a, 1)
  );

  const index = Array(nDims).fill(0);

  for (let colMajorIdx = 0; colMajorIdx < size; colMajorIdx++) {
    let rowMajorIdx = 0;
    for (let dim = 0; dim < nDims; dim++) {
      rowMajorIdx += index[dim] * rowMajorStrides[dim];
    }
    out[rowMajorIdx] = src[colMajorIdx];

    index[0] += 1;
    // Handle carry-over
    for (let dim = 0; dim < nDims; dim++) {
      if (index[dim] === shape[dim]) {
        if (dim + 1 === nDims) {
          return;
        }
        index[dim] = 0;
        index[dim + 1] += 1;
      }
    }
  }
}

const colMajorToRowMajorConverters: {
  [dim: number]: (src: TypedArray, out: TypedArray, shape: number[]) => void;
} = {
  [0]: noop,
  [1]: noop,
  [2]: convertColMajorToRowMajor2D,
  [3]: convertColMajorToRowMajor3D,
  [4]: convertColMajorToRowMajor4D,
};

/**
 * Rewrites a copy of a TypedArray while converting it from column-major (F-order) to row-major (C-order).
 * @param src TypedArray
 * @param out TypedArray
 * @param shape number[]
 */
export function convertColMajorToRowMajor(src: TypedArray, out: TypedArray, shape: number[]): void {
  return (colMajorToRowMajorConverters[shape.length] || convertColMajorToRowMajorGeneric)(
    src,
    out,
    shape
  );
}

export function isArrayBufferLike(obj: unknown | null): obj is ArrayBufferLike {
    if (obj === null) {
        return false;
    }
    if (obj instanceof ArrayBuffer) {
        return true;
    }
    if (typeof SharedArrayBuffer === "function" && obj instanceof SharedArrayBuffer) {
        return true;
    }
    if (IS_NODE) { // Necessary for Node.js for some reason..
        return (obj as Record<string, unknown>).toString().startsWith("[object ArrayBuffer]")
            || (obj as Record<string, unknown>).toString().startsWith("[object SharedArrayBuffer]");
    }
    return false;
}
