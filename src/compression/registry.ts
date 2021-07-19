import type { Codec, CodecConstructor } from 'numcodecs';

type Config = Record<string, unknown>;
type CodecImporter = () => CodecConstructor<Config> | Promise<CodecConstructor<Config>>;

const registry: Map<string, CodecImporter> = new Map();

export function addCodec(id: string, importFn: CodecImporter) {
  registry.set(id, importFn);
}

export async function getCodec(config: Config & { id: string }): Promise<Codec> {
  if (!registry.has(config.id)) {
    throw new Error(`Compression codec ${config.id} is not supported by Zarr.js yet.`);
  }
  const codec = await registry.get(config.id)!();
  return codec.fromConfig(config);
}
