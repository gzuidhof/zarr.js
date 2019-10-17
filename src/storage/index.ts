import { normalizeStoragePath } from "../util";
import { Store } from "./types";
import { ARRAY_META_KEY, GROUP_META_KEY } from '../names';


/**
 * Return true if the store contains an array at the given logical path.
 */
export function containsArray<T>(store: Store<T>, path: string | null = null) {
    path = normalizeStoragePath(path);
    const prefix = pathToPrefix(path);
    const key = prefix + ARRAY_META_KEY;
    return store.containsItem(key);
}

/**
 * Return true if the store contains a group at the given logical path.
 */
export function containsGroup<T>(store: Store<T>, path: string | null = null) {
    path = normalizeStoragePath(path);
    const prefix = pathToPrefix(path);
    const key = prefix + GROUP_META_KEY;
    return store.containsItem(key);
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
 * Obtain a directory listing for the given path. If `store` provides a `listDir`
 *  method, this will be called, otherwise will fall back to implementation via the
 *  `MutableMapping` interface.
 * @param store 
 */
export function listDir(store: Store<any>, path: string | null = null): string[] {
    path = normalizeStoragePath(path);
    if (store.listDir) {
        return store.listDir(path);
    } else {
        return listDirFromKeys(store, path);
    }
}