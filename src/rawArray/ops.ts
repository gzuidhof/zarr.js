import { ArraySelection, SliceIndices } from '../core/types';
import { ValueError } from '../errors';
import { normalizeArraySelection, selectionToSliceIndices } from '../core/indexing';
import { TypedArray } from '../nestedArray/types';

export function setRawArray(dstArr: TypedArray, dstStrides: number[], dstShape: number[], dstSelection: number | ArraySelection, sourceArr: TypedArray, sourceStrides: number[], sourceShape: number[], sourceSelection: number | ArraySelection) {
    // This translates "...", ":", null, etc into a list of slices.
    const normalizedDstSelection = normalizeArraySelection(dstSelection, dstShape, false);
    const [dstSliceIndices, outShape] = selectionToSliceIndices(normalizedDstSelection, dstShape);

    const normalizedSourceSelection = normalizeArraySelection(sourceSelection, sourceShape, false);
    const [sourceSliceIndicies, sShape] = selectionToSliceIndices(normalizedSourceSelection, sourceShape);

    _setRawArray(dstArr, dstStrides, 0, dstSliceIndices, dstShape, sourceArr, sourceStrides, 0, sourceSliceIndicies);
}

function _setRawArray(dstArr: TypedArray, dstStrides: number[], dstOffset: number, dstSelection: (SliceIndices | number)[], dstShape: number[], sourceArr: TypedArray, sourceStrides: number[], sourceOffset: number, sourceSelection: (SliceIndices | number)[]) {
    const currentDstSlice = dstSelection[0];
    const currentSourceSlice = sourceSelection[0];

    // This destination dimension is squeezed
    if (typeof currentDstSlice === "number") {
        _setRawArray(
            dstArr,
            dstStrides.slice(1),
            dstOffset + dstStrides[0] * currentDstSlice,
            dstSelection.slice(1),
            dstShape.slice(1),
            sourceArr,
            sourceStrides,
            sourceOffset,
            sourceSelection,
        );
        return;
    }

    // This source dimension is squeezed
    if (typeof currentSourceSlice === "number") {
        _setRawArray(
            dstArr,
            dstStrides,
            dstOffset,
            dstSelection,
            dstShape,
            sourceArr,
            sourceStrides.slice(1),
            sourceOffset + sourceStrides[0] * currentSourceSlice,
            sourceSelection.slice(1),
        );
        return;
    }

    const [from, _to, step, outputSize] = currentDstSlice;
    const [sfrom, _sto, sstep, soutputSize] = currentSourceSlice;

    if (dstShape.length === 1) {
        for (let i = 0; i < outputSize; i++) {
            dstArr[dstOffset + from + i] = sourceArr[sourceOffset + sfrom + i];
        }
        return;
    }

    for (let j = 0; j < outputSize; j++) {
        _setRawArray(
            dstArr,
            dstStrides.slice(1),
            dstOffset + dstStrides[0] * (from + j),
            dstSelection.slice(1),
            dstShape.slice(1),
            sourceArr,
            sourceStrides.slice(1),
            sourceOffset + sourceStrides[0] * (sfrom + j),
            sourceSelection.slice(1),
        );
    }
}