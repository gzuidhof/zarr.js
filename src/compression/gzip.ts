import {Codec} from "./types";
import {ValueError} from "../errors";
import { gzip, ungzip } from "pako";


export type ValidGZipLevelSetting = 0 | 9 | 1 | -1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export class GZip implements Codec {

    public static codecId: "gzip";
    public level: ValidGZipLevelSetting;

    constructor(level: number) {
        if (level < 0 || level > 9) {
            throw new ValueError("Invalid gzip compression level, it should be between 0 and 9");
        }
        this.level = level as ValidGZipLevelSetting;
    }

    encode(buf: Buffer | ArrayBuffer): Buffer | ArrayBuffer {
        const gzipped = gzip(new Uint8Array(buf), {level: this.level});
        return gzipped.buffer;
    }
    
    decode(buf: Buffer | ArrayBuffer, out?: Buffer): Buffer | ArrayBuffer {
        const compressed = ungzip(new Uint8Array(buf))
        if (out !== undefined) {
            out.set(compressed);
            return out;
        }

        return compressed.buffer;
    }
}