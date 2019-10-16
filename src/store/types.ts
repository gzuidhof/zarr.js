export interface MutableMapping {
    getItem(item: string): any;
    setItem(item: string, value: any): void;
    deleteItem(item: string): void;

    keys(): string[];
    // length(): number;
    // contains(): boolean;
}

export interface Store extends MutableMapping {
    listDir?: (path?: string) => string[];
}