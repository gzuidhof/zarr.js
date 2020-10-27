import type { Codec, CompressorConfig } from 'numcodecs';

// TODO: This interface is tied to compressors in numcodecs..
// might be better to just use 'any' or have numcodecs export complete 
// (optional) config? 
interface Options {
  level?: number;
  cname?: string;
  blocksize?: number;
  clevel?: number;
  shuffle?: number;
}

type CodecConstructor = { fromConfig(config: Options & CompressorConfig): Codec };
type CodecImporter = () => CodecConstructor | Promise<CodecConstructor>;

const registry: Map<string, CodecImporter> = new Map();

export function addCodec(id: string, importFn: CodecImporter) {
  registry.set(id, importFn);
}

export async function getCodec<T extends Codec>(config: Options & CompressorConfig): Promise<T> {
  if (!registry.has(config.id)) {
    throw new Error(`Compression codec ${config.id} is not supported by Zarr.js yet.`);
  }
  const codec = await (registry.get(config.id) as CodecImporter)();
  return codec.fromConfig(config) as T;
}
