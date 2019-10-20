
import { TooManyIndicesError, InvalidSliceError, BoundsCheckError } from '../errors';
import { Slice, SliceArgument } from "./types";

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

    if (start !== null && stop !== null && start > stop) {
        throw new InvalidSliceError(start, stop, step, "to is higher than from");
    }

    return {
        start: start === ":" ? null : start,
        stop: stop === ":" ? null : stop,
        step,
        _slice: true,
    };
}

/**
 * Port of slice.indices(n) in Python.
 * https://github.com/python/cpython/blob/master/Objects/sliceobject.c#L166
 */
export function sliceIndices(slice: Slice, length: number): [number, number, number] {
    let start: number;
    let stop: number;
    let step: number;

    if (slice.step === null) {
        step = 1;
    } else {
        step = slice.step;
    }

    if (slice.start === null) {
        start = step < 0 ? length - 1 : 0;
    } else {
        start = slice.start;
        if (start < 0) {
            start += length;
        }
    }

    if (slice.stop === null) {
        stop = step < 0 ? -1 : length;
    } else {
        stop = slice.stop;
        if (stop < 0) {
            stop += length;
        }
    }

    if (stop > length) throw new Error("Stop greater than length");
    if (start >= length) throw new Error("Start greater than or equal to length");
    if (step === 0) throw new Error("Step size 0 is invalid");

    return [start, stop, step];
}