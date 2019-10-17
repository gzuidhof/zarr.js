import { normalizeStoragePath } from "../util";
import { Store, StoreProxy } from "./types";

/**
 * A store proxy allows for accessing, setting and deleting the keys in the store using
 * store.["a"] or even store.a notation.
 */
export function createProxyForStore<S, T>(store: S & Store<T>): S & StoreProxy<T> {
    return new Proxy(store as S & Store<T> & StoreProxy<T>, {
        set(target, key, value, receiver) {
            return target.setItem(key as string, value)
        },
        get(target, key, receiver) {
            return target.getItem(key as string);
        },
        deleteProperty(target, key) {
            return target.deleteItem(key as string);
        },
    });
}

export function pathToPrefix(path: string): string {
    // assume path already normalized
    if (path.length > 0) {
        return path + '/';
    }
    return '';
}

function listDirFromKeys(store: Store<any>, path: string): string[] {
    // assume path already normalized
    const prefix = pathToPrefix(path);
    const children = new Set<string>();

    for (const key in store.keys()) {
        if (key.startsWith(prefix) && key.length > prefix.length) {
            const suffix = key.slice(prefix.length);
            const child = suffix.split('/')[0];
            children.add(child);
        }
    }
    return Array.from(children).sort();
}

/**
 * """Obtain a directory listing for the given path. If `store` provides a `listDir`
    method, this will be called, otherwise will fall back to implementation via the
    `MutableMapping` interface."""
 * @param store 
 */
export function listDir(store: Store<any>, path?: string): string[] {
    if (path === undefined) {
        path = "";
    }
    path = normalizeStoragePath(path);
    if (store.listDir) {
        return store.listDir(path);
    } else {
        return listDirFromKeys(store, path);
    }
}