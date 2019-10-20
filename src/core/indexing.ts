import { TooManyIndicesError, BoundsCheckError, NegativeStepError } from '../errors';
import { ZarrArray } from './index';
import { Slice, ArraySelection, ChunkDimProjection } from './types';
import { sliceIndices, slice } from "./slice";

function ensureList(selection: number | ArraySelection): ArraySelection {
    if (!Array.isArray(selection)) {
        return [selection];
    }
    return selection;
}

function checkSelectionLength(selection: ArraySelection, shape: number[]) {
    if (selection.length > shape.length) {
        throw new TooManyIndicesError(selection, shape);
    }
}

export function replaceEllipsis(selection: ArraySelection | number, shape: number[]) {
    selection = ensureList(selection);

    let ellipsisIndex = -1;
    let numEllipsis = 0;
    for (let i = 0; i < selection.length; i++) {
        if (selection[i] === "...") {
            ellipsisIndex = i;
            numEllipsis += 1;
        }
    }

    if (numEllipsis > 1) {
        throw new RangeError("an index can only have a single ellipsis ('...')");
    }
    if (numEllipsis === 1) {
        // count how many items to left and right of ellipsis
        const numItemsLeft = ellipsisIndex;
        const numItemsRight = selection.length - (numItemsLeft + 1);
        const numItems = selection.length - 1; // All non-ellipsis items
        if (numItems >= shape.length) {
            // Ellipsis does nothing, just remove it
            selection = selection.filter((x) => x !== "...");
        } else {
            // Replace ellipsis with as many slices are needed for number of dims
            const numNewItems = shape.length - numItems;
            let newItem = selection.slice(0, numItemsLeft).concat(new Array(numNewItems).fill(null));
            if (numItemsRight > 0) {
                newItem = newItem.concat(selection.slice(selection.length - numItemsRight));
            }
            selection = newItem;
        }
    }
    // Fill out selection if not completely specified
    if (selection.length < shape.length) {
        const numMissing = shape.length - selection.length;
        selection = selection.concat(new Array(numMissing).fill(null));
    }

    checkSelectionLength(selection, shape);

    return selection;
}

export function normalizeIntegerSelection(dimSelection: number, dimLength: number): number {
    // Maybe we should convert to integer

    // handle wraparound
    if (dimSelection < 0) {
        dimSelection = dimLength + dimSelection;
    }

    // handle out of bounds
    if (dimSelection >= dimLength || dimSelection < 0) {
        throw new BoundsCheckError(dimLength);
    }

    return dimSelection;
}

function isInteger(s: any) {
    return typeof s === "number";
}

function isIntegerArray(s: any) {
    if (!Array.isArray(s)) {
        return false;
    }
    for (const e of s) {
        if (typeof e !== "number") {
            return false;
        }
    }
    return true;
}

function isSlice(s: (Slice | number | number[] | "..." | ":" | null)): boolean {
    if (s !== null && s as any["_slice"] === true) {
        return true;
    }
    return false;
}

function isContiguousSlice(s: (Slice | number | number[] | "..." | ":" | null)): boolean {
    return isSlice(s) && ((s as Slice).step === null || (s as Slice).step === 1);
}

function isPositiveSlice(s: (Slice | number | number[] | "..." | ":" | null)): boolean {
    return isSlice(s) && ((s as Slice).step === null || ((s as Slice).step as number) >= 1);
}

function isContiguousSelection(selection: ArraySelection) {
    selection = ensureList(selection);

    for (let i = 0; i < selection.length; i++) {
        const s = selection[i];
        if (!(isIntegerArray(s) || isContiguousSlice(s) || s === "...")) {
            return false;
        }
    }
    return true;
}

function isBasicSelection(selection: ArraySelection): boolean {
    selection = ensureList(selection);

    for (let i = 0; i < selection.length; i++) {
        const s = selection[i];
        if (!(isInteger(s) || isPositiveSlice(s))) {
            return false;
        }
    }
    return true;
}


