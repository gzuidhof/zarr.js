import { GZip, Zlib, Blosc } from 'numcodecs';
import type { Codec, CompressorConfig } from 'numcodecs';

const registry = new Map()
  .set(Zlib.codecId, Zlib)
  .set(GZip.codecId, GZip)
  .set(Blosc.codecId, Blosc);

interface Options {
  level?: number;
  cname?: string;
  blocksize?: number;
  clevel?: number;
  shuffle?: number;
}

export function getCodec<T extends Codec>(config: Options & CompressorConfig): T {
  if (!registry.has(config.id)) {
    throw new Error(`Compression codec ${config.id} is not supported by Zarr.js yet.`);
  }
  const codec = registry.get(config.id);
  return codec.fromConfig(config) as T;
}
