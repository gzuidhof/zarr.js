import { ArraySelection, SliceIndices } from '../core/types';
import { normalizeArraySelection, selectionToSliceIndices } from '../core/indexing';
import { TypedArray } from '../nestedArray/types';

export function setRawArrayToScalar(dstArr: TypedArray, dstStrides: number[], dstShape: number[], dstSelection: number | ArraySelection, value: number) {
    // This translates "...", ":", null, etc into a list of slices.
    const normalizedSelection = normalizeArraySelection(dstSelection, dstShape, true);
    const [sliceIndices] = selectionToSliceIndices(normalizedSelection, dstShape);
    // Above we force the results to be SliceIndicesIndices only, without integer selections making this cast is safe.
    _setRawArrayToScalar(value, dstArr, dstStrides, sliceIndices as SliceIndices[]);
}

export function setRawArrayDirect(dstArr: TypedArray, dstStrides: number[], dstShape: number[], dstSelection: number | ArraySelection, sourceArr: TypedArray, sourceStrides: number[], sourceShape: number[], sourceSelection: number | ArraySelection) {
    // This translates "...", ":", null, etc into a list of slices.
    const normalizedDstSelection = normalizeArraySelection(dstSelection, dstShape, true);
    // Above we force the results to be dstSliceIndices only, without integer selections making this cast is safe.
    const [dstSliceIndices] = selectionToSliceIndices(normalizedDstSelection, dstShape);

    const normalizedSourceSelection = normalizeArraySelection(sourceSelection, sourceShape, false);
    const [sourceSliceIndicies] = selectionToSliceIndices(normalizedSourceSelection, sourceShape);

    _setRawArrayDirect(dstArr, dstStrides, 0, dstSliceIndices as SliceIndices[], sourceArr, sourceStrides, 0, sourceSliceIndicies);
}

function _setRawArrayDirect(dstArr: TypedArray, dstStrides: number[], dstOffset: number, dstSliceIndices: SliceIndices[], sourceArr: TypedArray, sourceStrides: number[], sourceOffset: number, sourceSliceIndicies: (SliceIndices | number)[]) {
    if (sourceSliceIndicies.length === 0) {
        // Case when last source dimension is squeezed
        dstArr[dstOffset] = sourceArr[sourceOffset];
        return;
    }

    // Get current indicies and strides for both destination and source arrays
    const [currentDstSlice, ...nextDstSliceIndicies] = dstSliceIndices;
    const [currentSourceSlice, ...nextSourceSliceIndicies] = sourceSliceIndicies;

    const [currentDstStride, ...nextDstStrides] = dstStrides;
    const [currentSourceStride, ...nextSourceStrides] = sourceStrides;

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
            // Don't update destination offset/slices, just source
            dstArr, dstStrides, dstOffset, dstSliceIndices,
            sourceArr,
            nextSourceStrides,
            sourceOffset + currentSourceStride * currentSourceSlice,
            nextSourceSliceIndicies,
        );
        return;
    }

    const [from, _to, step, outputSize] = currentDstSlice; // just need start and size
    const [sfrom, _sto, sstep, _soutputSize] = currentSourceSlice; // Will always be subset of dst, so don't need output size just start

    if (dstStrides.length === 1 && sourceStrides.length === 1) {
        if (step === 1 && currentDstStride === 1 && sstep === 1 && currentSourceStride === 1) {
            const subView = sourceArr.subarray(sourceOffset + sfrom, sourceOffset + sfrom + outputSize);
            dstArr.set(subView, dstOffset + from);
            return;
        }

        for (let i = 0; i < outputSize; i++) {
            dstArr[dstOffset + currentDstStride * (from + (step * i))] = sourceArr[sourceOffset + currentSourceStride * (sfrom + (sstep * i))];
        }
        return;
    }

    for (let i = 0; i < outputSize; i++) {
        // Apply strides as above, using both destination and source-specific strides.
        _setRawArrayDirect(
            dstArr,
            nextDstStrides,
            dstOffset + currentDstStride * (from + (i * step)),
            nextDstSliceIndicies,
            sourceArr,
            nextSourceStrides,
            sourceOffset + currentSourceStride * (sfrom + (i * sstep)),
            nextSourceSliceIndicies,
        );
    }
}

function _setRawArrayToScalar(value: number, dstArr: TypedArray, dstStrides: number[], dstSliceIndices: SliceIndices[], dstOffset = 0) {
    const [currentDstSlice, ...nextDstSliceIndicies] = dstSliceIndices;
    const [currentDstStride, ...nextDstStrides] = dstStrides;

    const [from, _to, step, outputSize] = currentDstSlice;

    if (dstStrides.length === 1) {
        for (let i = 0; i < outputSize; i++) {
            dstArr[dstOffset + currentDstStride * (from + (step * i))] = value;
        }
        return;
    }

    for (let i = 0; i < outputSize; i++) {
        _setRawArrayToScalar(
            value,
            dstArr,
            nextDstStrides,
            nextDstSliceIndicies,
            dstOffset + currentDstStride * (from + (step * i))
        );
    }
}