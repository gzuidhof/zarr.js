import { MutableMapping } from "../mutableMapping";

export interface Store<T> extends MutableMapping<T> {
    listDir?: (path?: string) => string[];
    keys(): string[];
}