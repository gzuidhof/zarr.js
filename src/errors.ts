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