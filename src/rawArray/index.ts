import { DtypeString } from '../types';
import { ArraySelection } from '../core/types';
import { slice } from '../core/slice';
import { ValueError } from '../errors';
import { normalizeShape, IS_NODE, getStrides, isArrayBufferLike } from '../util';
import { TypedArray, getTypedArrayCtr, getTypedArrayDtypeString, TypedArrayConstructor } from '../nestedArray/types';
import { setRawArrayFromChunkItem, setRawArrayToScalar, setRawArray } from './ops';
import { type } from 'os';

export class RawArray {
    dtype: DtypeString;
    shape: number[];
    strides: number[];
    data: TypedArray;

    constructor(data: TypedArray, shape?: number | number[], dtype?: DtypeString, strides?: number[])
    constructor(data: Buffer | ArrayBufferLike | null, shape?: number | number[], dtype?: DtypeString, strides?: number[])
    constructor(data: Buffer | ArrayBufferLike | TypedArray | null, shape?: number | number[], dtype?: DtypeString, strides?: number[]) {
        const dataIsTypedArray = data !== null && !!(data as TypedArray).BYTES_PER_ELEMENT;

        if (shape === undefined) {
            if (!dataIsTypedArray) {
                throw new ValueError("Shape argument is required unless you pass in a TypedArray");
            }
            shape = [(data as TypedArray).length];
        }
        shape = normalizeShape(shape);

        if (dtype === undefined) {
            if (!dataIsTypedArray) {
                throw new ValueError("Dtype argument is required unless you pass in a TypedArray");
            }
            dtype = getTypedArrayDtypeString(data as TypedArray);
        }

        if (strides === undefined) {
            strides = getStrides(shape);
        }

        this.shape = shape;
        this.dtype = dtype;
        this.strides = strides;

        if (dataIsTypedArray && shape.length !== 1) {
            data = (data as TypedArray).buffer;
        }

        // Zero dimension array.. they are a bit weirdly represented now, they will only ever occur internally
        if (this.shape.length === 0) {
            this.data = new (getTypedArrayCtr(dtype))(1);
        } else if (
            // tslint:disable-next-line: strict-type-predicates
            (IS_NODE && Buffer.isBuffer(data))
            || isArrayBufferLike(data)
            || data === null
        ) {
            // Create from ArrayBuffer or Buffer
            const numShapeElements = shape.reduce((x, y) => x * y, 1);

            if (data === null) {
                data = new ArrayBuffer(numShapeElements * parseInt(dtype[dtype.length - 1], 10));
            }

            const numDataElements = (data as ArrayBuffer).byteLength / parseInt(dtype[dtype.length - 1], 10);
            if (numShapeElements !== numDataElements) {
                throw new Error(`Buffer has ${numDataElements} of dtype ${dtype}, shape is too large or small ${shape} (flat=${numShapeElements})`);
            }
            const typeConstructor: TypedArrayConstructor<TypedArray> = getTypedArrayCtr(dtype);
            this.data = new typeConstructor(data as ArrayBuffer);
        } else {
            this.data = data;
        }
    }

    public set(selection: ArraySelection, value: RawArray | number): void;
    public set(selection: ArraySelection, chunk: RawArray, chunkSelection: ArraySelection): void;
    public set(selection: ArraySelection = null, value: RawArray | number, chunkSelection?: ArraySelection) {
        if (selection === null) {
            selection = [slice(null)];
        }
        if (typeof value === "number") {
            if (this.shape.length === 0) {
                // Zero dimension array..
                this.data[0] = value;
            } else {
                setRawArrayToScalar(this.data, this.strides, this.shape, selection, value);
            }
        } else if (value instanceof RawArray && chunkSelection) {
            // Copy directly from decoded chunk to destination array
            setRawArrayFromChunkItem(this.data, this.strides, this.shape, selection, value.data, value.strides, value.shape, chunkSelection);
        } else {
            setRawArray(this.data, this.strides, this.shape, selection, value.data, value.strides, value.shape);
        }
    }
}


