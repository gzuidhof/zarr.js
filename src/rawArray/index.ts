import { DtypeString } from '../types';
import { ArraySelection } from '../core/types';
import { slice } from '../core/slice';
import { ValueError } from '../errors';
import { normalizeShape, IS_NODE, getStrides } from '../util';
import { TypedArray, DTYPE_TYPEDARRAY_MAPPING, getTypedArrayDtypeString, TypedArrayConstructor } from '../nestedArray/types';
import { setRawArray } from './ops';

export class RawArray {
    dtype: DtypeString;
    shape: number[];
    strides: number[];
    data: TypedArray;

    constructor(data: TypedArray, shape?: number | number[], dtype?: DtypeString, strides?: number[])
    constructor(data: Buffer | ArrayBuffer | null, shape: number | number[], dtype: DtypeString, strides?: number[])
    constructor(data: Buffer | ArrayBuffer | TypedArray | null, shape?: number | number[], dtype?: DtypeString, strides?: number[]) {
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
            this.data = new DTYPE_TYPEDARRAY_MAPPING[dtype](1);
        } else if (
            // tslint:disable-next-line: strict-type-predicates
            (IS_NODE && Buffer.isBuffer(data))
            || data instanceof ArrayBuffer
            || data === null
            || data.toString().startsWith("[object ArrayBuffer]") // Necessary for Node.js for some reason..
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
            const typeConstructor: TypedArrayConstructor<TypedArray> = DTYPE_TYPEDARRAY_MAPPING[dtype];
            this.data = new typeConstructor(data as ArrayBuffer);
        } else {
            this.data = data;
        }
    }

    public set(selection: ArraySelection = null, value: RawArray) {
        if (selection === null) {
            selection = [slice(null)];
        }

        if (typeof value === "number") {
            if (this.shape.length === 0) {
                // Zero dimension array..
                this.data[0] = value;
            } else {
                this.data.fill(value);
            }
        } else {
            setRawArray(this.data, this.strides, value.data, value.strides, this.shape, selection);
        }
    }
}


