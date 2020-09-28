export { addCodec, getCodec } from "./compression/registry";
export { createProxy } from "./mutableMapping";
export * from "./creation";
export * from "./errors";
export * from "./hierarchy";

// export * from "./types";

export { ZarrArray } from "./core";
export { slice, sliceIndices } from "./core/slice";
// export * from "./core/types";

export { NestedArray, rangeTypedArray } from "./nestedArray";
export * from "./nestedArray/types";

export * from "./storage/memoryStore";
export * from "./storage/objectStore";
export * from "./storage/httpStore";
