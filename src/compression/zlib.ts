import {Codec} from "./types";
import {ValueError} from "../errors";
import { inflate, deflate, Inflate } from "pako";


export type ValidZlibLevelSetting = 0 | 9 | 1 | -1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export class Zlib implements Codec {

    public static codecId: "zlib";
    public level: ValidZlibLevelSetting;

    constructor(level: number) {
        if (level < -1 || level > 9) {
            throw new ValueError("Invalid zlib compression level, it should be between -1 and 9");
        }
        this.level = level as ValidZlibLevelSetting;
    }

    encode(buf: Buffer | ArrayBuffer): Buffer | ArrayBuffer {
        const gzipped = deflate(new Uint8Array(buf), {level: this.level});
        return gzipped.buffer;
    }
    
    decode(buf: Buffer | ArrayBuffer, out?: Buffer): Buffer | ArrayBuffer {
        const compressed = inflate(new Uint8Array(buf))
        if (out !== undefined) {
            out.set(compressed);
            return out;
        }

        return compressed.buffer;
    }
}