import { DtypeString } from '../types';
import { ValueError } from '../errors';

// Conditionally get the type for `Float16Array` based on end user TS settings. If not
// present, then the type if `never` (and thus excluded from unions).
type Float16ArrayConstructor = typeof globalThis extends { Float16Array: infer T } ? T : never;
// eslint-disable-next-line @typescript-eslint/naming-convention
const Float16Array = (globalThis as any).Float16Array as Float16ArrayConstructor;

export type NestedArrayData = TypedArray | NDNestedArrayData;
export type NDNestedArrayData =
  | TypedArray[]
  | TypedArray[][]
  | TypedArray[][][]
  | TypedArray[][][][]
  | TypedArray[][][][][]
  | TypedArray[][][][][][];

export type TypedArray =
  | Uint8Array
  | Int8Array
  | Uint16Array
  | Int16Array
  | Uint32Array
  | Int32Array
  | Float32Array
  | Float64Array
  | InstanceType<Float16ArrayConstructor>;

export type TypedArrayConstructor<T extends TypedArray> = {
  new(): T;
  // tslint:disable-next-line: unified-signatures
  new(size: number): T;
  // tslint:disable-next-line: unified-signatures
  new(buffer: ArrayBuffer): T;
  BYTES_PER_ELEMENT: number;
};

const DTYPE_TYPEDARRAY_MAPPING: { [A in DtypeString]: TypedArrayConstructor<TypedArray> } = {
  '|b': Int8Array,
  '|B': Uint8Array,
  '|u1': Uint8Array,
  '|i1': Int8Array,
  '<b': Int8Array,
  '<B': Uint8Array,
  '<u1': Uint8Array,
  '<i1': Int8Array,
  '<u2': Uint16Array,
  '<i2': Int16Array,
  '<u4': Uint32Array,
  '<i4': Int32Array,
  '<f4': Float32Array,
  '<f2': Float16Array,
  '<f8': Float64Array,
  '>b': Int8Array,
  '>B': Uint8Array,
  '>u1': Uint8Array,
  '>i1': Int8Array,
  '>u2': Uint16Array,
  '>i2': Int16Array,
  '>u4': Uint32Array,
  '>i4': Int32Array,
  '>f4': Float32Array,
  '>f2': Float16Array,
  '>f8': Float64Array
};

export function getTypedArrayCtr(dtype: DtypeString) {
  const ctr = DTYPE_TYPEDARRAY_MAPPING[dtype];
  if (!ctr) {
    if (dtype.slice(1) === 'f2') {
      throw Error(
        `'${dtype}' is not supported natively in zarr.js. ` +
        `In order to access this dataset you must make Float16Array available as a global. ` +
        `See https://github.com/gzuidhof/zarr.js/issues/127`
      );
    }
    throw Error(`Dtype not recognized or not supported in zarr.js, got ${dtype}.`);
  }
  return ctr;
}

/*
 * Called by NestedArray and RawArray constructors only.
 * We byte-swap the buffer of a store after decoding
 * since TypedArray views are little endian only.
 *
 * This means NestedArrays and RawArrays will always be little endian,
 * unless a numpy-like library comes around and can handle endianess
 * for buffer views.
 */
export function getTypedArrayDtypeString(t: TypedArray): DtypeString {
  // Favour the types below instead of small and big B
  if (t instanceof Uint8Array) return '|u1';
  if (t instanceof Int8Array) return '|i1';
  if (t instanceof Uint16Array) return '<u2';
  if (t instanceof Int16Array) return '<i2';
  if (t instanceof Uint32Array) return '<u4';
  if (t instanceof Int32Array) return '<i4';
  if (t instanceof Float32Array) return '<f4';
  if (t instanceof Float64Array) return '<f8';
  throw new ValueError('Mapping for TypedArray to Dtypestring not known');
}
