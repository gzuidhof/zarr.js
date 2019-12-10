import { TypedArray } from "../zarr";

export abstract class Codec {
    static codecId: string;
    abstract encode(data: Uint8Array): ArrayBuffer;
    abstract decode(data: Uint8Array, out?: Uint8Array): ArrayBuffer;
}
