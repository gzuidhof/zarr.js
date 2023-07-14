export interface ZarrError {
    __zarr__: string;
}

function isZarrError(err: unknown): err is ZarrError {
    return typeof err === 'object' && err !== null && '__zarr__' in err;
}

export function isKeyError(o: unknown) {
    return isZarrError(o) && o.__zarr__ === 'KeyError';
}

// Custom error messages, note we have to patch the prototype of the
// errors to fix `instanceof` calls, see:
// https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
export class ContainsArrayError extends Error implements ZarrError {
    __zarr__ = 'ContainsArrayError';
    constructor(path: string) {
        super(`path ${path} contains an array`);
        Object.setPrototypeOf(this, ContainsArrayError.prototype);
    }
}

export class ContainsGroupError extends Error implements ZarrError {
    __zarr__ = 'ContainsGroupError';
    constructor(path: string) {
        super(`path ${path} contains a group`);
        Object.setPrototypeOf(this, ContainsGroupError.prototype);
    }
}

export class ArrayNotFoundError extends Error implements ZarrError {
    __zarr__ = 'ArrayNotFoundError';
    constructor(path: string) {
        super(`array not found at path ${path}`);
        Object.setPrototypeOf(this, ArrayNotFoundError.prototype);
    }
}

export class GroupNotFoundError extends Error implements ZarrError {
    __zarr__ = 'GroupNotFoundError';
    constructor(path: string) {
        super(`group not found at path ${path}`);
        Object.setPrototypeOf(this, GroupNotFoundError.prototype);
    }
}

export class PathNotFoundError extends Error implements ZarrError {
    __zarr__ = 'PathNotFoundError';
    constructor(path: string) {
        super(`nothing found at path ${path}`);
        Object.setPrototypeOf(this, PathNotFoundError.prototype);
    }
}

export class PermissionError extends Error implements ZarrError {
    __zarr__ = 'PermissionError';
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, PermissionError.prototype);
    }
}

export class KeyError extends Error implements ZarrError {
    __zarr__ = 'KeyError';
    constructor(key: string) {
        super(`key ${key} not present`);
        Object.setPrototypeOf(this, KeyError.prototype);
    }
}

export class TooManyIndicesError extends RangeError implements ZarrError {
    __zarr__ = 'TooManyIndicesError';
    constructor(selection: any[], shape: number[]) {
        super(`too many indices for array; expected ${shape.length}, got ${selection.length}`);
        Object.setPrototypeOf(this, TooManyIndicesError.prototype);
    }
}

export class BoundsCheckError extends RangeError implements ZarrError {
    __zarr__ = 'BoundsCheckError';
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, BoundsCheckError.prototype);
    }
}

export class InvalidSliceError extends RangeError implements ZarrError {
    __zarr__ = 'InvalidSliceError';
    constructor(from: any, to: any, stepSize: any, reason: any) {
        super(`slice arguments slice(${from}, ${to}, ${stepSize}) invalid: ${reason}`);
        Object.setPrototypeOf(this, InvalidSliceError.prototype);
    }
}

export class NegativeStepError extends Error implements ZarrError {
    __zarr__ = 'NegativeStepError';
    constructor() {
        super(`Negative step size is not supported when indexing.`);
        Object.setPrototypeOf(this, NegativeStepError.prototype);
    }
}

export class ValueError extends Error implements ZarrError {
    __zarr__ = 'ValueError';
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, ValueError.prototype);
    }
}

export class HTTPError extends Error implements ZarrError {
    __zarr__ = 'HTTPError';
    constructor(code: string) {
        super(code);
        Object.setPrototypeOf(this, HTTPError.prototype);
    }
}
