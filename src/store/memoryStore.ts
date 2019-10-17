import { Store, StoreProxy } from "./types";
import { createProxyForStore } from ".";

export class MemoryStore<T> implements Store<T> {
    listDir?= undefined;
    root: { [key: string]: any };

    constructor(root = {}) {
        this.root = root;
    }

    public getProxy(): this & StoreProxy<T> {
        return createProxyForStore(this);
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
        const segments = item.split('/')

        // require the parent container
        for (const k of segments.slice(0, segments.length - 1)) {
            // TODO: verify correct implementation
            if (parent[k] === undefined) {
                parent[k] = {};
            }
            parent = parent[k];
        }

        return [parent, segments[segments.length - 1]]
    }

    getItem(item: string) {
        const [parent, key] = this.getParent(item)
        const value = parent[key];
        if (value === undefined) {
            throw new Error(`Item ${item} not in store`);
        }
        return value
    }

    setItem(item: string, value: any): boolean {
        const [parent, key] = this.requireParent(item)
        parent[key] = value;
        return true
    }

    deleteItem(item: string): boolean {
        const [parent, key] = this.getParent(item);
        return delete parent[key];
    }

    keys(): string[] {
        throw new Error("Method not implemented.");
    }


}