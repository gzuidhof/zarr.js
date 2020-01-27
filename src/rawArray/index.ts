import { DtypeString } from '../types';
import { ArraySelection, Slice } from '../core/types';
import { slice } from '../core/slice';
import { ValueError } from '../errors';
import { normalizeShape, IS_NODE } from '../util';
import { TypedArray, DTYPE_TYPEDARRAY_MAPPING, getTypedArrayDtypeString, TypedArrayConstructor } from '../nestedArray/types';

// private setTypedArray(outSelection: DimensionSelection[], dstArr: TypedArray, value: TypedArray | number) {
//     return;
//     // dstArr.fill(value, from, to);
//   }

export class RawArray {
    dtype: DtypeString;
    shape: number[];
    data: TypedArray;

    constructor(data: TypedArray, shape?: number | number[], dtype?: DtypeString)
    constructor(data: Buffer | ArrayBuffer | null, shape: number | number[], dtype: DtypeString)
    constructor(data: Buffer | ArrayBuffer | TypedArray | null, shape?: number | number[], dtype?: DtypeString) {
        const dataIsTypedArray = data !== null && !!(data as TypedArray).BYTES_PER_ELEMENT;

        if (shape === undefined) {
            if (!dataIsTypedArray) {
                throw new ValueError("Shape argument is required unless you pass in a TypedArray");
            }
            shape = [(data as TypedArray).length];
        }

        if (dtype === undefined) {
            if (!dataIsTypedArray) {
                throw new ValueError("Dtype argument is required unless you pass in a TypedArray");
            }
            dtype = getTypedArrayDtypeString(data as TypedArray);
        }

        shape = normalizeShape(shape);
        this.shape = shape;
        this.dtype = dtype;

        if (dataIsTypedArray && shape.length !== 1) {
            data = (data as TypedArray).buffer;
        }

        else if (
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
            const size = shape.reduce((x, y) => x * y, 1);
            this.data = new typeConstructor(size);
        } else {
            this.data = data;
        }
    }

    public set(selection: ArraySelection = null, value: ArrayBuffer | number) {
        if (selection === null) {
            selection = [slice(null)];
        }
        if (typeof value === "number") {
            if (this.shape.length === 0) {
                // Zero dimension array..
                this.data[0] = value;
            } else {
                setNestedArrayToScalar(this.data, value, this.shape, selection);
            }
        } else {
            setNestedArray(this.data, value.data, this.shape, value.shape, selection);
        }
    }
}


