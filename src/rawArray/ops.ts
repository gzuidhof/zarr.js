import { ArraySelection, SliceIndices } from '../core/types';
import { normalizeArraySelection, selectionToSliceIndices } from '../core/indexing';
import { TypedArray } from '../nestedArray/types';

export function setRawArrayDirect(dstArr: TypedArray, dstStrides: number[], dstShape: number[], dstSelection: number | ArraySelection, sourceArr: TypedArray, sourceStrides: number[], sourceShape: number[], sourceSelection: number | ArraySelection) {
    // This translates "...", ":", null, etc into a list of slices.
    const normalizedDstSelection = normalizeArraySelection(dstSelection, dstShape, false);
    const [dstSliceIndices] = selectionToSliceIndices(normalizedDstSelection, dstShape);

    const normalizedSourceSelection = normalizeArraySelection(sourceSelection, sourceShape, false);
    const [sourceSliceIndicies] = selectionToSliceIndices(normalizedSourceSelection, sourceShape);

    _setRawArrayDirect(dstArr, dstStrides, 0, dstSliceIndices as SliceIndices[], sourceArr, sourceStrides, 0, sourceSliceIndicies);
}

function _setRawArrayDirect(dstArr: TypedArray, dstStrides: number[], dstOffset: number, dstSelection: SliceIndices[], sourceArr: TypedArray, sourceStrides: number[], sourceOffset: number, sourceSelection: (SliceIndices | number)[]) {
    if (sourceSelection.length === 0) {
        // Case when last source dimension is squeezed
        dstArr[dstOffset] = sourceArr[sourceOffset];
        return;
    }

    const currentDstSlice = dstSelection[0];
    const currentSourceSlice = sourceSelection[0];

    // This source dimension is squeezed
    if (typeof currentSourceSlice === "number") {
        /*
        Sets dimension offset for squeezed dimension.

        Ex. if 0th dimension is squeezed to 2nd index (numpy : arr[2,i])

            sourceArr[stride[0]* 2 + i] --> next sourceOffset === stride[0] * 2

        Thus, subsequent squeezed dims are appended to the source offset.

        Ex. in numpy : arr[0,2,:]

            sourceArr and sourceOffset recursion:

            Call 0: sourceOffset === stride[0] * 0
            Call 1: sourceOffset === stride[0] * 0 + stride[1] * 2
            Call 2: Fill sourceArr[sourceOffset]

        */
        _setRawArrayDirect(
            // Don't need to change destination offset, just source
            dstArr, dstStrides, dstOffset, dstSelection,
            sourceArr,
            sourceStrides.slice(1),
            sourceOffset + sourceStrides[0] * currentSourceSlice,
            sourceSelection.slice(1),
        );
        return;
    }

    const [from, , , outputSize] = currentDstSlice;
    const [sfrom] = currentSourceSlice; // Will always be subset of dst, so don't need output size

    if (dstStrides.length === 1 && sourceStrides.length === 1) {
        for (let i = 0; i < outputSize; i++) {
            dstArr[dstOffset + dstStrides[0] * (from + i)] = sourceArr[sourceOffset + sourceStrides[0] * (sfrom + i)];
        }
        return;
    }

    for (let j = 0; j < outputSize; j++) {
        // Apply strides as above, using both destination and source-specific strides.
        _setRawArrayDirect(
            dstArr,
            dstStrides.slice(1),
            dstOffset + dstStrides[0] * (from + j),
            dstSelection.slice(1),
            sourceArr,
            sourceStrides.slice(1),
            sourceOffset + sourceStrides[0] * (sfrom + j),
            sourceSelection.slice(1),
        );
    }
}