export interface MutableMapping<T> {
    getItem(item: string): T;
    setItem(item: string, value: T): boolean;
    deleteItem(item: string): boolean;

    keys(): string[];
    // length(): number;
    // contains(): boolean;
}

export interface Store<T> extends MutableMapping<T> {
    listDir?: (path?: string) => string[];
    getProxy(): this & StoreProxy<T>;
}

export interface StoreProxy<T> {
    [key: string]: T;
}
