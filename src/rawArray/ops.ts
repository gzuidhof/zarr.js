import { ArraySelection, SliceIndices } from '../core/types';
import { ValueError } from '../errors';
import { normalizeArraySelection, selectionToSliceIndices } from '../core/indexing';
import { TypedArray, TypedArrayConstructor } from '../nestedArray/types';

// TODO
// export function setRawArrayToScalar<T extends TypedArray>(dstArr: NestedArrayData, value: number, destShape: number[], selection: number | ArraySelection) {
//     // This translates "...", ":", null, etc into a list of slices.
//     const normalizedSelection = normalizeArraySelection(selection, destShape, true);

//     // Above we force the results to be SliceIndicesIndices only, without integer selections making this cast is safe.
//     const [sliceIndices, _outShape] = selectionToSliceIndices(normalizedSelection, destShape) as [SliceIndices[], number[]];
//     _setNestedArrayToScalar(dstArr, value, destShape, sliceIndices);
// }

export function setRawArray<T extends TypedArray>(dstArr: TypedArray, sourceArr: TypedArray, destShape: number[], selection: number | ArraySelection) {
    // This translates "...", ":", null, etc into a list of slices.
    const normalizedSelection = normalizeArraySelection(selection, destShape, false);
    const [sliceIndices, outShape] = selectionToSliceIndices(normalizedSelection, destShape);
    console.log(sliceIndices, outShape);
    // _setRawArray(dstArr, sourceArr, destShape, sliceIndices);
}


// function _setRawArray<T extends TypedArray>(dstArr: NestedArrayData, sourceArr: NestedArrayData | number, shape: number[], selection: (SliceIndices | number)[]) {

//     const currentSlice = selection[0];

//     if (typeof sourceArr === "number") {
//         _setNestedArrayToScalar(dstArr, sourceArr, shape, selection.map(x => typeof x === "number" ? [x, x + 1, 1, 1] : x));
//         return;
//     }

//     // This dimension is squeezed.
//     if (typeof currentSlice === "number") {
//         _setNestedArray((dstArr as NDNestedArrayData)[currentSlice], sourceArr, shape.slice(1), selection.slice(1));
//         return;
//     }

//     const [from, _to, step, outputSize] = currentSlice;

//     if (shape.length === 1) {
//         if (step === 1) {
//             (dstArr as TypedArray).set(sourceArr as TypedArray, from);
//             return;
//         }

//         for (let i = 0; i < outputSize; i++) {
//             dstArr[from + i * step] = (sourceArr)[i];
//         }
//         return;
//     }

//     for (let i = 0; i < outputSize; i++) {
//         _setNestedArray((dstArr as NDNestedArrayData)[from + i * step], (sourceArr as NDNestedArrayData)[i], shape.slice(1), selection.slice(1));
//     }
// }

// function _setNestedArrayToScalar<T extends TypedArray>(dstArr: NestedArrayData, value: number, shape: number[], selection: SliceIndices[]) {
//     const currentSlice = selection[0];

//     const [from, to, step, outputSize] = currentSlice;

//     if (shape.length === 1) {
//         if (step === 1) {
//             (dstArr as TypedArray).fill(value, from, to);
//             return;
//         }

//         for (let i = 0; i < outputSize; i++) {
//             dstArr[from + i * step] = value;
//         }
//         return;
//     }

//     for (let i = 0; i < outputSize; i++) {
//         _setNestedArrayToScalar((dstArr as NDNestedArrayData)[from + i * step], value, shape.slice(1), selection.slice(1));
//     }
// }

// export function flattenNestedArray(arr: NestedArrayData, shape: number[], constr?: TypedArrayConstructor<TypedArray>): TypedArray {
//     if (constr === undefined) {
//         constr = getNestedArrayConstructor(arr);
//     }
//     const size = shape.reduce((x, y) => x * y, 1);
//     const outArr = new constr(size);

//     _flattenNestedArray(arr, shape, outArr, 0);

//     return outArr;
// }

// function _flattenNestedArray(arr: NestedArrayData, shape: number[], outArr: TypedArray, offset: number) {
//     if (shape.length === 1) {
//         // This is only ever reached if called with rank 1 shape, never reached through recursion.
//         // We just slice set the array directly from one level above to save some function calls.
//         outArr.set((arr as TypedArray), offset);
//         return;
//     }

//     if (shape.length === 2) {
//         for (let i = 0; i < shape[0]; i++) {
//             outArr.set((arr as TypedArray[])[i], offset + shape[1] * i);
//         }
//         return arr;
//     }

//     const nextShape = shape.slice(1);
//     // Small optimization possible here: this can be precomputed for different levels of depth and passed on.
//     const mult = nextShape.reduce((x, y) => x * y, 1);

//     for (let i = 0; i < shape[0]; i++) {
//         _flattenNestedArray((arr as NDNestedArrayData)[i], nextShape, outArr, offset + mult * i);
//     }
//     return arr;
// }