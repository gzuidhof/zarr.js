import { ArraySelection, SliceIndices } from '../core/types';
import { normalizeArraySelection, selectionToSliceIndices } from '../core/indexing';
import { ValueError } from '../errors';
import { TypedArray } from '../nestedArray/types';

export function setRawArrayToScalar(dstArr: TypedArray, dstStrides: number[], dstShape: number[], dstSelection: number | ArraySelection, value: number | bigint) {
    // This translates "...", ":", null, etc into a list of slices.
    const normalizedSelection = normalizeArraySelection(dstSelection, dstShape, true);
    const [sliceIndices] = selectionToSliceIndices(normalizedSelection, dstShape);
    // Above we force the results to be SliceIndicesIndices only, without integer selections making this cast is safe.
    _setRawArrayToScalar(value, dstArr, dstStrides, sliceIndices as SliceIndices[]);
}

export function setRawArray(dstArr: TypedArray, dstStrides: number[], dstShape: number[], dstSelection: number | ArraySelection, sourceArr: TypedArray, sourceStrides: number[], sourceShape: number[]): void {
    // This translates "...", ":", null, etc into a list of slices.
    const normalizedDstSelection = normalizeArraySelection(dstSelection, dstShape, false);
    const [dstSliceIndices, outShape] = selectionToSliceIndices(normalizedDstSelection, dstShape);

    // TODO: replace with non stringify equality check
    if (JSON.stringify(outShape) !== JSON.stringify(sourceShape)) {
        throw new ValueError(`Shape mismatch in target and source RawArray: ${outShape} and ${sourceShape}`);
    }

    _setRawArray(dstArr, dstStrides, dstSliceIndices, sourceArr, sourceStrides);
}

export function setRawArrayFromChunkItem(dstArr: TypedArray, dstStrides: number[], dstShape: number[], dstSelection: number | ArraySelection, sourceArr: TypedArray, sourceStrides: number[], sourceShape: number[], sourceSelection: number | ArraySelection) {
    // This translates "...", ":", null, etc into a list of slices.
    const normalizedDstSelection = normalizeArraySelection(dstSelection, dstShape, true);
    // Above we force the results to be dstSliceIndices only, without integer selections making this cast is safe.
    const [dstSliceIndices] = selectionToSliceIndices(normalizedDstSelection, dstShape);

    const normalizedSourceSelection = normalizeArraySelection(sourceSelection, sourceShape, false);
    const [sourceSliceIndicies] = selectionToSliceIndices(normalizedSourceSelection, sourceShape);

    // TODO check to ensure chunk and dest selection are same shape?
    // As is, this only gets called in ZarrArray.getRaw where this condition should be ensured, and check might hinder performance.

    _setRawArrayFromChunkItem(dstArr, dstStrides, dstSliceIndices as SliceIndices[], sourceArr, sourceStrides, sourceSliceIndicies);
}

function _setRawArrayToScalar(value: number | bigint, dstArr: TypedArray, dstStrides: number[], dstSliceIndices: SliceIndices[]) {
    const [currentDstSlice, ...nextDstSliceIndices] = dstSliceIndices;
    const [currentDstStride, ...nextDstStrides] = dstStrides;

    const [from, _to, step, outputSize] = currentDstSlice;

    if (dstStrides.length === 1) {
        if (step === 1 && currentDstStride === 1) {
            dstArr.fill(value as never, from, from + outputSize);
        } else {
            for (let i = 0; i < outputSize; i++) {
                type underlyingNumeric = typeof dstArr[number];
                dstArr[currentDstStride * (from + (step * i))] = value as underlyingNumeric;
            }
        }
        return;
    }

    for (let i = 0; i < outputSize; i++) {
        _setRawArrayToScalar(
            value,
            dstArr.subarray(currentDstStride * (from + (step * i))),
            nextDstStrides,
            nextDstSliceIndices,
        );
    }
}

