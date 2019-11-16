
import { InvalidSliceError } from '../errors';
import { Slice, SliceArgument, SliceIndices } from "./types";

export function slice(start: SliceArgument, stop: SliceArgument | undefined = undefined, step: number | null = null): Slice {
    start = start;

    // tslint:disable-next-line: strict-type-predicates
    if (start === undefined) { // Not possible in typescript
        throw new InvalidSliceError(start, stop, step, "The first argument must not be undefined");
    }

    if ((typeof start === "string" && start !== ":") || (typeof stop === "string" && stop !== ":")) { // Note in typescript this will never happen with type checking.
        throw new InvalidSliceError(start, stop, step, "Arguments can only be integers, \":\" or null");
    }

    // slice(5) === slice(null, 5)
    if (stop === undefined) {
        stop = start;
        start = null;
    }

    // if (start !== null && stop !== null && start > stop) {
    //     throw new InvalidSliceError(start, stop, step, "to is higher than from");
    // }

    return {
        start: start === ":" ? null : start,
        stop: stop === ":" ? null : stop,
        step,
        _slice: true,
    };
}


/**
 * Port of adjustIndices
 * https://github.com/python/cpython/blob/master/Objects/sliceobject.c#L243
 */
function adjustIndices(start: number, stop: number, step: number, length: number) {
    if (start < 0) {
        start += length;
        if (start < 0) {
            start = (step < 0) ? -1 : 0;
        }
    } else if (start >= length) {
        start = (step < 0) ? length - 1 : length;
    }

    if (stop < 0) {
        stop += length;
        if (stop < 0) {
            stop = (step < 0) ? -1 : 0;
        }
    } else if (stop >= length) {
        stop = (step < 0) ? length - 1 : length;
    }

    if (step < 0) {
        if (stop < start) {
            const length = Math.floor((start - stop - 1) / (-step) + 1);
            return [start, stop, step, length];
        }
    } else {
        if (start < stop) {
            const length = Math.floor((stop - start - 1) / step + 1);
            return [start, stop, step, length];
        }
    }
    return [start, stop, step, 0];
}

/**
 * Port of slice.indices(n) and PySlice_Unpack
 * https://github.com/python/cpython/blob/master/Objects/sliceobject.c#L166
 *  https://github.com/python/cpython/blob/master/Objects/sliceobject.c#L198 
 * 
 * Behaviour might be slightly different as it's a weird hybrid implementation.
 */
export function sliceIndices(slice: Slice, length: number): SliceIndices {
    let start: number;
    let stop: number;
    let step: number;

    if (slice.step === null) {
        step = 1;
    } else {
        step = slice.step;
    }

    if (slice.start === null) {
        start = step < 0 ? Number.MAX_SAFE_INTEGER : 0;
    } else {
        start = slice.start;
        if (start < 0) {
            start += length;
        }
    }

    if (slice.stop === null) {
        stop = step < 0 ? -Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
    } else {
        stop = slice.stop;
        if (stop < 0) {
            stop += length;
        }
    }

    // This clips out of bounds slices
    let s = adjustIndices(start, stop, step, length);
    start = s[0];
    stop = s[1];
    step = s[2];
    // The output length
    length = s[3];


    // With out of bounds slicing these two assertions are not useful.
    // if (stop > length) throw new Error("Stop greater than length");
    // if (start >= length) throw new Error("Start greater than or equal to length");

    if (step === 0) throw new Error("Step size 0 is invalid");

    return [start, stop, step, length];
}