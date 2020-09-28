import { Zlib, GZip, Blosc } from 'numcodecs';
import { addCodec } from './zarr-core';

addCodec(Zlib.codecId, () => Zlib);
addCodec(GZip.codecId, () => GZip);
addCodec(Blosc.codecId, () => Blosc);

export * from './zarr-core';