function _setRawArray(dstArr: TypedArray, dstStrides: number[], dstSliceIndices: (number | SliceIndices)[], sourceArr: TypedArray, sourceStrides: number[]) {
    type underlyingNumeric = typeof sourceArr[number];
    if (dstSliceIndices.length === 0) {
        const values: any = (sourceArr as ArrayLike<underlyingNumeric>);
        dstArr.set(values);
        return;
    }

    const [currentDstSlice, ...nextDstSliceIndices] = dstSliceIndices;
    const [currentDstStride, ...nextDstStrides] = dstStrides;

    // This dimension is squeezed.
    if (typeof currentDstSlice === "number") {
        _setRawArray(
            dstArr.subarray(currentDstSlice * currentDstStride),
            nextDstStrides,
            nextDstSliceIndices,
            sourceArr,
            sourceStrides
        );
        return;
    }

    const [currentSourceStride, ...nextSourceStrides] = sourceStrides;
    const [from, _to, step, outputSize] = currentDstSlice;

    if (dstStrides.length === 1) {
        if (step === 1 && currentDstStride === 1 && currentSourceStride === 1) {
            const values: any = sourceArr.subarray(0, outputSize) as ArrayLike<underlyingNumeric>;
            dstArr.set(values, from);
        } else {
            for (let i = 0; i < outputSize; i++) {
                dstArr[currentDstStride * (from + (step * i))] = sourceArr[currentSourceStride * i];
            }
        }
        return;
    }

    for (let i = 0; i < outputSize; i++) {
        // Apply strides as above, using both destination and source-specific strides.
        _setRawArray(
            dstArr.subarray(currentDstStride * (from + (i * step))),
            nextDstStrides,
            nextDstSliceIndices,
            sourceArr.subarray(currentSourceStride * i),
            nextSourceStrides
        );
    }
}

function _setRawArrayFromChunkItem(dstArr: TypedArray, dstStrides: number[], dstSliceIndices: SliceIndices[], sourceArr: TypedArray, sourceStrides: number[], sourceSliceIndices: (SliceIndices | number)[]) {
    type underlyingNumeric = typeof sourceArr[number];
    if (sourceSliceIndices.length === 0) {
        // Case when last source dimension is squeezed
        const values: any = sourceArr.subarray(0, dstArr.length) as ArrayLike<underlyingNumeric>;
        dstArr.set(values);
        return;
    }

    // Get current indicies and strides for both destination and source arrays
    const [currentDstSlice, ...nextDstSliceIndices] = dstSliceIndices;
    const [currentSourceSlice, ...nextSourceSliceIndices] = sourceSliceIndices;

    const [currentDstStride, ...nextDstStrides] = dstStrides;
    const [currentSourceStride, ...nextSourceStrides] = sourceStrides;

    // This source dimension is squeezed
    if (typeof currentSourceSlice === "number") {
        /*
        Sets dimension offset for squeezed dimension.

        Ex. if 0th dimension is squeezed to 2nd index (numpy : arr[2,i])

            sourceArr[stride[0]* 2 + i] --> sourceArr.subarray(stride[0] * 2)[i] (sourceArr[i] in next call)

        Thus, subsequent squeezed dims are appended to the source offset.
        */
        _setRawArrayFromChunkItem(
            // Don't update destination offset/slices, just source
            dstArr, dstStrides, dstSliceIndices,
            sourceArr.subarray(currentSourceStride * currentSourceSlice),
            nextSourceStrides,
            nextSourceSliceIndices,
        );
        return;
    }

    const [from, _to, step, outputSize] = currentDstSlice; // just need start and size
    const [sfrom, _sto, sstep, _soutputSize] = currentSourceSlice; // Will always be subset of dst, so don't need output size just start

    if (dstStrides.length === 1 && sourceStrides.length === 1) {
        if (step === 1 && currentDstStride === 1 && sstep === 1 && currentSourceStride === 1) {
            const values: any = sourceArr.subarray(sfrom, sfrom + outputSize) as ArrayLike<underlyingNumeric>;
            dstArr.set(values, from);
        } else {
            for (let i = 0; i < outputSize; i++) {
                dstArr[currentDstStride * (from + (step * i))] = sourceArr[currentSourceStride * (sfrom + (sstep * i))];
            }
        }
        return;
    }

    for (let i = 0; i < outputSize; i++) {
        // Apply strides as above, using both destination and source-specific strides.
        _setRawArrayFromChunkItem(
            dstArr.subarray(currentDstStride * (from + (i * step))),
            nextDstStrides,
            nextDstSliceIndices,
            sourceArr.subarray(currentSourceStride * (sfrom + (i * sstep))),
            nextSourceStrides,
            nextSourceSliceIndices,
        );
    }
}
