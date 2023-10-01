import { SyncStore, ValidStoreType } from "./types";
import { createProxy, MutableMappingProxy } from "../mutableMapping";
import { KeyError } from "../errors";

export class MemoryStore<T extends ValidStoreType> implements SyncStore<T, undefined> {
    listDir?: undefined;
    rmDir?: undefined;
    getSize?: undefined;
    rename?: undefined;

    root: { [key: string]: any };

    constructor(root = {}) {
        this.root = root;
    }

    public proxy(): MutableMappingProxy<T> {
        return createProxy(this);
    }

    private getParent(item: string): [any, string] {
        let parent = this.root;
        const segments = item.split('/');
        // find the parent container
        for (const k of segments.slice(0, segments.length - 1)) {
            parent = parent[k];
            if (!parent) {
                throw Error(item);
            }
            // if not isinstance(parent, self.cls):
            //     raise KeyError(item)
        }
        return [parent, segments[segments.length - 1]];
    }

    private requireParent(item: string): [any, string] {
        let parent = this.root;
        const segments = item.split('/');

        // require the parent container
        for (const k of segments.slice(0, segments.length - 1)) {
            // TODO: verify correct implementation
            if (parent[k] === undefined) {
                parent[k] = {};
            }
            parent = parent[k];
        }

        return [parent, segments[segments.length - 1]];
    }

    getItem(item: string) {
        const [parent, key] = this.getParent(item);
        const value = parent[key];
        if (value === undefined) {
            throw new KeyError(item);
        }
        return value;
    }

    setItem(item: string, value: any): boolean {
        const [parent, key] = this.requireParent(item);
        parent[key] = value;
        return true;
    }

    deleteItem(item: string): boolean {
        const [parent, key] = this.getParent(item);
        return delete parent[key];
    }

    containsItem(item: string): boolean {
        // TODO: more sane implementation
        try {
            return this.getItem(item) !== undefined;
        } catch (e) {
            return false;
        }
    }

    keys(): string[] {
        throw new Error("Method not implemented.");
    }


}