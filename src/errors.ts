export class ContainsArrayError extends Error {
    constructor(path: string) {
        super(`path ${path} contains an array`);
    }
}

export class ContainsGroupError extends Error {
    constructor(path: string) {
        super(`path ${path} contains a group`);
    }
}

export class ArrayNotFoundError extends Error {
    constructor(path: string) {
        super(`array not found at path ${path}`);
    }
}

export class GroupNotFoundError extends Error {
    constructor(path: string) {
        super(`ground not found at path ${path}`);
    }
}

export class PathNotFoundError extends Error {
    constructor(path: string) {
        super(`nothing not found at path ${path}`);
    }
}

export class PermissionError extends Error {
    constructor(message: string) {
        super(message);
    }
}

export class KeyError extends Error {
    constructor(key: string) {
        super(`key ${key} not present`);
    }
}

export class TooManyIndicesError extends RangeError {
    constructor(selection: any[], shape: number[]) {
        super(`too many indices for array; expected ${shape.length}, got ${selection.length}`);
    }
}

export class BoundsCheckError extends RangeError {
    constructor(dimLength: number) {
        super(`index out of bounds for dimension with length ${dimLength}`);
    }
}

export class InvalidSliceError extends RangeError {
    constructor(from: any, to: any, stepSize: any, reason: any) {
        super(`slice arguments slice(${from}, ${to}, ${stepSize}) invalid: ${reason}`);
    }
}

export class NegativeStepError extends Error {
    constructor() {
        super(`Negative step size is not supported when indexing.`);
    }
}

export class ValueError extends Error {
    constructor(message: string) {
        super(message);
    }
}