export class BasicIndexer {

    constructor(selection: ArraySelection, array: ZarrArray) {
        selection = replaceEllipsis(selection, array.shape);

        // TODO
    }
}

class IntDimIndexer {
    dimSelection: number;
    dimLength: number;
    dimChunkLength: number;
    numItems: number;

    constructor(dimSelection: number, dimLength: number, dimChunkLength: number) {
        dimSelection = normalizeIntegerSelection(dimSelection, dimLength);
        this.dimSelection = dimSelection;
        this.dimLength = dimLength;
        this.dimChunkLength = dimChunkLength;
        this.numItems = 1;
    }

    * iter(): Generator<ChunkDimProjection> {
        const dimChunkIndex = Math.floor(this.dimSelection / this.dimChunkLength);
        const dimOffset = dimChunkIndex * this.dimChunkLength;
        const dimChunkSelection = this.dimSelection - dimOffset;
        const dimOutSelection = null;
        yield {
            dimChunkIndex,
            dimChunkSelection,
            dimOutSelection,
        };
    }
}

class SliceDimIndexer {
    dimLength: number;
    dimChunkLength: number;
    numItems: number;
    numChunks: number;

    start: number;
    stop: number;
    step: number;

    constructor(dimSelection: Slice, dimLength: number, dimChunkLength: number) {
        // Normalize
        const [start, stop, step] = sliceIndices(dimSelection, dimLength);
        this.start = start;
        this.stop = stop;
        this.step = step;
        if (this.step < 1) {
            throw new NegativeStepError();
        }

        this.dimLength = dimLength;
        this.dimChunkLength = dimChunkLength;
        this.numItems = Math.max(0, Math.ceil((this.stop - this.start) / this.step));
        this.numChunks = Math.ceil(this.dimLength / this.dimChunkLength);
    }

    * iter(): Generator<ChunkDimProjection> {
        const dimChunkIndexFrom = Math.floor(this.start / this.dimChunkLength);
        const dimChunkIndexTo = Math.ceil(this.stop / this.dimChunkLength);

        // Iterate over chunks in range
        for (let dimChunkIndex = dimChunkIndexFrom; dimChunkIndex < dimChunkIndexTo; dimChunkIndex++) {

            // Compute offsets for chunk within overall array
            const dimOffset = dimChunkIndex * this.dimChunkLength;
            const dimLimit = Math.min(this.dimLength, (dimChunkIndex + 1) * this.dimChunkLength);

            // Determine chunk length, accounting for trailing chunk
            const dimChunkLength = dimLimit - dimOffset;

            let dimChunkSelStart: number;
            let dimChunkSelStop: number;
            let dimOutOffset: number;

            if (this.start < dimOffset) {
                // Selection starts before current chunk

                dimChunkSelStart = 0;
                const remainder = (dimOffset - this.start) % this.step;
                if (remainder > 0) {
                    dimChunkSelStart += this.step - remainder;
                }
                // Compute number of previous items, provides offset into output array
                dimOutOffset = Math.ceil((dimOffset - this.start) / this.step);
            } else {
                // Selection starts within current chunk
                dimChunkSelStart = this.start - dimOffset;
                dimOutOffset = 0;
            }

            if (this.stop > dimLimit) {
                // Selection ends after current chunk
                dimChunkSelStop = dimChunkLength;
            } else {
                // Selection ends within current chunk
                dimChunkSelStop = this.stop - dimOffset;
            }

            const dimChunkSelection = slice(dimChunkSelStart, dimChunkSelStop, this.step);
            const dimChunkNumItems = Math.ceil((dimChunkSelStop - dimChunkSelStart) / this.step);
            const dimOutSelection = slice(dimOutOffset, dimOutOffset + dimChunkNumItems);
            yield {
                dimChunkIndex,
                dimChunkSelection,
                dimOutSelection,
            };
        }

    }




}