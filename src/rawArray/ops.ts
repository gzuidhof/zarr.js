import { ArraySelection, SliceIndices } from '../core/types';
import { ValueError } from '../errors';
import { normalizeArraySelection, selectionToSliceIndices } from '../core/indexing';
import { TypedArray } from '../nestedArray/types';

export function setRawArray(dstArr: TypedArray, dstStrides: number[], sourceArr: TypedArray, sourceStrides: number[], destShape: number[], selection: number | ArraySelection) {
    // This translates "...", ":", null, etc into a list of slices.
    const normalizedSelection = normalizeArraySelection(selection, destShape, false);
    const [sliceIndices, outShape] = selectionToSliceIndices(normalizedSelection, destShape);
    _setRawArray(dstArr, dstStrides, 0, sourceArr, sourceStrides.slice(1), 0, destShape, sliceIndices);
}

function _setRawArray(dstArr: TypedArray, dstStrides: number[], dstOffset: number, sourceArr: TypedArray | number, sourceStrides: number[], sourceOffset: number, shape: number[], selection: (SliceIndices | number)[]) {
    const currentSlice = selection[0];

    if (typeof sourceArr === "number") {
        console.warn("setting selection to scalar not yet implemented");
        return;
    }

    if (typeof currentSlice === "number") {
        console.warn("setting single index not implemented.");
        return;
    }

    const [from, _to, step, outputSize] = currentSlice;

    if (shape.length === 1) {
        for (let j = 0; j < outputSize; j++) {
            console.log(sourceArr[sourceOffset + j]);
            dstArr[from + dstOffset + j] = sourceArr[sourceOffset + j];
        }
        return;
    }

    for (let i = 0; i < outputSize; i++) {
        _setRawArray(
            dstArr,
            dstStrides.slice(1),
            dstOffset + i * dstStrides[0],
            sourceArr,
            sourceStrides.slice(1),
            sourceOffset + i * sourceStrides[0],
            shape.slice(1),
            selection.slice(1)
        );
    }
}