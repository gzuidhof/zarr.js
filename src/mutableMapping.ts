/**
 * Closely resembles the functions on the MutableMapping type in Python.
 */
export interface MutableMapping<T> {
    getItem(item: string): T;
    setItem(item: string, value: T): boolean;
    deleteItem(item: string): boolean;
    containsItem(item: string): boolean;

    proxy(): MutableMappingProxy<T>;

    // length(): number;
}

/**
 * Closely resembles the functions on the MutableMapping type in Python.
 */
export interface AsyncMutableMapping<T> {
    getItem(item: string): Promise<T>;
    setItem(item: string, value: T): Promise<boolean>;
    deleteItem(item: string): Promise<boolean>;
    containsItem(item: string): Promise<boolean>;
    // length(): number;
}

export interface MutableMappingProxy<T> {
    [key: string]: T;
}

export interface AsyncMutableMappingProxy<T> {
    [key: string]: T | Promise<T>;
}


/**
 * A proxy allows for accessing, setting and deleting the keys in the mutable mapping using
 * m["a"] or even m.a notation.
 */
export function createProxy<S, T>(mapping: S & MutableMapping<T>): (S & MutableMappingProxy<T>);
export function createProxy<S, T>(mapping: S & AsyncMutableMapping<T>): (S & AsyncMutableMappingProxy<T>);
export function createProxy<S, T>(mapping: (S & MutableMapping<T>) | (S & AsyncMutableMapping<T>)): (S & MutableMappingProxy<T>) | (S & AsyncMutableMappingProxy<T>) {
    return new Proxy(mapping as any, {
        set(target, key, value, receiver) {
            return target.setItem(key as string, value);
        },
        get(target, key, receiver) {
            return target.getItem(key as string);
        },
        deleteProperty(target, key) {
            return target.deleteItem(key as string);
        },
        has(target, key) {
            return target.containsItem(key as string);
        }
    });
}