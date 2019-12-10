import { CompressorConfig } from "../types";
import { GZip } from "./gzip";
import { Zlib } from "./zlib";
import { Codec } from "./types";

export function getCodec(config: CompressorConfig & {level: number}): Codec {
    if (config.id === GZip.codecId) {
        return new GZip(config.level);
    } else if (config.id === Zlib.codecId) {
        return new Zlib(config.level);
    } else {
        throw new Error(`Compression codec ${config.id} is not supported by Zarr.js yet.`);
    }
}
