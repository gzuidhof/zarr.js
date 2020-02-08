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

    _setRawArray(dstArr, dstStrides, 0, sourceArr, sourceStrides, 0, dstShape, dstSliceIndices, sourceSliceIndicies);
}

function _setRawArray(dstArr: TypedArray, dstStrides: number[], dstOffset: number, sourceArr: TypedArray | number, sourceStrides: number[], sourceOffset: number, shape: number[], selection: (SliceIndices | number)[], sourceSelection: (SliceIndices | number)[]) {
    const currentDstSlice = selection[0];
    const currentSourceSlice = sourceSelection[0];


    if (typeof sourceArr === "number") {
        console.warn("setting selection to scalar not yet implemented");
        return;
    }

    if (typeof currentDstSlice === "number" || typeof currentSourceSlice === "number") {
        console.warn("setting single index not implemented.");
        return;
    }

    const [from, _to, step, outputSize] = currentDstSlice;
    const [sfrom, _sto, sstep, soutputSize] = currentSourceSlice;

    if (shape.length === 1) {
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
            sourceArr,
            sourceStrides.slice(1),
            sourceOffset + sourceStrides[0] * (sfrom + j),
            shape.slice(1),
            selection.slice(1),
            sourceSelection.slice(1),
        );
    }
}