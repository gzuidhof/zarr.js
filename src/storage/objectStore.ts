import { Store, ValidStoreType } from "./types";
import { createProxy, MutableMappingProxy } from "../mutableMapping";

export class ObjectStore<T extends ValidStoreType> implements Store<T> {
    listDir?: undefined;
    rmDir?: undefined;
    getSize?: undefined;
    rename?: undefined;

    public object: {
        [key: string]: T,
    };

    constructor() {
        this.object = {};
    }

    getItem(item: string): T {
        if (!this.object.hasOwnProperty(item)) {
            throw new Error(`Item ${item} not in store`);
        }
        return this.object[item];
    }
    setItem(item: string, value: T): boolean {
        this.object[item] = value;
        return true;
    }
    deleteItem(item: string): boolean {
        return delete this.object[item];
    }
    containsItem(item: string): boolean {
        return this.object.hasOwnProperty(item);
    }
    proxy(): MutableMappingProxy<T> {
        return createProxy(this);
    }
    keys(): string[] {
        return Object.getOwnPropertyNames(this.object);
    }
}