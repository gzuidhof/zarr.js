// Custom error messages, note we have to patch the prototype of the
// errors to fix `instanceof` calls, see:
// https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work

export class ContainsArrayError extends Error {
    constructor(path: string) {
        super(`path ${path} contains an array`);
        Object.setPrototypeOf(this, ContainsArrayError.prototype);
    }
}

export class ContainsGroupError extends Error {
    constructor(path: string) {
        super(`path ${path} contains a group`);
        Object.setPrototypeOf(this, ContainsGroupError.prototype);
    }
}

export class ArrayNotFoundError extends Error {
    constructor(path: string) {
        super(`array not found at path ${path}`);
        Object.setPrototypeOf(this, ArrayNotFoundError.prototype);
    }
}

export class GroupNotFoundError extends Error {
    constructor(path: string) {
        super(`ground not found at path ${path}`);
        Object.setPrototypeOf(this, GroupNotFoundError.prototype);
    }
}

export class PathNotFoundError extends Error {
    constructor(path: string) {
        super(`nothing not found at path ${path}`);
        Object.setPrototypeOf(this, PathNotFoundError.prototype);
    }
}

export class PermissionError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, PermissionError.prototype);
    }
}

export class KeyError extends Error {
    constructor(key: string) {
        super(`key ${key} not present`);
        Object.setPrototypeOf(this, KeyError.prototype);
    }
}

export class TooManyIndicesError extends RangeError {
    constructor(selection: any[], shape: number[]) {
        super(`too many indices for array; expected ${shape.length}, got ${selection.length}`);
        Object.setPrototypeOf(this, TooManyIndicesError.prototype);
    }
}

export class BoundsCheckError extends RangeError {
    constructor(dimLength: number) {
        super(`index out of bounds for dimension with length ${dimLength}`);
        Object.setPrototypeOf(this, BoundsCheckError.prototype);
    }
}

export class InvalidSliceError extends RangeError {
    constructor(from: any, to: any, stepSize: any, reason: any) {
        super(`slice arguments slice(${from}, ${to}, ${stepSize}) invalid: ${reason}`);
        Object.setPrototypeOf(this, InvalidSliceError.prototype);
    }
}

export class NegativeStepError extends Error {
    constructor() {
        super(`Negative step size is not supported when indexing.`);
        Object.setPrototypeOf(this, NegativeStepError.prototype);
    }
}

export class ValueError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, ValueError.prototype);
    }
}

export class HTTPError extends Error {
    constructor(code: string) {
      super(code);
      Object.setPrototypeOf(this, HTTPError.prototype);
    }
  }
