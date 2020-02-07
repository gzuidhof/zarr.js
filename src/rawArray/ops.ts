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

export function setRawArray(dstArr: TypedArray, strides: number[] | number, sourceArr: TypedArray, destShape: number[], destStrides: number[], selection: number | ArraySelection) {
    // This translates "...", ":", null, etc into a list of slices.
    const normalizedSelection = normalizeArraySelection(selection, destShape, false);
    const [sliceIndices, outShape] = selectionToSliceIndices(normalizedSelection, destShape);
    console.log(dstArr);
    console.log(sourceArr);
    _setRawArray(dstArr, strides, sourceArr, destShape, sliceIndices);
}

function _setRawArray(dstArr: TypedArray, strides: number[] | number, sourceArr: TypedArray | number, shape: number[], selection: (SliceIndices | number)[]) {
    const currentSlice = selection[0];

    if (typeof sourceArr === "number") {
        console.warn("setting selection to scalar not yet implemented");
        return;
    }

    if (typeof currentSlice === "number") {
        _setRawArray(dstArr, strides, sourceArr, shape.slice(1), selection.slice(1));
        return;
    }

    if (typeof strides === "number") console.log('not implemented yet');

    const [from, _to, step, outputSize] = currentSlice;
    console.log(currentSlice, outputSize);

    if (shape.length === 1) {
        if (step === 1) {
            dstArr.set(sourceArr, from);
            return;
        }

        for (let i = 0; i < outputSize; i++) {
            dstArr[from + i * step] = (sourceArr)[i];
        }
        return;
    }

    for (let i = 0; i < outputSize; i++) {
        _setRawArray(dstArr, strides.slice(1), sourceArr, shape.slice(1), selection.slice(1));
    }
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