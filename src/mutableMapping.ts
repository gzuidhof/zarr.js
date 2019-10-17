export interface MutableMapping<T> {
    getItem(item: string): T;
    setItem(item: string, value: T): boolean;
    deleteItem(item: string): boolean;
    containsItem(item: string): boolean;

    getProxy(): this & MutableMappingProxy<T>;

    // length(): number;
}

export interface MutableMappingProxy<T> {
    [key: string]: T;
}

/**
 * A proxy allows for accessing, setting and deleting the keys in the mutable mapping using
 * m["a"] or even m.a notation.
 */
export function createProxy<S, T>(mapping: S & MutableMapping<T>): S & MutableMappingProxy<T> {
    return new Proxy(mapping as S & MutableMapping<T> & MutableMappingProxy<T>, {
        set(target, key, value, receiver) {
            return target.setItem(key as string, value)
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