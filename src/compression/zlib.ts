import { Codec } from "./types";
import { ValueError } from "../errors";
import pako from "pako";

export type ValidZlibLevelSetting = 0 | 9 | 1 | -1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export class Zlib implements Codec {

    public static codecId = "zlib";
    public level: ValidZlibLevelSetting;

    constructor(level: number) {
        if (level < -1 || level > 9) {
            throw new ValueError("Invalid zlib compression level, it should be between -1 and 9");
        }
        this.level = level as ValidZlibLevelSetting;
    }

    encode(data: Uint8Array): Uint8Array {
        const gzipped = pako.deflate(data, { level: this.level });
        return gzipped;
    }

    decode(data: Uint8Array, out?: Uint8Array): Uint8Array {
        const uncompressed = pako.inflate(data);
        if (out !== undefined) {
            out.set(uncompressed);
            return out;
        }

        return uncompressed;
    }
}
