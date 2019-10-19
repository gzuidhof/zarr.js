import { MutableMapping } from "../mutableMapping";

export type ValidStoreType = Buffer | string;

export interface Store<T extends ValidStoreType> extends MutableMapping<T> {
    listDir?: (path?: string) => string[];
    keys(): string[];
}