import { DtypeString } from '../types';
import { ND, TypedArray, TypedArrayConstructor } from './types';


const dtypeMapping = {
    "<i4": Int32Array
};


export class NDimArray<T extends TypedArray> {
    dtype: DtypeString;
    shape: number[];
    data: ND<T>;

    constructor(data: Buffer | ArrayBuffer, shape: number[], dtype: DtypeString) {
        this.shape = shape;
        this.dtype = dtype;

        const numShapeElements = shape.reduce((x, y) => x * y, 1);
        const numDataElements = data.byteLength / parseInt(dtype[dtype.length - 1], 10);
        if (numShapeElements !== numDataElements) {
            throw new Error(`Buffer has ${numDataElements} of dtype ${dtype}, shape is too large or small ${shape} (flat=${numShapeElements})`);
        }

        const typeConstructor: TypedArrayConstructor<T> = dtypeMapping[dtype];
        if (shape.length <= 1) {
            this.data = new typeConstructor(data);
        } else {
            this.data = createNDimensionalArray(data, typeConstructor, shape);
        }

    }


}

function createNDimensionalArray<T extends TypedArray>(data: Buffer | ArrayBuffer, t: TypedArrayConstructor<T>, shape: number[], offset = 0): ND<T> {
    const arr = new Array<any>(shape[0]);
    const nextShape = shape.slice(1);
    if (nextShape.length === 1) {
        for (let i = 0; i < shape[0]; i++) {
            arr[i] = new t(data.slice(offset + shape[0] * i, offset + shape[0] * (i + 1)));
        }
        return arr;
    }

    for (let i = 0; i < shape[0]; i++) {
        arr[i] = createNDimensionalArray(data, t, nextShape, offset + shape[0] * i);
    }

    return arr;

}