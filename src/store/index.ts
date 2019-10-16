import { normalizeStoragePath } from "../util";
import { Store } from "./types";

function pathToPrefix(path?: string): string {
    // assume path already normalized
    if (path) {
        return path + '/';
    }
    return '';
}

function listDirFromKeys(store: Store, path?: string): string[] {
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
function listDir(store: Store, path?: string): string[] {
    path = normalizeStoragePath(path);
    if (store.listDir) {
        return store.listDir(path);
    } else {
        return listDirFromKeys(store, path);
    }
}