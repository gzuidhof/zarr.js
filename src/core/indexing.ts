import { TooManyIndicesError, InvalidSliceError } from '../errors';



type ArraySelection = (Slice | number | number[] | "..." | ":")[];
type SliceArgument = number | ":" | null;

interface Slice {
    from: number | null;
    to: number | null;
    step: number;
    isSlice: true;
}

export function slice(from: SliceArgument, to: SliceArgument | undefined = undefined, step: 1 = 1): Slice {
    from = from;

    if (from === undefined) {
        throw new InvalidSliceError(from, to, step, "The first argument must not be undefined");
    }

    if ((typeof from === "string" && from !== ":") || (typeof to === "string" && to !== ":")) { // Note in typescript this will never happen with type checking.
        throw new InvalidSliceError(from, to, step, "Arguments can only be integers, \":\" or null");
    }

    // slice(5) === slice(null, 5)
    if (to === undefined) {
        to = from;
        from = null;
    }

    if (step !== 1) {
        throw new Error("Not implemented yet: only step size 1 is supported right now, step argument will be ignored");
    }

    if (from !== null && to !== null && from > to) {
        throw new InvalidSliceError(from, to, step, "to is higher than from");
    }

    return {
        from: from === ":" ? null : from,
        to: to === ":" ? null : to,
        step,
        isSlice: true,
    };
}

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